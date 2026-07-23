# API Reference

All endpoints live under `/api/v1`. The manager exposes three logical surfaces: the **user
API**, the **node data plane**, and the **admin API**.

## Authentication

| Surface                        | Mechanism                                                           |
|--------------------------------|---------------------------------------------------------------------|
| User API (`/user/*`, `/sub/*`) | User **JWT** (access + refresh; not refreshable in the user portal) |
| Admin API (`/admin/*`)         | Admin **JWT** (access + refresh; one silent refresh on 401)         |
| Node data plane (`/server/*`)  | **Node token** (`node_auth` middleware)                             |

## Health

```
GET /api/v1/health
```

Returns service liveness. Use it for probes and the `curl` smoke test.

## Node data plane

Used by `server` nodes (authenticated by `node_token`).

```
GET  /api/v1/server/config     # pull node config (port, transport, security, flows)
GET  /api/v1/server/users      # pull authorized user list (304-short-circuited)
POST /api/v1/server/traffic    # report accumulated per-user traffic deltas
```

The server client sends `If-None-Match`; unchanged resources return `304` and the client treats
it as `api.ErrNotModified`.

## User API

```
POST /api/v1/user/login                              # returns access + refresh JWT
GET  /api/v1/sub/:sub_token                          # standard subscription link
GET  /api/v1/user/profile                            # current user profile
PUT  /api/v1/user/profile                            # update profile
GET  /api/v1/user/subscribe                          # subscription status
GET  /api/v1/user/plans                             # available plans
GET  /api/v1/user/orders                             # user's orders
POST /api/v1/billing/:platform/notify              # payment notify (alipay|wechat|stripe; closes order)
POST /api/v1/user/redemption-codes/redeem          # redeem an invite/redemption code
GET  /api/v1/user/redemption-codes/records         # redemption history
PUT  /api/v1/user/reminder-channel                  # choose traffic-reminder channel (none/email/telegram)
GET  /api/v1/user/tickets/unread                    # unread admin-reply count
```

## Admin API

Gated by admin/super_admin roles. Selected endpoints:

```
GET  /api/v1/admin/nodes                             # list proxy nodes
POST /api/v1/admin/nodes                             # create node (issues node_token)
GET  /api/v1/admin/users                             # list users
POST /api/v1/admin/users                             # create user
GET  /api/v1/admin/traffic                           # traffic stats
GET  /api/v1/admin/stats                             # aggregate stats
PUT  /api/v1/admin/system-config                     # hot-reloadable settings (super_admin)
GET  /api/v1/admin/orders                            # orders
PUT  /api/v1/admin/orders/:id/status                 # update order status
POST /api/v1/admin/plans                             # create plan (super_admin)
GET  /api/v1/admin/admins                            # list admins (super_admin)
GET  /api/v1/admin/redemption-codes                  # list redemption codes
POST /api/v1/admin/redemption-codes                  # create redemption code
GET  /api/v1/admin/tickets/unread                    # unread ticket count
POST /api/v1/admin/users/zombies/preview            # preview zombie users
POST /api/v1/admin/users/zombies/cleanup            # purge zombie users
```

Exact request/response shapes live in `vgate-manager/internal/api/dto/`. The repo's `api/` tests
(`admin_test.go`, `server_test.go`, `sub_test.go`, auth-level tests) are the most reliable
contract reference.

## CLI (manager)

```
vgate-manager admin create --username X --password Y --role admin|super_admin
```

## Example: node sync

```bash
# Server node internally does:
curl -H "Authorization: Bearer $NODE_TOKEN" \
     -H "If-None-Match: $ETAG" \
     http://localhost:8081/api/v1/server/config
# → 200 with new config, or 304 if unchanged
```

## Rate limiting

`ratelimit` middleware is available; enable it for public endpoints (e.g., login, payment notify)
in production.
