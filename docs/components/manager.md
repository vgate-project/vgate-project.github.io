# Manager (Backend API)

The `vgate-manager/` component is the control plane: a Go service (Gin + GORM) that owns users, nodes,
plans, orders, traffic, and system config — including per-user and per-node speed caps — and exposes
both the human-facing REST API and the node data plane.

Source: [github.com/vgate-project/vgate-manager](https://github.com/vgate-project/vgate-manager)

## Build & run

```bash
cd vgate-manager
go build -o vgate-manager .
./vgate-manager --config config.yml     # defaults to ./config.yml; HTTP on server.port (8081)
```

Other commands (cobra subcommands):

```bash
vgate-manager admin create --username X --password Y --role admin|super_admin
```

Data migrations run automatically on startup (`cmd/migrate.go`, idempotent). On first start the
DB is auto-migrated and an initial admin is bootstrapped from `admin.bootstrap` in `config.yml`
(default `admin` / `change-me`); the generated password is printed **only once**.

## Test & lint

```bash
go test ./...
go vet ./... && gofmt -l .
```

## Layered structure (`internal/`)

- `api/` — HTTP layer: `router.go` (Gin engine + middleware wiring), `handler/` (one file per
  resource: `admin_node.go`, `admin_user.go`, `server.go`, `user.go`, `order.go`, `plan.go`, …),
  `dto/` (request/response structs). Tests: `admin_test.go`, `server_test.go`, `sub_test.go`,
  auth-level tests.
- `middleware/` — `cors.go`, `jwt.go` (user/admin auth), `node_auth.go` (node token auth),
  `logger.go`, `ratelimit.go`.
- `service/` — business logic: auth, user, node, plan, order/billing, traffic, stats,
  subscription, system_config, email/invite, announcement, telegram, ticket. Many have
  `_test.go`.
- `model/` — GORM models. `util/` — helpers. `wire/` — dependency wiring.
  `pkg/crypto/` — shared crypto (VLESS credential helpers).

## Startup sequence (`run()`)

1. Load config (viper).
2. Open DB (SQLite default via `glebarez/sqlite`, or Postgres via `db.dialect` / `db.dsn`).
3. `AutoMigrate` all GORM models.
4. Run ordered data migrations.
5. Merge DB-backed system-config overrides on top of `config.yml`.
6. Bootstrap the admin.
7. Build router via `api.NewRouter`.
8. Start background tickers: expired-order closer (5 min), hourly traffic aggregation, daily
   quota reset.

## API surface (all under `/api/v1`)

| Group           | Endpoints                                                                                                                          |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------|
| Public / user   | `/user/login`, `/sub/:sub_token`, profile / subscribe / plans / orders, `/billing/:platform/notify` (`alipay`, `wechat`, `stripe`), support tickets, self-service Telegram link |
| Node data plane | `GET /server/config`, `GET /server/users`, `POST /server/traffic`                                                                  |
| Admin           | nodes, users, traffic, stats, system-config, orders, plans, admins, tickets, Telegram broadcast/admin-link                          |
| Health          | `GET /health`                                                                                                                      |

## Auth

- **JWT** access + refresh tokens. Login returns both; a `401` on a protected endpoint triggers
  **one automatic refresh**.
- **Roles**: `admin` vs `super_admin` gate plan/admins endpoints.
- **Node endpoints** use a separate **node token** (`node_auth` middleware).

## Telegram & notifications

The manager can run a Telegram bot that delivers alerts and announcements and lets users and
admins bind their personal accounts for ticket notifications. It is enabled and configured via
DB-backed system config (`TelegramConfig`):

| Key                           | Default  | Meaning                                                       |
|-------------------------------|----------|---------------------------------------------------------------|
| `telegram.enabled`            | `false`  | Master switch for the bot.                                    |
| `telegram.bot_token`          | `""`     | BotFather token (secret).                                    |
| `telegram.bot_username`       | `""`     | Bot `@username`, used to build `/start` deep links.          |
| `telegram.user_bot_enabled`   | `false`  | Allow users to self-bind via deep link.                     |
| `telegram.alert_ticket`       | `false`  | Notify linked admins on new tickets / user replies.         |
| `telegram.alert_announcement` | `false`  | Forward announcements to linked users.                      |
| `telegram.alert_order_paid`   | `false`  | Notify on paid orders (and other alert toggles).            |

Binding uses a `/start <code>` deep link. The code carries a `u_` (user) or `a_` (admin) prefix
so the bot routes the bind to the right account: admins link from **Settings → Telegram** in the
admin console, users from **Settings** in the portal.

When an admin replies to a ticket, the owner is notified on the channel they chose when opening it
(`none` / `email` / `telegram`). Every admin with a linked Telegram account also receives an alert
on each new ticket and user reply.

## Support tickets

Tickets are a lightweight support channel between users and admins.

- **Users** open tickets (`POST /user/tickets`), reply, and can **close their own ticket**
  (`POST /user/tickets/:id/close`). When opening one they pick a notification method
  (`notify_method`: `none` | `email` | `telegram`); if omitted it defaults to `telegram` when
  their account is Telegram-linked, else `none`.
- **Admins** list/view all tickets, reply (`POST /admin/tickets/:id/messages`), and move them
  through a status machine `open → in_progress → resolved → closed`
  (`PUT /admin/tickets/:id/status`). A later user reply reopens a closed ticket.

Admins can also broadcast a message to every linked Telegram user via
`POST /admin/telegram/broadcast` (optionally also published as an announcement).

## Config split

| File / env only     | DB-backed (hot-reloadable) |
|---------------------|----------------------------|
| `server.port`       | `jwt` TTLs                 |
| `db.*`              | `log.level` / `log.format` |
| `jwt.secret`        | `cors.allowed_origins`     |
| `admin.bootstrap.*` | timeouts                   |

viper maps `SERVER_PORT`-style env vars. See [Configuration Reference](../operations/configuration).

## Database

- SQLite by default (`glebarez/sqlite`) — zero external dependencies, great for small deployments.
- Postgres via `db.dialect: postgres` and `db.dsn`.

## Production notes

- Set `jwt.secret` in the config; the bootstrap admin password is shown only once.
- Put the manager behind a reverse proxy (nginx/Caddy) for TLS and to serve the frontends.
- Enable `ratelimit` middleware for public endpoints.
