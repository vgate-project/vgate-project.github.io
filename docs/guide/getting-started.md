# Quick Start

This guide gets a minimal VGate stack running locally: a **manager**, one **server** node, and
the **admin console**. It assumes Go 1.26+ and Node 18+.

Prefer containers? Skip to [Run with Docker](#run-with-docker) — the manager and server ship
ready-made Dockerfiles and Compose files.

## Run with Docker

The `manager/` and `server/` components already ship Dockerfiles and `docker-compose.yml`
files. They connect over a shared external Docker network named `vgate`. The frontends have no
Docker image yet, so run the admin console via npm (step 3 below) or the REST API to create nodes
and obtain each node's `NODE_TOKEN`.

### Docker Compose (recommended)

1. Install Docker Engine + the compose plugin, then create the shared network once:

   ```bash
   docker network create vgate
   ```

2. Provide configuration via environment variables (export them, or drop a `.env` next to each
   `docker-compose.yml`). At minimum:

   ```bash
   JWT_SECRET=<strong-random-secret>      # override! defaults to "change-me-in-production"
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<pick-a-password>
   # set these after creating the node in the admin console:
   NODE_ID=1
   NODE_TOKEN=<NODE_TOKEN_FROM_ADMIN_CONSOLE>
   SERVER_PORT=10086
   ```

3. Bring up the manager:

   ```bash
   docker compose -f manager/docker-compose.yml up -d
   ```

4. The bootstrap admin password is printed **once** — to the container logs. Grab it now:

   ```bash
   docker logs vgate-manager
   ```

5. Start the admin console (npm) to create a node and copy its `NODE_TOKEN`:

   ```bash
   cd frontend/admin && npm install && npm run dev   # http://localhost:5173
   ```

6. With `NODE_TOKEN` / `NODE_ID` set, bring up the proxy node:

   ```bash
   docker compose -f server/docker-compose.yml up -d
   ```

7. Verify the manager is healthy:

   ```bash
   curl http://localhost:8081/api/v1/health
   ```

### Plain Docker (no compose)

Build and run the images directly, mirroring the same environment the Compose files use.

**Manager:**

```bash
docker build -t vgate-manager ./manager
docker run -d --name vgate-manager --network vgate -p 8081:8081 \
  -e SERVER_PORT=8081 \
  -e JWT_SECRET=<strong-random-secret> \
  -e ADMIN_BOOTSTRAP_USERNAME=admin \
  -e ADMIN_BOOTSTRAP_PASSWORD=<pick-a-password> \
  -e DB_DIALECT=sqlite -e DB_DSN=/app/data/vgate_manager.db \
  -v manager-data:/app/data \
  vgate-manager
```

**Server** (after creating the node and obtaining its `NODE_TOKEN`):

```bash
docker build -t vgate-server ./server
docker run -d --name vgate-server --network vgate -p 10086:10086 \
  -e ADMIN_API=http://manager:8081 \
  -e NODE_ID=1 -e NODE_TOKEN=<NODE_TOKEN_FROM_ADMIN_CONSOLE> \
  -e SYNC_INTERVAL=60 -e LISTEN_PORT=10086 \
  vgate-server
```

::: tip Note
The manager persists its SQLite database under `/app/data` (mounted volume), and the proxy
listens on `LISTEN_PORT` (default `10086`) — the port the manager delivers via the node config,
not the local `config.yml`.
:::

## 1. Start the manager

```bash
cd manager
go build -o vgate-manager .
./vgate-manager --config config.yml
```

On first start the manager will:

- auto-migrate the database (SQLite by default),
- run idempotent data migrations,
- bootstrap an admin from `admin.bootstrap` (default `admin` / `change-me`),
- **print the generated admin password once** — copy it now.

The manager listens on `server.port` (default **8081**). Verify with:

```bash
curl http://localhost:8081/api/v1/health
```

## 2. Configure and start a server node

The server's local `config.yml` holds **only** manager-connection + sync settings:

```yaml
admin_api: http://localhost:8081
node_id: 1
node_token: <NODE_TOKEN_FROM_ADMIN_CONSOLE>
sync_interval: 30
log_level: info
```

Create the node in the admin console first (it issues the `node_token`), then:

```bash
cd server
go build -o vgate .
./vgate --config config.yml
```

The node will sync its config + users and begin serving VLESS traffic on the port assigned by
the manager.

::: tip Note on building the server
`server/go.mod` has a `replace` directive pointing at a checked-out xray-core for local
development. Builds depend on that local checkout unless the `replace` is removed.
:::

## 3. Run the admin console

```bash
cd frontend/admin
npm install        # or: pnpm install
npm run dev        # http://localhost:5173
```

In dev, Vite proxies `/api` → `http://localhost:8081`, so log in with the admin credentials from
step 1. From here you can create nodes, users, plans, and watch traffic.

## 4. (Optional) Run the user portal

```bash
cd frontend/user
npm install        # npm only — no pnpm lockfile
npm run dev        # http://localhost:5174
```

## What you have now

- A manager handling auth, users, plans, and the node data plane.
- One proxy node serving VLESS and reporting traffic.
- An admin console to operate everything.

## Next

- Read the [Deployment](../operations/deployment) guide for production.
- Review the [Configuration Reference](../operations/configuration).
