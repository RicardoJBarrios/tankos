# `data-access-material-ui`

## Purpose

Angular Material adapter for the provider-neutral CRUD list contract. It
renders records, selection, semantic actions and pagination through a table.

## Architecture

The library depends on `@tankos/data-access` and `@tankos/data-access-ui` only.
It does not contain domain rules, persistence, authorization or use cases.
The host wires the emitted events to an application service.

## Limits and decisions

- Material is an optional visual adapter; headless consumers use
  `@tankos/data-access-ui` directly.
- The component does not load data or mutate records.
- Labels come from `CRUD_UI_LABELS`, so the adapter does not choose an i18n
  provider.
- Pagination semantics are supplied by the host list contract.

## Verification

The component has Angular integration tests with Vitest and targets complete
V8 coverage.
