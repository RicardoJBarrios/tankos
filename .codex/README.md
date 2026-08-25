# TankOS project documentation

`.codex` contains compact shared contracts. Library-specific contracts belong
in each library's `docs/` directory. Detailed historical material is in
[`archive/`](archive/) and is not part of the normal reading path.

## Selective reading

| Need                | Start here                               | Then read                            |
| ------------------- | ---------------------------------------- | ------------------------------------ |
| Product and domain  | [`PROJECT.md`](PROJECT.md)               | [`PRODUCT.md`](PRODUCT.md)           |
| Implementation      | [`ENGINEERING.md`](ENGINEERING.md)       | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Delivery            | [`DELIVERY.md`](DELIVERY.md)             | Affected library `docs/`             |
| Tool integrations   | [`MCP.md`](MCP.md)                       | `tools/quality/README.md`            |
| Technical decisions | [`ARCHITECTURE.md`](ARCHITECTURE.md)     | Single active source                 |
| Historical detail   | [`archive/README.md`](archive/README.md) | One archived page only               |

## Source-of-truth rules

- Product and domain: `PROJECT.md` and `PRODUCT.md`.
- Technical direction and durable decisions: `ARCHITECTURE.md`.
- Code, tests and delivery: `ENGINEERING.md` and `DELIVERY.md`.
- Historical research and proposals: `archive/`; they never authorize
  implementation alone.

When two documents conflict, prefer the more authoritative source above and
update the relevant canonical document rather than duplicating the decision.
