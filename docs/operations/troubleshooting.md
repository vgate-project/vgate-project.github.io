# Troubleshooting

Common issues and how to diagnose them.

## Manager won't start

- **DB migration error** — check `db.dialect` / `db.dsn`. For Postgres, confirm the DSN and that
  the database exists and is reachable.
- **Port in use** — `server.port` (default 8081) is taken. Change it or free the port.
- **Missing `jwt.secret`** — set it in production config; weak/absent secrets risk token forgery.

## Lost the bootstrap admin password

The password is printed **only once** at first start. If you lost it:

1. Create a new admin via CLI: `vgate-manager admin create --username X --password Y --role super_admin`.
2. Log in with the new admin and manage/remove the old one.

If no admins can be created (DB issue), restore from a backup or re-bootstrap with a fresh DB
(loses data).

## Node shows as not syncing / no traffic

- Confirm `admin_api` in `vgate-server/config.yml` is reachable from the node (outbound HTTPS/HTTP).
- Confirm `node_id` / `node_token` match what the admin console issued.
- Check the node logs at the configured `log_level`. The sync uses `If-None-Match`; a `304` is
  expected when nothing changed — that is **not** an error.
- Verify the manager's `GET /api/v1/health` responds.

## Users can't connect to a node

- The user must be in the node's authorized list — the node syncs users from the manager; wait up
  to `sync_interval` seconds after creating the user.
- Confirm the node's **listen port / transport / security** (set in the admin console) match what
  the client uses.
- For `xtls-rprx-vision`, the client must use TLS 1.3 or Reality and **not** the `v2` flow.

## Frontend can't reach the API (CORS)

- In dev, Vite proxies `/api` → `localhost:8081`; ensure the manager is running there.
- In prod, set `window.__ENV__.API_BASE_URL` in `dist/env.js`. If the manager is on another host,
  add the frontend origin to the manager's `cors.allowed_origins`.

## 304s everywhere / changes not propagating

That's the `304` optimization working — config is unchanged. If a change *should* have propagated
but didn't, confirm you edited it in the **admin console** (manager owns config), not in the
node's local `config.yml` (which only holds sync settings).

## Build fails on the server

Confirm you have Go 1.26+ installed.

## Subscription link returns nothing

- The `sub_token` must be valid and belong to an active user with a subscription. Check the user's
  plan/expiry in the admin console. Expired orders are closed automatically (every 5 min).
