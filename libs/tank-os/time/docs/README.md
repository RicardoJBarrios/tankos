# TankOS Time

**Status:** initial helper slice implemented; broader temporal behavior remains
open.

This library owns the reusable temporal capability for TankOS. It is separate
from `@tank-os/units`: dates and times are not measurement units, even though
durations can be expressed using units such as hours or minutes.

## Boundary

`@tank-os/time` will provide Angular-centric, typed helpers for:

- instants in time;
- local calendar dates;
- date-times with an explicit time zone;
- durations;
- UTC normalization;
- serialization and deserialization at application boundaries.

It must not own:

- Measurement or ParameterDefinition records;
- Aquarium or AquariumSystem identity;
- Firestore persistence;
- Firebase adapters;
- FIWARE or IoT transport;
- user-facing care workflows.

## Core semantic distinction

The library must distinguish at least these values:

```text
Instant       A unique point on the global timeline.
LocalDate     A calendar date without a time or time zone.
ZonedDateTime A local date-time interpreted in an explicit time zone.
Duration      An elapsed amount of time between instants.
```

These values must not be represented interchangeably as arbitrary strings.
Their meaning determines validation, normalization, persistence and display.

## UTC normalization

When a user, device or imported source declares a date-time, TankOS preserves
the declared instant and normalizes the stored instant to UTC at the server
boundary. The original time-zone context may be retained when it is required to
explain how the instant was interpreted.

The server receipt timestamp is different from the declared event or
observation time. A receipt timestamp must not replace the time declared by the
keeper, device or source.

```text
declared local date-time + declared time zone
          -> interpreted instant
          -> UTC-normalized transport/persistence value
```

If a user declares only a `LocalDate`, the library must not invent a time or
time zone without an explicit use-case rule.

## Presentation

Storage and presentation are separate concerns:

- UTC is the canonical transport and persistence representation for instants.
- The Aquarium time zone is used for user-facing display when an Aquarium
  context exists.
- A user's device time zone must not silently redefine an Aquarium event.
- Locale affects formatting, not the underlying instant.

## Boundary adapters

The first implementation should expose pure validation and normalization rules
behind typed APIs. Framework and transport adapters may later translate to:

- Firestore `Timestamp` or a documented wire representation;
- JSON/HTTP ISO 8601 strings;
- FIWARE/NGSI-LD temporal properties;
- Angular form and view-model values.

Those adapters must not leak persistence or transport DTOs into the core time
model.

## Initial non-goals

The first slice does not decide or implement:

- recurring schedules;
- calendar arithmetic beyond the required normalization helpers;
- leap-second policy;
- historical event migration;
- reminder or care-work semantics;
- device clock trust or calibration;
- timezone configuration for an Aquarium.

## Implemented first slice

The first public adapter slice exports:

- `Instant` and `LocalDate` typed values;
- the `TimeAdapter` port;
- `createNativeTimeAdapter()`;
- `TIME_ADAPTER`, `provideTimeAdapter(...)` and `TimeService`;
- `TimeDisplayAdapter`, `TimeDisplayService` and the `tankInstant` and
  `tankLocalDate` presentation pipes.

The temporal operations are methods on `TimeAdapter` and `TimeService`, not
global functions.

Tests for the library are intentionally split by public operation and use
Given/When/Then descriptions so that the test suite acts as executable
documentation of each temporal contract.

The initial implementation uses millisecond precision, accepts only ISO
date-times with `Z` or an explicit offset for `Instant`, and rejects local
date-times that are nonexistent or ambiguous in their time zone.

The public API does not accept or expose JavaScript `Date` or `Intl` objects.
The current implementation uses them only inside `createNativeTimeAdapter`.

## Runtime abstraction

The library exposes a `TimeAdapter` port and an Angular `TimeService`. The
native implementation is the default provider:

```text
TimeService -> TIME_ADAPTER -> createNativeTimeAdapter()
```

Applications may replace it without changing their use cases:

```ts
provideTimeAdapter(futureTemporalAdapter);
```

