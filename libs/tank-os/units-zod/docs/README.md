# Units Zod adapter

`@tank-os/units-zod` is the external-boundary adapter for `@tank-os/units`.
It is intentionally separate from the unit domain so that Zod and transport
shapes do not enter the core package.

## Contract

- DTO schemas are strict: unknown fields are rejected rather than silently
  persisted.
- `unitDefinitionSchema` validates qualified standard codes, complete base
  dimensions and scientific representation metadata, then calls the core
  constructors.
- `conversionDefinitionSchema` accepts decimal strings and numbers at input,
  canonicalizes them through `@tank-os/decimal`, validates rational factors,
  affine offsets, origin and optional division contexts, then returns the
  immutable core value.
- Parsing is the only mapping direction currently exposed. Domain values are
  already JSON-shaped and must be serialized by the hosting transport adapter.

The package contains no Firestore, HTTP, Angular component or Aquarium
dependency. It does not create a relationship between units and aquariums.

## Architecture

```text
@tank-os/units-zod
        |
        +--> @tank-os/units (domain constructors)
        +--> @tank-os/decimal (decimal normalization)
        +--> zod (boundary validation)
```

The public API is exported from `src/index.ts` through the `lib/zod` barrel.
Every executable source file has a paired specification file, and the test
target enforces 100% V8 coverage for lines, statements, functions and branches.
