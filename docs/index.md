---
layout: home

hero:
  name: VGate
  text: Self-hosted VLESS Proxy Management
  tagline: A single control plane to run, manage, and bill your own fleet of VLESS proxy nodes — with an admin console, a user portal, subscriptions, and per-user traffic accounting.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/vgate-project
    - theme: alt
      text: Architecture
      link: /guide/architecture
  image:
    src: /favicon.svg
    alt: VGate logo

features:
  - icon: 🛰️
    title: Centralized Node Control
    details: The manager is the source of truth. Each proxy node syncs its config and authorized user list on an interval and hot-reloads — no manual edits on every box.
  - icon: 🔐
    title: Secure VLESS Inbound
    details: "Full VLESS support including plaintext v0, v2 AEAD, and xtls-rprx-vision with TLS 1.3 / Reality. Transports: native TCP, WebSocket, and split-HTTP (xhttp)."
  - icon: 👥
    title: Users, Subscriptions & Plans
    details: Create users, assign subscription plans with quotas and expiry, and generate standard subscription links the user portal and client apps can consume directly.
  - icon: 💳
    title: Built-in Billing
    details: Orders, plans, and an Alipay notify endpoint are part of the manager. Close expired orders automatically and reset quotas on a schedule.
  - icon: 📊
    title: Per-user Traffic Accounting
    details: Proxy nodes report accumulated per-user traffic back to the manager, which aggregates it hourly and enforces daily quotas.
  - icon: 🖥️
    title: Two Polished Frontends
    details: A Vue 3 admin console for operators and a Vue 3 user portal for customers — both talking to the same manager REST API.

---

## Why VGate?

Running a proxy service means juggling many moving parts: boxes in different regions, rotating
user credentials, expiring subscriptions, and the constant question of *"who used how much
traffic?"*. VGate collapses all of that into one coherent system you host yourself.

- **One control plane.** The `manager` holds the canonical config; proxy `server` nodes are
  dumb and obedient — they pull, they serve, they report.
- **No vendor lock-in.** Everything is open source and self-hosted. Your nodes, your users,
  your data.
- **Operable by non-engineers.** The admin console hides the protocol plumbing behind forms
  and tables, so day-to-day operations don't require SSH access to every node.
- **Observable billing.** Traffic accounting and order management are first-class, not bolt-ons.

## How it fits together

```text
                         ┌─────────────────────────┐
      Admin operator --> │   Admin Console (Vue)   │
                         └───────────┬─────────────┘
                                     │  REST /api/v1
                         ┌───────────▼─────────────┐
   Users (portal/apps) ->│      Manager (backend)   │◄-- Node token auth
                         │  API · Auth · Billing    │        per-user traffic
                         │  Plans · Traffic · Nodes │            reports
                         └───────────┬─────────────┘
                                     │  REST /api/v1/server/*
                         ┌───────────▼─────────────┐
      Internet clients ->│  Server (VLESS inbound)  │
                         │  TCP · WS · xhttp · VLESS│
                         └─────────────────────────┘
```

## Gallery

### Admin Console

![Admin Dashboard](./assets/screenshots/screenshot1.jpeg)

*The operator's dashboard: live node status, traffic stats, and hourly usage chart — all in one view.*

[See more admin console screenshots →](/components/admin-console)

### User Portal

![User Dashboard](./assets/screenshots/screenshot5.jpeg)

*The customer portal: current plan, quota remaining, account info, node availability, and personal traffic analytics.*

[See more user portal screenshots →](/components/user-portal)

## What people use it for

- **Service providers** selling access to a fleet of proxy nodes with paid plans.
- **Teams** who need a single place to issue credentials and track usage.
- **Hobbyists** who run a handful of nodes and want a clean admin UI instead of shell scripts.

## Start in minutes

```bash
# 1. Start the manager (auto-migrates the DB and prints the admin password once)
cd manager && go build -o vgate-manager . && ./vgate-manager --config config.yml

# 2. Point a proxy node at it
cd server && go build -o vgate . && ./vgate --config config.yml

# 3. Open the admin console and create your first node + user
```

::: tip New here?
Read [What is VGate?](/guide/what-is-vgate) for the big picture, then jump to
[Quick Start](/guide/getting-started).
:::

## License

VGate is released under the [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html).
