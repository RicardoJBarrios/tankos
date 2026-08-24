# @tankos/units-zod

Zod boundary adapter for `@tankos/units`. It validates strict JSON DTOs and
maps them to the immutable unit and conversion domain values. The adapter does
not own units, measurements, Aquarium relationships or persistence.

## Running unit tests

Run `pnpm nx run units-zod:test` to execute the tests with the 100% coverage
threshold. Build with `pnpm nx run units-zod:build`.
