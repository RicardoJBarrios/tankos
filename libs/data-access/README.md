# TankOS Data Access

`@tankos/data-access` is the provider-independent package for CRUD, lifecycle,
pagination, caching and asynchronous batch contracts. It contains no Firebase,
HTTP or server-runtime implementation.

Provider adapters are physically isolated publishable packages:

```ts
import { createFirestoreCrudRepository } from '@tankos/data-access-firestore';
import { createJsonHttpCrudRepository } from '@tankos/data-access-json-http';
import { createFirebaseAdminBatchAuthorization } from '@tankos/data-access-server';
```

The primary package can therefore be used without installing Firebase, Zod or
Firebase Admin. Each adapter has its own source tree, public barrel, tests,
documentation, peer dependencies and build artifact.

Commands:

- `pnpm nx run data-access:build`
- `pnpm nx run data-access:test`
- `pnpm nx run data-access:lint`
- `pnpm nx run data-access-firestore:build`
- `pnpm nx run data-access-firestore:test`
- `pnpm nx run data-access-firestore:test-integration`

The architectural decisions and current contract are documented in
[`docs/README.md`](docs/README.md).
