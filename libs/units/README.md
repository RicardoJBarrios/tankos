# TankOS Units

The implementation and architectural decisions for this library are documented
in [`docs/README.md`](docs/README.md).

The library exposes the same Nx lifecycle as the other TankOS capability
libraries:

- `pnpm nx run units:build` packages the public declarations and sources with
  `ng-packagr`;
- `pnpm nx run units:test` runs the tests with the 100% V8 coverage gate;
- `pnpm nx run units:lint` checks the architectural and code rules.
