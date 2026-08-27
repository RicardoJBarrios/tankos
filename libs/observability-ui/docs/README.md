# `observability-ui`

## Purpose

Angular composition adapter for the provider-neutral `Logger` contract.
It exposes the `LOGGER` injection token used to connect a host logger to UI
and feature libraries.

## Architecture

The logger contract lives in `@tankos/observability`. This package contains no
Firebase, console sink or telemetry implementation. The composition root
provides the concrete logger and selects its environment level.

## Limits and decisions

- The token is an Angular integration mechanism, not a domain dependency.
- Consumers must not assume that a logger writes to a particular provider.
- Error and context sanitization remains the responsibility of the
  observability composition and sink contract.

## Verification

The public token contract is covered by Vitest tests.
