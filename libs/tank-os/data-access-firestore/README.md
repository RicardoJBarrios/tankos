# TankOS Data Access Firestore

Physical Firestore adapter package for `@tank-os/data-access`. It owns the
Firestore SDK and Zod peer dependencies and validates and maps Firestore DTOs
at the provider boundary. The provider-independent contracts remain in
`@tank-os/data-access`.

```ts
import { createFirestoreCrudRepository } from '@tank-os/data-access-firestore';
```

Build, unit-test and emulator-test this package independently:

- `pnpm nx run data-access-firestore:build`
- `pnpm nx run data-access-firestore:test`
- `pnpm nx run data-access-firestore:test-integration`

Mutations against an existing record require its integer `expectedRevision`.
The emulator integration suite runs authenticated and unauthenticated requests
against the package Rules file.
