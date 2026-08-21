# TankOS Data Access

The implementation and architectural decisions for this library are documented
in [`docs/README.md`](docs/README.md).

The library provides composable, provider-independent contracts and use cases
for CRUD and asynchronous batch operations. Firestore, JSON/HTTP and Angular
integration remain adapters around those contracts.

Its Angular package is built with Nx `@nx/angular:ng-packagr-lite` and emits
the public package under `dist/libs/tank-os/data-access`.

- `pnpm nx run data-access:build`
- `pnpm nx run data-access:test`
- `pnpm nx run data-access:lint`

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test data-access` to execute the unit tests.
