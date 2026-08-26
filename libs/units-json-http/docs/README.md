# `@tankos/units-json-http`

## Purpose

`@tankos/units-json-http` is the JSON/HTTP persistence adapter for the Units
and conversion catalogues. It translates the provider-independent Units model
to JSON DTOs and delegates generic transport behavior to
`@tankos/data-access-json-http`.

## Responsibilities

- create JSON/HTTP repositories for unit definitions and conversions;
- serialize create and update payloads to the Units DTO format;
- validate responses through `@tankos/units-zod` schemas;
- preserve generic pagination, errors and cache behavior from data-access.

## Architecture

```text
@tankos/units domain ports
            |
            v
@tankos/units-json-http
  serialization + schemas
            |
            v
@tankos/data-access-json-http
            |
            v
         HTTP API
```

The adapter does not define HTTP authentication, authorization policy, API
routes or server-side business rules. The host supplies the HTTP client and
authorization context.

## Validation boundary

Outbound and inbound payloads are converted using the Units DTO contracts.
Malformed remote data is rejected at the adapter boundary instead of being
silently converted into a domain object. Transport errors remain available to
the shared error-handling composition.

## Decisions and limits

- Firebase and Firestore are not dependencies of this package.
- The adapter does not own unit identity or conversion semantics.
- It does not make global/private visibility decisions; those belong to the
  Units domain policy and backend.
- JSON/HTTP pagination and query limits are delegated to the generic adapter.
- Time serialization is supplied through `JsonHttpTimeAdapter`.

## Extension guide

Add a repository factory here only for a Units resource. Put generic HTTP
behavior in `@tankos/data-access-json-http` and schema definitions in the
appropriate Units validation boundary.

## Current status

Unit-definition and conversion JSON/HTTP repositories, DTO validation and
provider-independent tests are implemented. Server authorization and a live
HTTP integration target remain host responsibilities.
