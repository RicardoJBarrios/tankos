# TankOS Time

The implementation and architectural decisions for this library are documented
in [`docs/README.md`](docs/README.md).

The library exposes the same Nx lifecycle as the other TankOS capability
libraries:

- `pnpm nx run time:build` packages the public entry point and transport
  secondary entry points with `ng-packagr`;
- `pnpm nx run time:test` runs the tests with the 100% V8 coverage gate;
- `pnpm nx run time:lint` checks the architectural and code rules.
