# TankOS Decimal

`@tankos/decimal` contains the provider-independent Decimal value model,
arithmetic port, application service and Angular composition.

Optional implementations are physical packages:

```ts
import { createBigJsDecimalAdapter } from '@tankos/decimal-big-js';
import { decimalValueSchema } from '@tankos/decimal-zod';
```

The primary package does not import Big.js or Zod. Each adapter owns its source,
tests, documentation, peer dependencies and independent `ng-packagr-lite`
build.

See [`docs/README.md`](docs/README.md) for the Decimal contract.
