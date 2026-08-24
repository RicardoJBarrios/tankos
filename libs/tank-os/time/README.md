# TankOS Time

`@tank-os/time` contains provider-independent temporal contracts, native
JavaScript implementations, Angular composition and presentation pipes.

Optional boundaries are physically isolated packages:

```ts
import { createFirestoreTimeAdapter } from '@tank-os/time-firestore';
import { createJsonHttpTimeAdapter } from '@tank-os/time-json-http';
import { createZodTimeSchemas } from '@tank-os/time-zod';
```

The primary package does not import Firebase, Zod or transport adapters. Each
boundary has its own source tree, tests, documentation, peer dependencies and
`ng-packagr-lite` build.

Commands:

- `pnpm nx run time:build`
- `pnpm nx run time:test`
- `pnpm nx run time:lint`
- `pnpm nx run time-firestore:build`
- `pnpm nx run time-json-http:test`
- `pnpm nx run time-zod:test`

See [`docs/README.md`](docs/README.md) for the complete temporal contract.
