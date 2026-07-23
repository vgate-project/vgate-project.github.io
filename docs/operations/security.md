# Security

Security notes for operating VGate responsibly.

## Three separated auth domains

VGate deliberately keeps three auth mechanisms apart:

- **User JWT** — for the user portal and `/user/*`.
- **Admin JWT** — for the admin console and `/admin/*`; refreshable, with one silent refresh on
  `401`.
- **Node token** — for the `/server/*` data plane, validated by the `node_auth` middleware.

Never reuse a node token as a user/admin credential or vice versa.

## Secrets

- Set a strong `jwt.secret` in the manager config. It is used to sign all JWTs.
- Set a strong `admin.bootstrap.password` (the bundled `docker-compose.yml` defaults it to
  `change-me`) and store it securely; rotate by creating a new admin and removing the bootstrap
  account.
- Node tokens are issued per node in the admin console; treat them like API keys.

## Transport security

- For the `xtls-rprx-vision` flow, configure **TLS 1.3 or Reality** on the node. Vision is
  incompatible with the `v2` AEAD flow.
- Prefer Reality/TLS on internet-facing nodes to avoid passive inspection.
- The native `tcp` transport applies TLS/Reality via `transport/security.Wrap`.

## Network exposure

- **Manager**: do not expose the manager port directly to the internet. Put it behind a reverse
  proxy and only forward the paths your clients need (`/api/v1`, frontend assets).
- **Server nodes**: only the VLESS listen port (assigned by the manager) needs to be reachable by
  clients. The manager connection is **outbound** from the node.
- **Frontends**: static assets only; they hold no secrets (the API base URL is runtime config).

## CORS

When the manager and a frontend run on different origins, add the frontend origin to the manager's
`cors.allowed_origins` (DB-backed, hot-reloadable). Avoid wildcard `*` in production.

## Rate limiting

Enable the `ratelimit` middleware for public endpoints — especially `/user/login` and
`/billing/:platform/notify` (`alipay`, `wechat`, `stripe`) — to blunt brute force and abuse.

## User portal hardening

- The user portal supports a **Cloudflare Turnstile** field on login — enable it to reduce bot
  signups.
- User access tokens are **not refreshable**; on `401` the client clears the token and redirects
  to `/login`, limiting the blast radius of a leaked token.

## Database

- Use Postgres (not the default SQLite file) for production durability and concurrency.
- Back up the database regularly — it holds users, orders, and traffic history.
- Restrict filesystem access to the SQLite file if you keep the default.

## Updates

- Keep xray-core (the server's VLESS dependency) and dependencies current for protocol and
  CVE fixes.
- The manager auto-migrates safely; review migration code before major version bumps.
