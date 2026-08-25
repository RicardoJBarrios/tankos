# TankOS project documentation

`.codex` contains compact shared contracts. Library-specific contracts belong
in each library's `docs/` directory. Detailed historical material is in
[`archive/`](archive/) and is not part of the normal reading path.

## Selective reading

| Need               | Start here                               | Then read                            |
| ------------------ | ---------------------------------------- | ------------------------------------ |
| Product and domain | [`PROJECT.md`](PROJECT.md)               | [`PRODUCT.md`](PRODUCT.md)           |
| Implementation     | [`ENGINEERING.md`](ENGINEERING.md)       | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Delivery           | [`DELIVERY.md`](DELIVERY.md)             | Affected library `docs/`             |
| Tool integrations  | [`MCP.md`](MCP.md)                       | `tools/quality/README.md`            |
| Durable decisions  | [`adr/README.md`](adr/README.md)         | Only applicable ADRs                 |
| Historical detail  | [`archive/README.md`](archive/README.md) | One archived page only               |

## Source-of-truth rules

- Product and domain: `PROJECT.md` and `PRODUCT.md`.
- Technical direction: `ARCHITECTURE.md` and applicable ADRs.
- Code, tests and delivery: `ENGINEERING.md` and `DELIVERY.md`.
- Historical research and proposals: `archive/`; they never authorize
  implementation alone.

When two documents conflict, prefer the more authoritative source above and
record a durable change in an ADR or the relevant canonical document.
