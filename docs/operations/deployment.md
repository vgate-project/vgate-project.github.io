# Deployment

A production VGate deployment is: **one manager** (with a database), **one or more server nodes**,
and the **two frontends** served as static assets — typically all behind a single reverse proxy
for TLS.

## Topology

```text
                 ┌──────────── Reverse proxy (nginx/Caddy, TLS) ────────────┐
   Operators ────┤  /admin      → Admin Console (static)                     │
   Customers ────┤  /            → User Portal (static)                       │
   API clients ──┤  /api/v1      → Manager (backend)                          │
                 └───────────────────────────────────────────────────────────┘
                                    │
                            ┌───────▼────────┐        ┌──────────────┐
                            │   Manager       │◄─DB──►│ SQLite/Postgres│
                            └───────┬────────┘        └──────────────┘
                       REST /api/v1/server/* (node token)
                            ┌───────▼────────┐
                            │ Server node(s) │ → VLESS clients (internet)
                            └────────────────┘
```

## 1. Manager

```bash
cd manager
go build -o vgate-manager .
./vgate-manager --config /etc/vgate/manager.yml
```

- Use Postgres in production (`db.dialect: postgres`, `db.dsn: "..."`).
- Set a strong `jwt.secret`.
- Put it behind the reverse proxy; do not expose the manager port directly to the internet
  except for the paths the proxy forwards.
- Persist the printed bootstrap admin password somewhere safe (it is shown only once).

## 2. Server nodes

On each proxy host:

```bash
cd server
go build -o vgate .
./vgate --config /etc/vgate/server.yml
```

`server.yml` contains only `admin_api`, `node_id`, `node_token`, `sync_interval`, `log_level`.
Firewall the VLESS listen port (assigned by the manager) for client access; the manager connection
is outbound from the node.

For many nodes, run `vgate` as a systemd service:

```ini
# /etc/systemd/system/vgate.service
[Unit]
Description=VGate proxy node
After=network.target

[Service]
ExecStart=/usr/local/bin/vgate --config /etc/vgate/server.yml
Restart=on-failure
User=vgate

[Install]
WantedBy=multi-user.target
```

## 3. Frontends

Build both and serve `dist/` statically (or via the reverse proxy):

```bash
cd frontend/admin && npm install && npm run build
cd ../user   && npm install && npm run build
```

After building, edit each `dist/env.js` to set `window.__ENV__.API_BASE_URL`:

- Same-origin (proxy serves `/api`): leave empty `''`.
- Separate manager host: set the full URL and allow the frontend origin in the manager's CORS
  `allowed_origins` (DB-backed system config).

## 4. Reverse proxy example (Caddy)

```text
example.com {
    reverse_proxy /api/* localhost:8081
    file_server /admin/* /srv/vgate/admin/dist
    file_server      /srv/vgate/user/dist
}
```

(Adapt to your own path layout; the manager, admin, and user apps can live on one host.)

## Background jobs

The manager runs these automatically — no external scheduler needed:

- Expired-order closer: every **5 minutes**.
- Traffic aggregation: **hourly**.
- Daily quota reset: **daily**.

## Upgrades

- The manager auto-migrates on startup; data migrations are idempotent.
- Update server nodes and restart them (or let the sync re-pull config). Rolling restarts are
  safe because nodes are stateless workers.
- Rebuild frontends and redeploy `dist/`.