The adapter is the only place where a concrete date-time runtime, JavaScript
standard, polyfill or third-party library may be selected. Consumers should
use `TimeService` inside Angular or call methods on an explicit adapter created
with `createNativeTimeAdapter()` outside Angular. There are no parallel global
helper functions.

Date presentation is provided by the Angular pipes `tankInstant` and
`tankLocalDate`. They delegate to `TimeDisplayService`, whose
`TimeDisplayAdapter` port keeps locale and runtime formatting outside the
presentation classes.

## DatePipe-compatible presentation

The TankOS pipes are compatible with the positional arguments of Angular's
`DatePipe`:

```html
{{ instant | tankInstant:format:timeZone:locale:options }} {{ localDate | tankLocalDate:format:timeZone:locale:options }}
```

The first four arguments have the same meaning as `DatePipe`:

1. `format` is an Angular date format such as `medium`, `fullDate` or a
   custom format string;
2. `timeZone` is the explicit presentation zone;
3. `locale` overrides the Angular locale for that rendering;
4. `options` contains TankOS-specific display options.

The additional arguments are optional and must not alter the temporal value.
They only affect presentation. The core `Instant` remains a UTC-normalized
point on the timeline and a `LocalDate` remains a calendar date without a
zone.

### Time-zone policy

The display zone is resolved at the presentation boundary, with this
precedence:

```text
explicit pipe timezone
        -> aquarium timezone supplied by the presentation context
        -> user timezone supplied by the presentation context
        -> UTC
```

`LOCALE_ID` and `locale` control language and regional formatting. They do not
select the aquarium or user time zone. An aquarium zone must therefore be
passed explicitly by the screen/context or configured in a display adapter;
it must never be inferred from the browser locale.

### Angular display adapter

The library provides an Angular-specific display adapter that delegates the
final localized formatting to `DatePipe`. It is an adapter, not a dependency
of the native temporal implementation:

```text
tankInstant / tankLocalDate
          -> TimeDisplayService
          -> TimeDisplayAdapter
          -> AngularTimeDisplayAdapter
          -> DatePipe
```

The native adapter remains available for non-Angular consumers and continues
to use `Intl`. Applications opt into the Angular adapter through
`provideAngularTimeDisplayAdapter()`.

Angular's `DatePipe` accepts numeric timezone offsets rather than arbitrary
IANA zone identifiers. The Angular adapter therefore resolves an IANA
aquarium zone to the offset that applies at the instant being displayed before
delegating to `DatePipe`. This preserves daylight-saving transitions. A
localized zone name may consequently be rendered as its current GMT offset,
which is a limitation of the Angular formatter contract.

## Ports and adapters layout

The library is organized as a hexagonal boundary:

```text
time/
├── ports/                 # runtime-independent contracts and value types
├── application/           # Angular-facing service and provider wiring
├── adapters/native/       # current JavaScript/Intl implementation
└── presentation/         # Angular presentation entry point
```

Every file whose name starts with `native-` belongs below
`adapters/native/`. A future adapter must live in a sibling directory and
implement the `TimeAdapter` port without changing application consumers. The
native adapter is an infrastructure detail; the port is the stable dependency
direction for the rest of TankOS.

## Test and coverage boundary

The library enforces 100% V8 lines, statements, functions and branches for
executable production code. The coverage configuration excludes only type-only
contracts, the public barrel and test/build tooling; public contracts are
tested through the adapter, Angular DI and component tests.

## Open decisions

1. The exact public TypeScript types for `Instant`, `LocalDate`,
   `ZonedDateTime` and `Duration`.
2. Whether a future slice should support precision finer than milliseconds.
3. The supported time-zone database and invalid-zone behavior.
4. The wire representation used at the Firebase and HTTP boundaries.
5. Which original zone metadata is retained with a normalized instant.
6. Whether duration conversion is part of this library or remains delegated to
   `@tank-os/units`.

Until these decisions are closed, this document records the direction but does
not authorize a concrete date-time API.
