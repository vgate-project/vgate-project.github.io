# Configuration Reference

VGate splits configuration into **file/env-only** keys and **DB-backed, hot-reloadable** keys.

## Manager (`vgate-manager/config.yml`)

### File / env only

These cannot be changed at runtime — edit the file (or env) and restart.

| Key                        | Env           | Description                                                                       | Default                        |
|----------------------------|---------------|-----------------------------------------------------------------------------------|--------------------------------|
| `server.port`              | `SERVER_PORT` | HTTP listen port for the manager                                                  | `8081`                         |
| `db.dialect`               | `DB_DIALECT`  | `sqlite` or `postgres`                                                            | `sqlite`                       |
| `db.dsn`                   | `DB_DSN`      | DSN / connection string                                                           | SQLite file `vgate_manager.db` |
| `jwt.secret`               | `JWT_SECRET`  | HMAC secret for signing JWTs                                                      | *(required in prod)*           |
| `admin.bootstrap.username` | —             | Bootstrap admin username                                                          | `admin`                        |
| `admin.bootstrap.password` | —             | Bootstrap admin password (Docker Compose defaults to `change-me`; set explicitly) | _(unset)_                      |

### DB-backed (hot-reloadable via `PUT /api/v1/admin/system-config`)

Changed through the API; no restart needed. Merged over the file config on startup.

| Group             | Keys (examples)                                                                                       |
|-------------------|-------------------------------------------------------------------------------------------------------|
| JWT               | `jwt.access_ttl_secs`, `jwt.refresh_ttl_secs`                                                         |
| Logging           | `log.level`, `log.format`                                                                             |
| CORS              | `cors.allowed_origins`                                                                                |
| Timeouts          | `server.read_timeout_secs`, `server.write_timeout_secs`                                               |
| Quota / password  | `quota.reset_day`, `password.min_length`, `password.require_complexity`                               |
| Registration      | `user.register_enabled`, `user.register_require_invite`, `user.register_email_suffix_whitelist`       |
| Trial accounts    | `user.trial_enabled`, `user.trial_quota_bytes`, `user.trial_duration_days`                            |
| Invites / site    | `invite.default_user_quota`, `site.name`, `site.base_url`, `sub.base_urls`                            |
| Email             | `email.provider`, `email.enabled`, `email.from`, `email.from_name`, `email.smtp_*` / `email.resend_*` |
| Captcha           | `captcha.turnstile_enabled`, `captcha.turnstile_site_key`, `captcha.turnstile_secret_key`             |
| Telegram          | `telegram.enabled`, `telegram.bot_*`, `telegram.alert_*`                                              |
| Payments          | `alipay.*`, `wechat.*`, `stripe.*` (configured in **System Config → Payment**)                        |
| Traffic reminders | `reminder.enabled`, `reminder.pct_threshold`, `reminder.days_threshold`, `reminder.cooldown_days`     |
| Misc              | `payment.product_name_template`                                                                       |

## Server (`vgate-server/config.yml`)

The node's local config holds **only** manager-connection and sync settings. All serve-side settings (port, transport,
security, flows) come from the manager.

| Key             | Description                          | Example                 |
|-----------------|--------------------------------------|-------------------------|
| `admin_api`     | Manager base URL                     | `http://localhost:8081` |
| `node_id`       | Node id assigned in admin console    | `1`                     |
| `node_token`    | Node token assigned in admin console | `****`                  |
| `sync_interval` | Seconds between syncs                | `30`                    |
| `log_level`     | Log verbosity                        | `info`                  |

## Frontends (`public/env.js` → `dist/env.js`)

Not bundled — edited after build.

| Variable                      | Meaning                                               |
|-------------------------------|-------------------------------------------------------|
| `window.__ENV__.API_BASE_URL` | Empty `''` → relative `/api/v1`; or full manager URL. |

## Per-node serve settings (set in admin console, delivered by manager)

| Setting     | Values                                                        |
|-------------|---------------------------------------------------------------|
| Listen port | Any free port on the node host                                |
| Transport   | `tcp`, `ws`, `xhttp`                                          |
| Security    | TLS / Reality (applied via `transport/security.Wrap` for tcp) |
| VLESS flow  | `v0`, `v2`, `xtls-rprx-vision`                                |

::: tip viper env mapping The manager maps `SERVER_PORT`-style environment variables, so you can override file keys with
env vars in containers.
:::
