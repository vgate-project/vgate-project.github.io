# What is VGate?

VGate is an **open-source, self-hosted VLESS proxy management system**. It gives you a single,
coherent way to operate a fleet of [VLESS](https://www.v2fly.org/) proxy nodes: issue user
credentials, assign subscription plans, track per-user traffic, and bill for access — all from
one backend, with two ready-made web frontends.

In short: if you want to *run* a proxy service (rather than just run a single proxy client),
VGate is the glue that turns a pile of servers into a managed product.

## The problem VGate solves

Running proxy infrastructure usually means:

- Editing config on each node by hand whenever a user is added or removed.
- No idea how much traffic each user has consumed.
- No clean way to sell access, expire subscriptions, or enforce quotas.
- A different workflow for every region / transport / protocol combination.

VGate replaces that with a **control plane + reporting data plane** model:

- The **manager** is the single source of truth for users, plans, nodes, and traffic.
- Each **server** node is a stateless worker that periodically syncs its configuration from the
  manager, serves proxy traffic, and reports usage back.

## The four building blocks

| Component | Language / Stack | Role |
| --- | --- | --- |
| **Manager** | Go (Gin + GORM) | Backend API: admin, identity, billing, and the node data plane. |
| **Server** | Go (xray-core based) | VLESS inbound proxy node. Syncs from the manager, serves traffic, reports usage. |
| **Admin Console** | Vue 3 + Vite + TS | Web UI for operators: nodes, users, plans, orders, traffic, stats. |
| **User Portal** | Vue 3 + Vite + TS | Web UI for customers: login, profile, subscription, plan purchase. |

All three components are independently buildable and live as siblings under the repository root.
There is **no monorepo build** — you build, test, and lint each from within its own directory.

## What it is *not*

- Not a VPN client for end users. End users connect with standard VLESS clients (or the user
  portal's subscription link) — VGate provides the server side and the management layer.
- Not a SaaS. You host it. The admin and user frontends talk to *your* manager instance.
- Not tied to a specific transport. TCP, WebSocket, and split-HTTP are all supported.

## Next steps

- Tour the [Features](./features).
- Understand the [Architecture](./architecture).
- Follow the [Quick Start](./getting-started).
