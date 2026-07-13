# Core Concepts

Before deploying, it helps to understand the nouns VGate is built around.

## Manager

The backend service and the **source of truth** for everything: users, nodes, plans, orders,
traffic, and (hot-reloadable) system config. Proxy nodes are *clients* of the manager, not
peers.

## Node (Server)

A single deployed `server` binary running a VLESS inbound. Identified by a `node_id` and
authenticated to the manager with a `node_token`. Each node:

- syncs its config and authorized user list from the manager,
- serves proxy traffic for those users,
- reports per-user traffic back.

A node's **listen port, transport, and security settings are managed in the admin console**, not
in the node's local `config.yml`.

## User

An account that is allowed to connect to one or more nodes. A user has credentials (VLESS UUID /
flow), an optional subscription plan, a quota, and an expiry. Users authenticate to the **user
portal** and to VLESS clients via subscription links.

## Plan

A purchasable offering: defines price, traffic **quota**, and **duration/expiry**. Plans are
created by `super_admin`s.

## Order

A billing record tying a user to a plan, with a payment state. Orders are closed on payment
(Alipay notify) or by the expired-order closer.

## Subscription

A per-user token (`sub_token`) that produces a standard subscription link
(`GET /sub/:sub_token`). VLESS client apps and the user portal consume it to fetch node
endpoints and credentials.

## Traffic accounting

- **Delta counters**: the server node tracks bytes per user in memory.
- **Report**: `GetAndResetTraffic` returns the accumulated delta and resets it; posted to
  `POST /server/traffic`.
- **Aggregation**: the manager sums traffic hourly and enforces daily quotas.

## System config

Runtime-tunable settings (JWT TTLs, log level/format, CORS origins, timeouts) stored in the DB
and merged over `config.yml`. Change them via `PUT /api/v1/admin/system-config` without a
restart.

## Roles

| Role | Capabilities |
| --- | --- |
| `admin` | Manage nodes, users, traffic, stats, orders, system config. |
| `super_admin` | Everything `admin` can do, **plus** manage plans and other admins. |

## Auth domains

Three distinct auth mechanisms, deliberately separated:

- **User JWT** — user portal and `/user/*` endpoints.
- **Admin JWT** — admin console and `/admin/*` endpoints; refreshable.
- **Node token** — `node_auth` middleware on `/server/*` endpoints.

## Sync interval

How often each server node calls `sync()`. Short intervals mean faster propagation of user/config
changes; the HTTP `304` optimization keeps the cost low when nothing changed.
