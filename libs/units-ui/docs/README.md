# `@tankos/units-ui`

## Purpose

`@tankos/units-ui` is the Angular presentation boundary for custom unit
management. It exposes reactive state and command methods without exposing
the persistence provider or the underlying asynchronous mechanism.

## Responsibilities

- expose the unit list, editor state and operation statuses as Signals;
- orchestrate create, edit, save, mark-for-deletion and restore flows;
- format unit labels for presentation;
- surface expected save and lifecycle errors to the host UI;
- obtain authentication through the provider-neutral `AuthSessionPort`.

## Architecture

```text
Angular component
        |
        v
UnitDefinitionFeatureService
        |
        v
UnitDefinitionFeatureStore
        |
        v
Units application service + AuthSessionPort
```

The app composition root supplies the Units application service and the
authentication implementation. Firebase, Firestore, HTTP, Zod and domain
authorization policies remain outside this library.

## UX and state boundary

Commands are intentionally `void`; asynchronous work is represented by
signals such as status and error. Components should render those signals and
must not coordinate repository promises directly. The feature service is an
orchestrator, not a second domain model.

## Route contract

`unitsRoutes` is the self-contained mounting contract for the feature. The host
loads it at `/units` and does not own the feature pages:

- `/units` lists definitions;
- `/units/new` creates a definition;
- `/units/:id` shows a read-only version;
- `/units/:id/edit` edits through the versioned application service.

The route tree owns the list, editor and detail pages and provides the feature
facade in its route injector. The management application service is supplied
through the neutral `UNIT_DEFINITION_MANAGEMENT_SERVICE` token from
`@tankos/units-ui`, so the UI does not depend on Firestore or another provider.
The host maps its observability implementation to `UNITS_LOGGER`.

## Decisions and limits

- Angular Signals are the UI state mechanism; persistence is not.
- Authentication is required through `AuthSessionPort`, but authorization
  decisions remain domain/application responsibilities.
- The editor owns UI state only; immutable identifiers and versioning are
  enforced below the UI boundary.
- This library does not define responsive layout, translations or a specific
  visual list component beyond the feature contract.
- Expected operation failures are exposed for presentation and reporting; the
  global error boundary handles unexpected failures.

## Extension guide

Add UI orchestration here when it is specific to unit management. Keep generic
CRUD list behavior in `@tankos/data-access-ui`, domain rules in `@tankos/units`
and provider composition in the application.

`@tankos/data-access-ui` exposes `CrudListQueryState`, which owns the
filter/page invariant: changing a filter resets the page. URL serialization
remains a router concern of the feature host, so the same state works with
different navigation systems.

The list uses the Material table by default. It exposes the persisted
`visibility` attribute as a column and sends the public/private selection as a
`UnitDefinitionFilter` to the feature store; the Firestore adapter applies the
same filter server-side. Administrators can also filter by owner and inspect
deleted versions; deleted-version records expose restore and permanent-delete
actions. The latter is never exposed to keepers.

## Current status

The custom-unit feature facade, route tree, list/editor/detail pages, lifecycle
commands and tests are implemented. The feature currently targets the existing
unit-definition application contract and does not yet provide domain-specific
ABAC controls.
