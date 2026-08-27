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

Unit-definition pages use a stable `(data.code, __name__)` ordering. The
adapter encodes both values and applies them with `startAfter`; a cursor is
never treated as an offset. Queries with owner and record searches use only
one array field remotely because Firestore composite indexes cannot combine
two array fields; the remaining partial match is verified in the UI.

Old versioned records remain until the explicit physical-delete operation.
The application must provide a retention policy before the catalogue becomes
large, since Firestore does not automatically remove those records here.
