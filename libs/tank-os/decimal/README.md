# TankOS Decimal

The implementation and architectural decisions for this library are documented
in [`docs/README.md`](docs/README.md).

The library contains the core decimal contract and fluent API. The default
`big.js` adapter and its Angular provider are available through the dedicated
`@tank-os/decimal/big-js` secondary entry point. The primary package also
exposes the adapter factory required to compose that entry point. Architectural
details and implementation rules are documented in `docs/README.md`.
