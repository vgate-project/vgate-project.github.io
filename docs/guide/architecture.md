# Architecture

VGate is a small distributed system with a clear control-plane / data-plane split.

## Components at a glance

```text
┌──────────────────┐         REST /api/v1         ┌──────────────────────────┐
│  Admin Console   │ ───────────────────────────► │                          │
│  (Vue 3, ops)    │                              │      Manager (Go)        │
└──────────────────┘                              │  ┌────────────────────┐   │
                                                  │  │ API / middleware   │   │
┌──────────────────┐         REST /api/v1        │  │ Auth (JWT, roles)  │   │
│  User Portal     │ ───────────────────────────► │  │ Billing / orders   │   │
│  (Vue 3, users)  │                              │  │ Plans / users      │   │
└──────────────────┘                              │  │ Traffic aggregator │   │
                                                  │  │ Nodes / system cfg │   │
┌──────────────────┐    REST /api/v1/server/*    │  └─────────┬──────────┘   │
│  Server (VLESS)  │ ◄───────────────────────────┤     GORM  │ DB             │
│  sync + report   │ ───────────────────────────► │  ┌───────▼─────────────┐  │
│                  │   per-user traffic reports    │  │ SQLite / Postgres   │  │
└────────┬─────────┘                              │  └─────────────────────┘  │
         │ VLESS inbound                          └──────────────────────────┘
         ▼
   Internet clients (VLESS apps)
```

## Manager — the control plane

`vgate-manager/` is a Go service (Gin + GORM). On startup (`vgate-manager/main.go` → `cmd.Execute()` →
`run()`):

1. Loads config (viper).
2. Opens the DB (SQLite default, or Postgres).
3. `AutoMigrate`s all GORM models.
4. Runs ordered, idempotent **data migrations**.
5. Merges DB-backed system-config overrides on top of `config.yml`.
6. Bootstraps the initial admin (from `admin.bootstrap`; password printed **once**).
7. Builds the router via `api.NewRouter`.
8. Starts background tickers: expired-order closer (5 min), hourly traffic aggregation, daily
   quota reset.

### Layered structure (`internal/`)

- `api/` — HTTP layer: `router.go`, `handler/` (one file per resource), `dto/`. Includes tests.
- `middleware/` — `cors`, `jwt`, `node_auth`, `logger`, `ratelimit`.
- `service/` — business logic: auth, user, node, plan, order/billing, traffic, stats,
  subscription, system_config, email/invite, announcement.
- `model/` — GORM models. `util/`, `wire/`, `pkg/crypto/` (VLESS credential helpers).

### API surface (all under `/api/v1`)

- **Public / user**: `/user/login`, `/sub/:sub_token`, profile / subscribe / plans / orders,
  `/billing/alipay/notify`.
- **Node data plane**: `GET /server/config`, `GET /server/users`, `POST /server/traffic`.
- **Admin**: nodes, users, traffic, stats, system-config, orders, plans, admins.
- `GET /health`.

### Config split

Some keys are file/env-only; others are DB-backed and hot-reloadable:

| File / env only | DB-backed (hot-reloadable) |
| --- | --- |
| `server.port` | `jwt` TTLs |
| `db.*` | `log.level` / `log.format` |
| `jwt.secret` | `cors.allowed_origins` |
| `admin.bootstrap.*` | timeouts |

viper maps `SERVER_PORT`-style environment variables.

## Server — the data plane (proxy node)

`vgate-server/` is a Go binary (cobra CLI) that runs a VLESS inbound. Flow
(`vgate-server/main.go` → `cmd.Execute()` → `run()`):

1. Load local viper YAML config (`admin_api`, `node_id`, `node_token`, `sync_interval`,
   `log_level`).
2. Create an `api.Client` pointed at `<AdminAPI>/api/v1/server`.
3. Start the VLESS inbound (`proxy/vless`).
4. Run a ticker that calls `sync()` every `SyncInterval` seconds.

### Sync loop

`sync()` pulls config + users with HTTP `304` short-circuiting (`api/client.go` uses
`If-None-Match`; returns `api.ErrNotModified`), applies hot-reload via `UpdateConfig` /
`UpdateUsers`, and reports accumulated per-user traffic (`GetAndResetTraffic`) back.

### Transport abstraction

`transport/transport.go` defines a `Transport` interface + registry. The native `tcp` transport
applies TLS/Reality via `transport/security.Wrap`. `ws` and `xhttp` adapters delegate to
xray-core's `websocket.ListenWS` / `splithttp.ListenXH`, sharing helpers in `transport/xraybridge`
(`ChanListener`, protojson decode, TLS/Reality protobuf builders). Transports register through
anonymous imports in `proxy/vless/bootstrap.go`.

### VLESS inbound internals (`proxy/vless/`)

- Handshake + TCP/UDP forwarder (`handler.go`)
- UDP-over-TCP relay (`udp.go`)
- `xtls-rprx-vision` relay (`vision.go`, xray-core leaf)
- Mux handling — TCP / HTTP / WebSocket (`mux.go`)
- Protocol constants/helpers (`protocol.go`)
- User set + connection tracking (`user.go`)
- Per-user delta traffic counters (`traffic.go`)
- Lifecycle + hot-reload (`server.go`)

## Frontends — the human interface

- `vgate-admin` — operator UI. Uses `npm`.
- `vgate-user` — customer UI. `npm install`.

Both talk to the manager's REST API. Dev servers proxy `/api` → `http://localhost:8081`.

## Data flow, end to end

1. Operator creates a **node** and a **user** in the admin console → manager persists them.
2. The server node's `sync()` fetches the new config + user list (or gets a `304`).
3. A client connects to the server node with VLESS using the user's credential.
4. The server node increments **per-user traffic counters** as bytes flow.
5. On the next sync, the node posts deltas to `POST /server/traffic`.
6. The manager aggregates and checks quotas; the admin console and user portal reflect usage.
