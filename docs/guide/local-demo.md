# Local Demo

The `seed/` directory contains a standalone Go program that populates the manager's database
with a realistic demo dataset, so you can exercise the admin and user frontends end-to-end
without manually clicking through forms.

::: warning Not shipped
`seed/` is **git-ignored** and intended as a local convenience only. It is not part of the
shipped product.
:::

## How it works

Its module path is `github.com/vgate-project/vgate-manager/seed`, and it uses a `replace`
directive in `seed/go.mod` to import the manager's `internal/` packages. That means it reuses the
**real** models, ID/token generators, bcrypt hashing, and config loading — zero duplication with
production code.

## Build & run

```bash
cd seed
go build -o seed .
./seed --config ../manager/config.yml
```

By default it targets the DB selected by `db.*` in the config (defaults to
`../manager/vgate_manager.db`).

| Flag | Effect |
| --- | --- |
| *(none)* | Seed if plans/users don't already exist. Refuses to run otherwise. |
| `--force` | Wipe existing demo rows, then reseed. |
| `--config <path>` | Point at a manager config to select the DB. |

```bash
./seed --force                 # wipe + reseed
```

## Demo credentials

Every seeded user shares the password:

```
demo123456
```

Use any seeded user to log into the **user portal**, and the bootstrapped admin to log into the
**admin console**.

## Typical demo flow

1. Start the manager (it auto-migrates + bootstraps admin).
2. Run `./seed --config ../manager/config.yml` to populate plans/users/orders.
3. Start a server node and the admin + user frontends.
4. Log into the user portal as a seeded user → see subscription, plans, usage.
5. Log into the admin console → inspect nodes, traffic, orders, stats.

## Cleanup

Re-running with `--force` resets the demo dataset. To remove it entirely, delete the manager's
database file and re-run the manager (it will re-bootstrap a fresh admin).
