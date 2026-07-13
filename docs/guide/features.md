# Features

A detailed look at what VGate provides across its four components.

## Proxy protocol & transports

The VLESS inbound (`server/`) is built on top of [xray-core](https://github.com/XTLS/Xray-core)
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
- An **Alipay notify** endpoint (`/billing/alipay/notify`) closes orders on payment.
- An expired-order closer runs every 5 minutes.

## Traffic accounting

- Proxy nodes maintain **per-user delta traffic counters** (`traffic.go`).
- `GetAndResetTraffic` returns accumulated deltas and resets them.
- The manager aggregates traffic **hourly** and enforces **daily quotas**.
- Admins can view traffic stats per user and per node.

## Two frontends

- **Admin Console** — manage nodes, users, plans, orders, traffic, announcements, and
  system config; view stats.
- **User Portal** — customers log in, see their profile, subscribe to plans, view their
  subscription and usage.

Both are Vue 3 + Vite + TypeScript with Element Plus, Pinia, Vue Router, and Axios. In dev, Vite
proxies `/api` → `http://localhost:8081` to avoid CORS. The API base URL is read at runtime from
`window.__ENV__.API_BASE_URL` (injected by `public/env.js`), so you can repoint the backend
after deploy without rebuilding.

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
