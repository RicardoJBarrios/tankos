# Units Zod adapter

`@tankos/units-zod` is the external-boundary adapter for `@tankos/units`.
It is intentionally separate from the unit domain so that Zod and transport
shapes do not enter the core package.

## Contract

- DTO schemas are strict: unknown fields are rejected rather than silently
  persisted.
- `unitDefinitionSchema` validates qualified standard codes, complete base
  dimensions and scientific representation metadata, then calls the core
  constructors.
- `conversionDefinitionSchema` accepts decimal strings and numbers at input,
  canonicalizes them through `@tankos/decimal`, validates rational factors,
  affine offsets, origin and optional division contexts, then returns the
  immutable core value.
- The `unitDefinitionToDto` and `conversionDefinitionToDto` mappers provide the
  reverse direction for persistence and transport adapters.

The package contains no Firestore, HTTP, Angular component or Aquarium
dependency. It does not create a relationship between units and aquariums.

## Architecture

```text
@tankos/units-zod
        |
        +--> @tankos/units (domain constructors)
        +--> @tankos/decimal (decimal normalization)
        +--> zod (boundary validation)
```

The public API is exported from `src/index.ts` through the `lib/zod` barrel.
Every executable source file has a paired specification file, and the test
target enforces 100% V8 coverage for lines, statements, functions and branches.
