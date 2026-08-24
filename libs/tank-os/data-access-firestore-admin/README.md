# TankOS Data Access Firestore Admin

Server-only Firestore adapters for the durable asynchronous batch contract in
`@tank-os/data-access`. This package owns the Firebase Admin SDK boundary and
must never be imported by an Angular browser entry point.

The provider-independent contracts and browser Firestore CRUD adapter are
published separately. Run this package independently with:

- `pnpm nx run data-access-firestore-admin:build`
- `pnpm nx run data-access-firestore-admin:test`
- `pnpm nx run data-access-firestore-admin:lint`

The package-specific contract is documented in
[`docs/README.md`](docs/README.md).
