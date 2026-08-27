# Units Firestore adapter

`@tankos/units-firestore` is the Firestore adapter for the public and private units and
conversion catalogues. It contains no unit or conversion business rules and
does not know about Aquarium or Measurement records.

It composes `createFirestoreCrudRepository()` from
`@tankos/data-access-firestore`, while `@tankos/units-zod` validates and
maps the persisted DTO data. Technical metadata, optimistic revisions,
lifecycle transitions, authorization hooks, pagination and cache policy stay
owned by the shared Firestore/data-access boundaries.

The application supplies collection paths, query builders, cursors and
authorization. This adapter supplies only the entity-specific DTO schemas and
domain mapping for `UnitDefinition` and `ConversionDefinition`.
