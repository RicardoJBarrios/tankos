# TankOS Data Access JSON/HTTP

Physical JSON/HTTP adapter package for `@tank-os/data-access`. It owns the
transport port and response validation boundary without pulling HTTP concerns
into the provider-independent package.

```ts
import { createJsonHttpCrudRepository } from '@tank-os/data-access-json-http';
```

Run `pnpm nx run data-access-json-http:test` and
`pnpm nx run data-access-json-http:build` independently.
