# TankOS Data Access Firestore

Physical Firestore adapter package for `@tankos/data-access`. It owns the
Firestore SDK and Zod peer dependencies and validates and maps Firestore DTOs
at the provider boundary. The provider-independent contracts remain in
`@tankos/data-access`.

Entity adapters should use `createFirestoreRecordSchema()` for the common
strict persistence envelope and provide only their entity-specific data
schema.

```ts
import { createFirestoreCrudRepository } from '@tankos/data-access-firestore';
```

Build, unit-test and emulator-test this package independently:

- `pnpm nx run data-access-firestore:build`
- `pnpm nx run data-access-firestore:test`
- `pnpm nx run data-access-firestore:test-integration`

Mutations against an existing record require its integer `expectedRevision`.
The emulator integration suite runs authenticated and unauthenticated requests
against the package Rules file.
