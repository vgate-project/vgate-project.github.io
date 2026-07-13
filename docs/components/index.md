# Components Overview

VGate ships as four independently-buildable components. There is **no monorepo build** — each is
built, tested, and linted from within its own directory. They communicate over the manager's
REST API.

| Component | Directory | Stack | Builds to |
| --- | --- | --- | --- |
| Manager | `manager/` | Go 1.26 · Gin + GORM | `vgate-manager` binary |
| Server | `server/` | Go 1.26 · xray-core | `vgate` binary |
| Admin Console | `frontend/admin/` | Vue 3 · Vite · TS | static `dist/` |
| User Portal | `frontend/user/` | Vue 3 · Vite · TS | static `dist/` |

## Dependencies between components

```text
Admin Console ─┐
               ├─► Manager ◄─► DB
User Portal  ──┘        ▲
                        │ REST /api/v1/server/*
                        │ node token auth + traffic reports
                   Server (proxy node)
```

- The **manager** depends on a database (SQLite or Postgres). Everything else depends on the
  manager.
- **Server** nodes depend on the manager at runtime (sync + report). They do **not** depend on
  the frontends.
- The **frontends** depend only on the manager's REST API.

## Who runs what

- **Operators** deploy and run the manager + server nodes, and use the admin console.
- **Customers** use the user portal and VLESS client apps with their subscription link.
- **Developers** may replace the user portal or build custom clients against the REST API.

## Per-component docs

- [Manager (Backend API)](./manager)
- [Server (Proxy Node)](./server)
- [Admin Console](./admin-console)
- [User Portal](./user-portal)
