# Releases (Pre-built)

Every VGate component publishes **pre-built artifacts** to its GitHub release under the
[`vgate-project`](https://github.com/vgate-project) organization — you do **not** need to build
from source (or build Docker images) to run VGate.

| Component     | Repository                                                                    | Pre-built artifacts                                       |
|---------------|-------------------------------------------------------------------------------|-----------------------------------------------------------|
| Manager       | [vgate-project/vgate-manager](https://github.com/vgate-project/vgate-manager) | `vgate-manager-<os>-<arch>.tar.gz` / `.zip`, Docker image |
| Server        | [vgate-project/vgate-server](https://github.com/vgate-project/vgate-server)   | `vgate-server-<os>-<arch>.tar.gz` / `.zip`, Docker image  |
| Admin Console | [vgate-project/vgate-admin](https://github.com/vgate-project/vgate-admin)     | `dist.tar.gz` / `dist.zip` (built SPA)                    |
| User Portal   | [vgate-project/vgate-user](https://github.com/vgate-project/vgate-user)       | `dist.tar.gz` / `dist.zip` (built SPA)                    |

Binaries are built for **linux/darwin × amd64/arm64**. Docker images live on GHCR:
`ghcr.io/vgate-project/vgate-manager` and `ghcr.io/vgate-project/vgate-server`.

## Getting the latest release

- On GitHub: open the component repo → **Releases** (use a `v*` **formal release** for
  production; `pre-YYYY-MM-DD` are daily dev pre-releases from `main`).
- CLI: `gh release list --repo vgate-project/vgate-server`.
- Docker images are also tagged `latest` (formal releases) / `dev` (daily pre-releases).

## Manager

Download and run the binary:

```bash
# pick your platform, e.g. linux/amd64
curl -L -O https://github.com/vgate-project/vgate-manager/releases/latest/download/vgate-manager-linux-amd64.tar.gz
tar -xzf vgate-manager-linux-amd64.tar.gz
./vgate-manager --config /etc/vgate/manager.yml
```

Or pull the image:

```bash
docker pull ghcr.io/vgate-project/vgate-manager
```

See [Deployment → Manager](./deployment#1-manager) for configuration, the database, and the
bootstrap admin password.

## Server

Download and run the binary on each proxy host:

```bash
curl -L -O https://github.com/vgate-project/vgate-server/releases/latest/download/vgate-server-linux-amd64.tar.gz
tar -xzf vgate-server-linux-amd64.tar.gz
./vgate --config /etc/vgate/server.yml
```

Or pull the image:

```bash
docker pull ghcr.io/vgate-project/vgate-server
```

`server.yml` only needs `admin_api`, `node_id`, `node_token`, `sync_interval`, and `log_level`
— create the node in the admin console first to obtain its `node_token`.

## Admin Console & User Portal (SPA)

The frontends are shipped as already-built static sites. **No build step is required** — download
the archive, extract it into a `dist/` directory, point it at your manager's API via `dist/env.js`,
and serve that directory statically.

```bash
# Admin Console → /srv/vgate/admin/dist
mkdir -p /srv/vgate/admin/dist
curl -L -O https://github.com/vgate-project/vgate-admin/releases/latest/download/dist.tar.gz
tar -xzf dist.tar.gz -C /srv/vgate/admin/dist

# User Portal → /srv/vgate/user/dist
mkdir -p /srv/vgate/user/dist
curl -L -O https://github.com/vgate-project/vgate-user/releases/latest/download/dist.tar.gz
tar -xzf dist.tar.gz -C /srv/vgate/user/dist
```

### Point the SPA at your manager (edit `env.js`)

The archive extracts into the `dist/` directory; edit `dist/env.js` there. Set the API base URL:

```js
// dist/env.js
window.__ENV__ = {
    API_BASE_URL: ''   // or the full manager API origin, see below
}
```

- **Same-origin** (a reverse proxy serves `/api`, `/admin`, `/` from one host): leave it `''`.
- **Separate manager host**: set the full URL, e.g.
  `API_BASE_URL: 'https://api.example.com'`, and allow the frontend's origin in the manager's
  CORS `allowed_origins` (DB-backed system config).

### Serve statically

Host the `dist/` directory with any static server, or behind your reverse proxy (see
[Deployment → Reverse proxy](./deployment#4-reverse-proxy-example-caddy)):

```text
example.com {
    reverse_proxy /api/* localhost:8081
    file_server /admin/* /srv/vgate/admin/dist
    file_server      /srv/vgate/user/dist
}
```

That's it — open `/admin` (admin console) or `/` (user portal) and log in.

## Next

- [Deployment](./deployment) — production topology, reverse proxy, systemd, upgrades.
- [Configuration Reference](./configuration) — full `manager.yml` / `server.yml` options.
