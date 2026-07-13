# Configuration Reference

VGate splits configuration into **file/env-only** keys and **DB-backed, hot-reloadable** keys.

## Manager (`manager/config.yml`)

### File / env only

These cannot be changed at runtime — edit the file (or env) and restart.

| Key | Env | Description | Default |
| --- | --- | --- | --- |
| `server.port` | `SERVER_PORT` | HTTP listen port for the manager | `8081` |
| `db.dialect` | `DB_DIALECT` | `sqlite` or `postgres` | `sqlite` |
| `db.dsn` | `DB_DSN` | DSN / connection string | SQLite file `vgate_manager.db` |
| `jwt.secret` | `JWT_SECRET` | HMAC secret for signing JWTs | *(required in prod)* |
| `admin.bootstrap.username` | — | Bootstrap admin username | `admin` |
| `admin.bootstrap.password` | — | Bootstrap admin password (printed once) | `change-me` |

### DB-backed (hot-reloadable via `PUT /api/v1/admin/system-config`)

Changed through the API; no restart needed. Merged over the file config on startup.

| Key | Description |
| --- | --- |
| `jwt` TTLs | Access/refresh token lifetimes. |
| `log.level` | Logging verbosity. |
| `log.format` | Logging format. |
| `cors.allowed_origins` | Allowed frontend origins. |
| timeouts | Request timeouts. |

## Server (`server/config.yml`)

The node's local config holds **only** manager-connection + sync settings. All serve-side
settings (port, transport, security, flows) come from the manager.

| Key | Description | Example |
| --- | --- | --- |
| `admin_api` | Manager base URL | `http://localhost:8081` |
| `node_id` | Node id assigned in admin console | `1` |
| `node_token` | Node token assigned in admin console | `****` |
| `sync_interval` | Seconds between syncs | `30` |
| `log_level` | Log verbosity | `info` |

## Frontends (`public/env.js` → `dist/env.js`)

Not bundled — edited after build.

| Variable | Meaning |
| --- | --- |
| `window.__ENV__.API_BASE_URL` | Empty `''` → relative `/api/v1`; or full manager URL. |

## Per-node serve settings (set in admin console, delivered by manager)

| Setting | Values |
| --- | --- |
| Listen port | Any free port on the node host |
| Transport | `tcp`, `ws`, `xhttp` |
| Security | TLS / Reality (applied via `transport/security.Wrap` for tcp) |
| VLESS flow | `v0`, `v2`, `xtls-rprx-vision` |

::: tip viper env mapping
The manager maps `SERVER_PORT`-style environment variables, so you can override file keys with
env vars in containers.
:::
