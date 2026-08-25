# List Care Work

**Status:** Accepted and implemented

## User value

The keeper can answer:

> What care have I performed for this Aquarium?

This increment lets the keeper review completed Care Work after recording it.
It is a bounded recent-history view, not planning, pending work, reminders or a
maintenance schedule.

## Actor and preconditions

The actor is an authenticated keeper with an Aquarium in Active Context. The
selected Aquarium must belong to that keeper; Active Context is application
state and never grants authorization.

If there is no Active Context, the page performs no Firestore query and shows a
safe Spanish recovery state with a link to select an Aquarium.

## Success result

The application returns a Care-specific read model for completed Care Work in
the selected Aquarium. Zero results are valid and are shown as recent Care
Work with a natural action to `Registrar cuidado`.

The first implementation requests at most 50 records from Firestore. The page
is labelled as recent Care Work and does not imply that the bounded result is
the complete historical record. Cursor pagination is deferred.

## Read model

`CareWorkListItem` contains only:

- `CareWorkId`;
- description;
- `performedAt`;
- `recordedAt` for ordering and traceability, without requiring presentation.

It does not expose owner identity, Firebase metadata, Firestore timestamps or
provenance without a concrete user need, and it does not hydrate the aggregate.

## Ordering

The source query and its result order are:

1. `performedAt` descending;
2. `recordedAt` descending;
3. `CareWorkId` ascending.

This answers when the care action happened and matches the existing Care Work
source semantics used by Recent Timeline. The query is bounded in Firestore;
the application does not trim an unbounded collection in memory.

## Main flow

1. Require an authenticated keeper.
2. Require Active Context.
3. Read at most 50 completed Care Work records scoped to the selected owned
   Aquarium.
4. Validate each external document with the existing Care Work persistence
   schema and map it to `CareWorkListItem`.
5. Show the recent records in canonical order.

Listing creates no Fact, Domain Event or mutation. Care Work remains an
independent append-only aggregate and source of truth. Timeline remains a
separate read model.

## Expected failures

- unauthenticated keeper: safe unauthorized/recoverable state;
- no Active Context: no query and link to Aquarium selection;
- unavailable or unauthorized Aquarium: safe recoverable failure;
- infrastructure failure: recoverable error, never a false complete state;
- malformed returned document: reject the whole read explicitly, without
  omission, defaults or partial history.

## Navigation and UX

The selected-Aquarium workflow exposes:

- `Registrar cuidado` → `/app/aquariums/care/new`;
- `Ver cuidados` → `/app/aquariums/care`.

The page uses the existing Material 3 foundation and Spanish user-facing copy.
It provides loading, no-context, empty, results and error states, a link to
record Care Work from the empty state and navigation back to the Aquarium
workflow. It is a Care-specific history surface, not a Timeline replacement.

## Persistence and security

The existing top-level `careWorks` collection is reused. The existing
Care-specific reader and Zod persistence schema are reused where coherent.
The query remains owner- and Aquarium-scoped and must be authorized by
Firestore Rules: the owner may read; unauthenticated and cross-owner reads are
denied. No schema, planning collection, index or generic history/pagination
infrastructure is introduced unless the concrete query requires it.

## Testing

- application: authentication, Active Context, empty, one/multiple results,
  ordering at the reader boundary and infrastructure failure;
- adapter: Emulator Suite owner/Aquarium scope, ordering, limit, mapping and
  malformed-document rejection;
- Rules: only query authorization not already covered for the same query shape;
- Angular: no context, loading, empty, results, error and navigation to record;
- E2E: extend the canonical journey to record Care Work, open `Ver cuidados`
  and verify the recorded action.

## Definition of Ready

The specification is ready: actor, value, scope, preconditions, read model,
ordering, bounded limit, authorization, malformed-data behavior, UX states,
navigation, persistence, domain impact and proportional validation are
explicit. Planning, Tasks, recurrence, reminders, categories, editing,
deletion, Timeline changes, Signal Store and generic infrastructure remain out
of scope and non-blocking.
