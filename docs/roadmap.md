# Roadmap

This is a living document of where VGate is headed. Items are indicative and may change — see the
[GitHub project](https://github.com/vgate-project) for the authoritative issue tracker.

## Now (current focus)

- Stabilize the four-component system: manager, server, admin console, user portal.
- Harden the node sync + traffic reporting path (hot-reload correctness, `304` efficiency).
- Expand test coverage across `manager/` and `server/` services.

## Next

- **More transports / protocols** — evaluate additional xray-core transports beyond `tcp`, `ws`,
  `xhttp`.
- **Observability** — richer metrics and dashboards for per-node and per-user traffic.
- **Admin UX** — node health status, sync-lag indicators, and bulk user operations in the admin
  console.
- **Billing breadth** — additional payment providers beyond the Alipay notify endpoint.

## Later

- **Multi-region subscription routing** — smarter subscription link generation per user geo.
- **High availability** — manager clustering / DB failover guidance for larger deployments.
- **Plugin / webhook hooks** — notify external systems on order/usage events.
- **i18n** — localized admin and user frontends.

## How to influence it

- File issues and feature requests on GitHub.
- Contribute PRs — each component is independently buildable and tested.
- Join discussions on the repository.

::: tip
VGate is AGPL-3.0-licensed and community-driven. Priorities shift with contributor interest and
operator feedback.
:::
