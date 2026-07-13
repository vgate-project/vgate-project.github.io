# Quick Start

This guide gets a minimal VGate stack running locally: a **manager**, one **server** node, and
the **admin console**. It assumes Go 1.26+ and Node 18+.

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

- Seed a realistic demo dataset with the [`seed`](../guide/local-demo) loader.
- Read the [Deployment](../operations/deployment) guide for production.
- Review the [Configuration Reference](../operations/configuration).
