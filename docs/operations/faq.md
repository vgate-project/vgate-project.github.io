# FAQ

### Is VGate a SaaS or self-hosted?

Self-hosted. You run the manager, the server nodes, and the frontends. Nothing phones home.

### What protocol does it support?

VLESS — with flows `v0` (plaintext), `v2` (AEAD), and `xtls-rprx-vision` (requires TLS 1.3 or
Reality). Transports: `tcp`, `ws` (WebSocket), `xhttp` (split-HTTP).

### Do I need to edit every node when I add a user?

No. Add the user in the admin console; the node picks it up on its next sync (within
`sync_interval` seconds) via hot-reload. No restarts.

### Where does node config live?

In the **manager** (set per node in the admin console). The node's local `config.yml` holds only
manager-connection + sync settings.

### Can I use a database other than SQLite?

Yes. Set `db.dialect: postgres` and `db.dsn` to use PostgreSQL. SQLite is the zero-dependency
default.

### Are the frontend test suites included?

No. The frontends ship `dev`, `build`, `preview`, and `typecheck` only — there is no `npm test`.
The Go components (`manager`, `server`) have test suites (`go test ./...`).

### Is the user portal's token refreshable?

No. On a `401` the user portal clears the token and redirects to `/login`. The admin console *does*
perform one silent refresh.

### How is traffic counted?

The server node keeps per-user delta counters, resets them on report, and posts deltas to
`POST /server/traffic`. The manager aggregates hourly and enforces daily quotas.

### The README mentions a `keygen` subcommand — where is it?

The current `server/cmd` only contains `root.go`. Verify before relying on `keygen`.

### Can I rebrand the user portal?

Yes. The API base URL is read at runtime (`window.__ENV__.API_BASE_URL`), and the manager exposes
a clean REST API, so you can replace or white-label the portal freely.

### How do I deploy to GitHub Pages?

This site itself is built with VitePress and deployed via the workflow in
`.github/workflows/deploy.yml`. The `base` is set to `/vgate-project.github.io/`.

### What license is VGate under?

AGPL-3.0.
