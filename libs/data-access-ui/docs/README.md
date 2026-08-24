# `@tankos/data-access-ui`

## Purpose

This library provides the Angular-centric presentation flow for ordinary CRUD
lists. It is reusable across domains and does not know about Aquarium, Units,
Firestore, HTTP, authentication providers, or visual design systems.

## Public building blocks

- `createCrudListStore` creates an NgRx Signal Store that owns list state,
  cursor pagination, filters, selection, logical deletion/restoration, and the
  asynchronous batch-progress projection.
- `CrudListComponent` provides the neutral semantic list surface. It emits
  host actions for create, edit, mark-for-deletion, restore, selection, paging,
  and batch confirmation.
- The contract types describe the state and the ports supplied by the host.

## Boundary rules

The host supplies a `CrudService` and, when needed, a `BatchService`. The UI
library only orchestrates those ports. Provider-specific persistence adapters
remain in `data-access-firestore`, `data-access-json-http`, or an application
composition layer.

Forms, domain-specific validation, authorization decisions, confirmation
dialogs, route navigation, and styling remain host responsibilities. The
component exposes a predictable flow without imposing a design system.

## Testing contract

Each public runtime element has a paired test file. Component integration tests
use Spectator. The library test target measures coverage and requires 100% for
lines, statements, functions, and branches. The V8 comments in the store only
silence synthetic branches created by erased TypeScript generic syntax; they do
not exclude application behavior from coverage.
