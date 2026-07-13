# Use Cases

VGate is flexible enough to cover a range of operator profiles.

## 1. Selling access to a proxy fleet

The most common scenario. You operate proxy nodes in one or more regions and want to **monetize
access**:

- Define **plans** (e.g., "Starter 100 GB / 30 days", "Pro 1 TB / 30 days").
- Customers sign up in the **user portal**, place an **order**, and pay (Alipay notify closes
  the order).
- Each customer gets a **subscription link** they paste into a VLESS client.
- **Per-user traffic** is tracked and **daily quotas** are enforced automatically.
- The **expired-order closer** revokes access when a plan lapses.

## 2. Internal team proxy

A company wants a managed egress proxy for its staff without a commercial vendor:

- Operators create users in the **admin console** and assign plans/quotas.
- Traffic is visible per user for capacity planning.
- No billing needed — orders can be left unused or a single "internal" plan used.

## 3. Mixed-region routing

Nodes in different geographies, each with its own transport/security:

- Each node is configured independently in the admin console (port, transport `tcp`/`ws`/`xhttp`,
  TLS/Reality).
- The **subscription** returns the right endpoint per node, so users can pick a region in their
  client.

## 4. Hobbyist / single operator

A handful of nodes, one operator wearing both hats:

- The admin console hides protocol plumbing behind forms.
- Hot-reload means no restarts when adding a friend as a user.

## 5. White-label portal

Because the manager exposes a clean REST API and the frontends read their API base URL at
runtime (`window.__ENV__.API_BASE_URL`), you can rebrand or replace the user portal entirely and
keep the same backend.

## What VGate is not a good fit for

- A single end-user proxy client on one machine — you don't need the management layer.
- Environments where you cannot host a backend and a database.
- Non-VLESS protocols (VGate is VLESS-focused; other protocols would require custom transport
  work).
