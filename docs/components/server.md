# Server (Proxy Node)

The `vgate-server/` component is a Go binary (cobra CLI) that runs a single VLESS inbound proxy node. It is a
**stateless worker**: it pulls its configuration and authorized user list from the manager, serves proxy traffic, and
reports per-user traffic back.

Source: [github.com/vgate-project/vgate-server](https://github.com/vgate-project/vgate-server)

## Build & run

```bash
cd vgate-server
go build -o vgate .                 # produces the `vgate` binary
./vgate --config config.yml         # run the proxy (defaults to ./config.yml)
```

Test & lint:

```bash
go test ./...
go vet ./... && gofmt -l .
```

## Local config (what the node owns)

The node's own `config.yml` holds **only** manager-connection + sync settings:

```yaml
admin_api: http://localhost:8081   # manager base URL
node_id: 1                         # assigned in the admin console
node_token: <NODE_TOKEN>           # assigned in the admin console
sync_interval: 30                  # seconds between syncs
log_level: info
```

Everything about *how* the node serves traffic — listen port, transport (`tcp`/`ws`/`xhttp`), TLS/Reality, VLESS flows —
is **delivered by the manager** and hot-reloaded.

## Runtime flow

`vgate-server/main.go` → `cmd.Execute()` → `run()`:

1. Load local viper YAML config.
2. Create an `api.Client` pointed at `<AdminAPI>/api/v1/server`.
3. Start the VLESS inbound (`proxy/vless`).
4. A ticker calls `sync()` every `SyncInterval` seconds.

### `sync()`

- Pulls config + users with HTTP `304` short-circuiting (`api/client.go` uses `If-None-Match`; returns
  `api.ErrNotModified`).
- Applies hot-reload via `server.UpdateConfig` / `UpdateUsers` (no restart).
- Reports accumulated per-user traffic (`GetAndResetTraffic`) back to the manager.

## VLESS protocol support

- **Flows**: `v0` plaintext (native), `v2` AEAD (xray encryption), `xtls-rprx-vision`
  (requires outer TLS 1.3 or Reality; incompatible with `v2`).
- **Transports**: native `tcp` (TLS/Reality via `transport/security.Wrap`), `ws`
  (xray-core `websocket.ListenWS`), `xhttp` (xray-core `splithttp.ListenXH`).
- **Mux**: VLESS `CommandMux` (Mux.Cool) is enabled by default (`enableMux: true`).
- **UDP**: UDP-over-TCP relay; Vision relay leaf.

**Flow restriction:** `flow` (e.g. `xtls-rprx-vision`) is only honored on the `tcp`
transport. The node clears `flow` automatically for `ws` / `xhttp` and when the security layer is `none`.

### `vless` block (manager-delivered)

The `vless` object carries VLESS v2 / obfuscation settings, independent of the transport. All fields are optional:

| field                         | meaning                                                                                                                                          |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `decryption`                  | `.`-separated list of base64url X25519 (or ML-KEM-768) private keys enabling v2 AEAD decryption; `""` / `none` disables it (plaintext VLESS v0). |
| `xor_mode`                    | `0` off, `1` mask KEM ciphertexts, `2` also wrap the connection in `XorConn`.                                                                    |
| `seconds_from` / `seconds_to` | 0-RTT session-ticket lifetime window in seconds (both `0` = 1-RTT only).                                                                         |
| `padding`                     | `.`-separated `pct-min-max` padding spec; empty = library defaults.                                                                              |
| `flow`                        | VLESS flow control, e.g. `xtls-rprx-vision` (TCP-only, see above).                                                                               |

### Optional security fields

Beyond the required settings, the TLS and Reality backends accept additional optional fields (ignored when absent):
**TLS** — `server_name`, `cert_file` /
`key_file` (alternatives to `cert_pem` / `key_pem`), `alpn`, `max_version`,
`reject_unknown_sni`; **Reality** — `show`, `xver`, `min_client_ver`,
`max_client_ver`, `max_time_diff`.

## Transport abstraction

`transport/transport.go` defines a `Transport` interface + registry. The native `tcp` transport applies TLS/Reality via
`transport/security.Wrap`. `ws` and `xhttp` adapters delegate to xray-core listeners, sharing helpers in
`transport/xraybridge` (`ChanListener`, protojson config decode, TLS/Reality protobuf builders). Transports are
registered through anonymous imports in
`proxy/vless/bootstrap.go`.

## Inbound internals (`proxy/vless/`)

| File           | Responsibility                                        |
|----------------|-------------------------------------------------------|
| `handler.go`   | VLESS handshake + TCP/UDP forwarder                   |
| `udp.go`       | UDP-over-TCP relay                                    |
| `vision.go`    | `xtls-rprx-vision` relay (xray-core leaf)             |
| `mux.go`       | TCP / HTTP / WebSocket mux handling                   |
| `protocol.go`  | VLESS protocol constants / helpers                    |
| `user.go`      | User set + connection tracking                        |
| `traffic.go`   | Per-user delta traffic counters                       |
| `ratelimit.go` | Per-user + node-global speed limiting (token buckets) |
| `server.go`    | Lifecycle + hot-reload                                |

## Speed limiting

A node can cap throughput in both directions, enforced locally with token buckets (`golang.org/x/time/rate`):

- **Node-global** limits (`speed_limit_up_bps` / `speed_limit_down_bps`) cap the node's aggregate throughput.
- **Per-user** limits (carried on each user in the `GET /server/users` payload) cap a single user.

The effective rate for a user is the **minimum** of the node-global and per-user limits; `0` means unlimited. The
limiter is applied to both the counting connection and the xtls-rprx-vision path. See `proxy/vless/ratelimit.go`.

## Sizing & deployment

- One `vgate` process per node/machine.
- Tune `sync_interval` for change-propagation speed vs. request volume (`304`s keep idle cost low).
- Run behind the manager for config; expose only the VLESS listen port to clients.
