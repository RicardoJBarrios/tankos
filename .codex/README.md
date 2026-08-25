# TankOS project documentation

`.codex` contains shared project rules and product/architecture decisions.
Library-specific contracts belong in each library's `docs/` directory.

## Selective reading

| Need                    | Start here                                             | Then read                                   |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Product intent          | [`VISION.md`](VISION.md)                               | [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)  |
| Domain language         | [`GLOSSARY.md`](GLOSSARY.md)                           | [`DOMAIN_RULES.md`](DOMAIN_RULES.md)        |
| Product discovery       | [`product/README.md`](product/README.md)               | One relevant product document               |
| Use-case implementation | [`specifications/README.md`](specifications/README.md) | One relevant specification                  |
| Technical architecture  | [`architecture/README.md`](architecture/README.md)     | One relevant architecture page              |
| Durable decisions       | [`adr/README.md`](adr/README.md)                       | Only applicable ADRs                        |
| Coding and tests        | [`CODING.md`](CODING.md)                               | [`TESTING.md`](TESTING.md), then guardrails |
| Delivery                | [`WORKFLOW.md`](WORKFLOW.md)                           | Ready/Done definitions                      |
| Tooling                 | [`STACK.md`](STACK.md)                                 | [`MCP.md`](MCP.md) or quality docs          |

## Source-of-truth rules

- Product intent: `VISION.md` and `product/` accepted documents.
- Domain vocabulary and invariants: `GLOSSARY.md` and `DOMAIN_RULES.md`.
- One-use-case behavior: `specifications/`.
- Technical direction: `architecture/target-architecture.md` and applicable ADRs.
- Code/test conventions: `CODING.md`, `TESTING.md` and `CODE_GUARDRAILS.md`.
- Historical research and proposals: `research/` and documents marked
  candidate or future; they never authorize implementation alone.

When two documents conflict, prefer the more authoritative source above and
record a durable change in an ADR or the relevant canonical document.
