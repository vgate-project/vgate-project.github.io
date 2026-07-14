# Deployment

A production VGate deployment is: **one manager** (with a database), **one or more server nodes**,
and the **two frontends** served as static assets — typically all behind a single reverse proxy
for TLS.

Want to skip building from source? Every component ships **pre-built artifacts** (binaries, Docker
images, and the built frontends) in its GitHub release — see
[Releases (Pre-built)](./releases) to download and run directly.

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
cd vgate-manager
go build -o vgate-manager .
./vgate-manager --config /etc/vgate/manager.yml
```

**Pre-built?** Download `vgate-manager-<os>-<arch>.tar.gz` (or `.zip`) from the
[vgate-manager releases](https://github.com/vgate-project/vgate-manager/releases), or pull the
image `ghcr.io/vgate-project/vgate-manager` — see [Releases (Pre-built)](./releases).

- Use Postgres in production (`db.dialect: postgres`, `db.dsn: "..."`).
- Set a strong `jwt.secret`.
- Put it behind the reverse proxy; do not expose the manager port directly to the internet
  except for the paths the proxy forwards.
- Persist the printed bootstrap admin password somewhere safe (it is shown only once).

## 2. Server nodes

On each proxy host:

```bash
cd vgate-server
go build -o vgate .
./vgate --config /etc/vgate/server.yml
```

**Pre-built?** Download `vgate-server-<os>-<arch>.tar.gz` (or `.zip`) from the
[vgate-server releases](https://github.com/vgate-project/vgate-server/releases), or pull the image
`ghcr.io/vgate-project/vgate-server` — see [Releases (Pre-built)](./releases).

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

**Pre-built (recommended):** download the built SPA archive (`dist.tar.gz` / `dist.zip`) from the
[vgate-admin](https://github.com/vgate-project/vgate-admin/releases) and
[vgate-user](https://github.com/vgate-project/vgate-user/releases) releases, extract it into a
`dist/` directory, then edit `dist/env.js` to point at your manager (see
[Releases (Pre-built)](./releases) for the full steps). No `npm install` / `npm run build` needed.

To build from source instead:

```bash
git clone https://github.com/vgate-project/vgate-admin.git
cd vgate-admin && npm install && npm run build

git clone https://github.com/vgate-project/vgate-user.git
cd vgate-user && npm install && npm run build
```

After building (or after extracting the pre-built archive), edit each `dist/env.js` to set
`window.__ENV__.API_BASE_URL`:

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

- Expired-order closer: every **5 minutes** (flips unpaid orders to closed).
- Hourly stats pruning: once at startup, then every **24 hours** (deletes
  `traffic_hourly_stat` rows older than 48h). Hourly traffic is aggregated as nodes
  report it, not on a schedule.
- Quota reset: once at startup, then every **24 hours** (resets usage counters on
  the configured `quota.reset_day`).

## Upgrades

- The manager auto-migrates on startup; data migrations are idempotent.
- Update server nodes and restart them (or let the sync re-pull config). Rolling restarts are
  safe because nodes are stateless workers.
- Rebuild frontends and redeploy `dist/`.
