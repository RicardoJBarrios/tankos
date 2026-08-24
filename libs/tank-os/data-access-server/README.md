# TankOS Data Access Server

Physical server adapter package for trusted batch execution. It owns the
Firebase Admin Auth boundary and never treats browser-provided roles as
authoritative.

```ts
import { createFirebaseAdminBatchAuthorization } from '@tank-os/data-access-server';
```

Run `pnpm nx run data-access-server:test` and
`pnpm nx run data-access-server:build` independently.
