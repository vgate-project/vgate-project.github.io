# Features

A detailed look at what VGate provides across its four components.

## Proxy protocol & transports

The VLESS inbound (`vgate-server/`) is built on top of [xray-core](https://github.com/XTLS/Xray-core)
and supports:

- **VLESS flows**
  - `v0` — plaintext (native).
  - `v2` — AEAD encryption (xray encryption).
  - `xtls-rprx-vision` — xray's Vision flow, requires outer TLS 1.3 or Reality, and is
    incompatible with `v2`.
- **Transports** (via the `transport` abstraction + registry)
  - `tcp` — native transport, with TLS / Reality applied through `transport/security.Wrap`.
  - `ws` — WebSocket, delegating to xray-core's `websocket.ListenWS`.
  - `xhttp` — split-HTTP, delegating to xray-core's `splithttp.ListenXH`.
- **Multiplexing** — TCP / HTTP / WebSocket mux handling.
- **UDP relay** — UDP-over-TCP relay and a Vision relay leaf.

A node's listen port and transport/security are **delivered by the manager**, not written into
the server's local config. They're configured per node in the admin console and hot-reloaded.

## Centralized configuration & hot reload

The manager owns the canonical configuration. Each server node:

1. Calls `GET /server/config` and `GET /server/users` on a `SyncInterval` ticker.
2. Uses HTTP `304` short-circuiting (`If-None-Match`) so unchanged config costs almost nothing.
3. Applies changes through `UpdateConfig` / `UpdateUsers` **without restarting** the process.
4. Reports accumulated per-user traffic via `GetAndResetTraffic` → `POST /server/traffic`.

This means adding a user, revoking a credential, or changing a node's transport takes effect
across the fleet with no SSH and no restarts.

## Identity & access

- **JWT auth** for the admin and user APIs. Login returns both an access token and a refresh
  token. On a `401`, the admin console performs **one automatic silent refresh**.
- **Roles**: `admin` and `super_admin`. `super_admin` is required to manage plans and other
  admins.
- **Node auth**: the node data plane uses a separate **node token** (`node_auth` middleware),
  distinct from user/admin JWTs.
- **User portal**: access tokens are **not refreshable** — on a `401` the client clears the
  token and redirects to `/login`. Login also supports a Cloudflare Turnstile field and a
  `/verify-email` flow.

## Users, plans & subscriptions

- Create users and assign them subscription plans.
- Plans carry **quotas** and **expiry**.
- The user portal and standard client apps consume **subscription links**
  (`GET /sub/:sub_token`).
- Daily quota reset is run by a manager background ticker.

## Billing

- **Orders** and **plans** are first-class resources in the manager.
- A **payment notify** endpoint (`/api/v1/billing/:platform/notify`) closes orders on payment for Alipay, WeChat Pay, and Stripe.
- An expired-order closer runs every 5 minutes.

## Traffic accounting

- Proxy nodes maintain **per-user delta traffic counters** (`traffic.go`).
- `GetAndResetTraffic` returns accumulated deltas and resets them.
- The manager aggregates traffic **hourly** and enforces **daily quotas**.
- Admins can view traffic stats per user and per node.

## Speed limiting

Nodes, plans, and users can carry upload/download speed caps (bytes/sec, `0` = unlimited):

- **Per-node (global)** caps the node's aggregate throughput.
- **Per-plan** caps every user on that plan; editing a plan re-applies its caps to all current subscribers.
- **Per-user** overrides cap an individual user (effective rate is the minimum of the node-global and per-user limits).

The `vgate-server` node enforces the limits locally with token buckets
(`golang.org/x/time/rate`) on both the counting connection and the xtls-rprx-vision path.
The manager stores the caps and delivers them via the node config and the per-user
`GET /server/users` payload.

## Two frontends

- **Admin Console** — manage nodes, users, plans, orders, traffic, announcements, and
  system config; view stats.
- **User Portal** — customers log in, see their profile, subscribe to plans, view their
  subscription and usage.

Both are Vue 3 + Vite + TypeScript with Element Plus, Pinia, Vue Router, and Axios. In dev, Vite
proxies `/api` → `http://localhost:8081` to avoid CORS. The API base URL is read at runtime from
`window.__ENV__.API_BASE_URL` (injected by `public/env.js`), so you can repoint the backend
after deploy without rebuilding.

## Telegram integration

The manager can run a Telegram bot for alerts, announcements, and per-account ticket
notifications. It is configured through DB-backed `telegram.*` system-config keys
(`enabled`, `bot_token`, `bot_username`, `user_bot_enabled`, and the `alert_*` toggles).

- Users and admins bind a personal account via a `/start <code>` deep link. The code's `u_`
  (user) or `a_` (admin) prefix routes the bind to the right account — admins link from **Settings
  → Telegram** in the admin console, users from **Settings** in the portal.
- Linked users and admins can receive ticket replies and forwarded announcements over Telegram.
- Admins can broadcast a message to every linked user (optionally also published as an
  announcement).

## Registration, invites & redemption codes

- **Registration modes** (DB-backed `user.*` keys): open registration, invite-gated
  (`user.register_require_invite`), or restricted to an email-suffix allowlist
  (`user.register_email_suffix_whitelist`). Email verification gates **purchases and proxy
  traffic** (not login): an unverified user can browse but cannot order or consume traffic until
  `email_verified` is true.
- **Trial accounts** (`user.trial_enabled` + `user.trial_quota_bytes` /
  `user.trial_duration_days`): new users can be granted a short, capped trial automatically.
- **Invite codes** (`/admin/invites`): operators issue codes that gate or credit new
  registrations; `invite.default_user_quota` sets the quota granted to invited users.
- **Redemption codes** (`/admin/redemption-codes`, redeemed by users at `/redeem`): operators
  issue codes users apply to claim plans or credit.

## Traffic reminders

DB-backed `reminder.*` keys let the manager notify users when they approach their quota or their
reset date: `reminder.enabled` (master switch), `reminder.pct_threshold` (e.g. `80` — warn at 80%
of `quota_bytes`), `reminder.days_threshold` (warn when ≤ N days remain until reset), and
`reminder.cooldown_days` (minimum gap between reminders per user). Users pick their channel
(`none` / `email` / `telegram`) via `PUT /api/v1/user/reminder-channel`.

## Support tickets

Tickets are a lightweight support channel between users and admins:

- **Users** open tickets, reply to admin responses, and close their own ticket. When opening a
  ticket they choose how they're notified of replies (`none` / `email` / `telegram`), defaulting to
  `telegram` when their account is Telegram-linked, else `none`.
- **Admins** list and view all tickets, reply, and move each through the status machine
  `open → in_progress → resolved → closed`. A later user reply reopens a closed ticket.
- When an admin replies, the ticket owner is notified via the method they chose, and every admin
  with a linked Telegram account gets an alert on new tickets and replies.

## Observability & ops

- Structured logging with configurable `log.level` / `log.format`.
- Configurable CORS `allowed_origins`, timeouts, and JWT TTLs — these are **DB-backed and
  hot-reloadable** via `PUT /api/v1/admin/system-config`.
- Auto-migrating database (SQLite by default via `glebarez/sqlite`, or Postgres via
  `db.dialect` / `db.dsn`).
- Idempotent data migrations on startup; first-start admin bootstrap.

## Security posture

- Separate auth domains: user JWT, admin JWT, node token.
- Reality / TLS 1.3 support for the Vision flow.
- DB-backed system config reduces the need to restart for routine policy changes.
