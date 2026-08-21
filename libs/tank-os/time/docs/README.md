# TankOS Time

**Status:** Angular-centric first slice implemented; future temporal concepts
remain intentionally separate from the current stable contracts.

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
- Firestore persistence or repository operations;
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

The implementation exposes typed APIs behind Angular services and replaceable
ports. Framework and transport adapters translate to:

- Firestore `Timestamp` or a documented wire representation;
- JSON/HTTP ISO 8601 strings;
- FIWARE/NGSI-LD temporal properties in a future adapter;
- Angular form and view-model values.

Those adapters must not leak persistence or transport DTOs into the core time
model.

## Transport adapters

The transport adapters are Angular-compatible infrastructure and depend on the
`TimeAdapter` port rather than on native parsing:

```ts
const firestore = createFirestoreTimeAdapter(timeAdapter);
const jsonHttp = createJsonHttpTimeAdapter(timeAdapter);
```

The Firestore adapter uses the client SDK `Timestamp` and stores `Instant` at
the library's millisecond precision. It rejects timestamps containing
sub-millisecond information instead of silently truncating it. `LocalDate` is
stored as the canonical `YYYY-MM-DD` string because it is a calendar value,
not a timestamp. The adapter rejects Admin SDK or unrelated timestamp objects
instead of silently accepting a structurally similar value.

The JSON/HTTP adapter serializes `Instant` as canonical UTC ISO 8601 with
millisecond precision and `LocalDate` as `YYYY-MM-DD`. Deserializers validate
the transport value with Zod and then through the active `TimeAdapter`; they
raise `RangeError` for malformed or unsupported input.

Both adapters are deliberately conversion adapters, not database clients or
HTTP clients. Repository and API services own the actual read/write operation
and call the corresponding `to...` method on output and `from...` or
`deserialize...` method on input.

## Current non-goals

The current slice does not decide or implement:

- recurring schedules;
- calendar arithmetic beyond the required normalization helpers;
- leap-second policy;
- historical event migration;
- reminder or care-work semantics;
- device clock trust or calibration;
- timezone configuration for an Aquarium.

## Implemented slice

The first public adapter slice exports:

- `Instant`, `LocalDate` and `LocalDateInput` typed values;
- the `TimeAdapter` port;
- the `TimeLocalePort` port for replaceable locale sources;
- the `ClockPort` port and `TimeService.now()`;
- `createNativeTimeAdapter()`;
- `TIME_ADAPTER`, `TIME_CLOCK`, `provideTimeAdapter(...)`,
  `provideTimeClock(...)`, `provideTimeLocale(...)` and
  `provideTankOsTime()`;
- `TimeDisplayAdapter`, `TimeDisplayService` and the `tankInstant` and
  `tankLocalDate` presentation pipes.
- Firestore and JSON/HTTP conversion adapters through their dedicated entry
  points.

The temporal operations are methods on `TimeAdapter` and `TimeService`, not
global functions.

Tests for the library are intentionally split by public operation and use
Given/When/Then descriptions so that the test suite acts as executable
documentation of each temporal contract.

The initial implementation uses millisecond precision, accepts only ISO
date-times with `Z` or an explicit offset for `Instant`, and rejects local
date-times that are nonexistent or ambiguous in their time zone.

The public API does not accept or expose JavaScript `Date` or `Intl` objects.
Those runtimes are confined to the native and Angular adapters.

## Runtime abstraction

The library exposes a `TimeAdapter` port and an Angular `TimeService`. Angular
consumers receive the `DatePipe`-backed display adapter by default:

```text
TimeDisplayService -> TIME_DISPLAY_ADAPTER -> DatePipe
```

Applications may replace the display adapter without changing their use cases:

```ts
provideTimeDisplayAdapter(customDisplayAdapter);
```

The adapter is the only place where a concrete date-time runtime, JavaScript
standard, polyfill or third-party library may be selected. The Angular display
adapter consumes the active `TimeAdapter` through its port; it does not import
the native implementation directly. Consumers should use `TimeService` inside
Angular or call methods on an explicit adapter created with
`createNativeTimeAdapter()` outside Angular. There are no parallel global
helper functions.

The main entry point contains the Angular-facing API and native adapter. The
Firestore and JSON/HTTP conversion adapters use dedicated entry points:

```ts
import { createFirestoreTimeAdapter } from '@tank-os/time/firestore';
import { createJsonHttpTimeAdapter } from '@tank-os/time/json-http';
```

This keeps transport-specific dependencies outside consumers that only need
temporal values, Angular services or presentation pipes.

Angular applications should register the default composition explicitly:

```ts
providers: [provideTankOsTime()];
```

The application layer exposes tokens and services; concrete native and
Angular providers are kept in the composition layer.

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
4. `options` is reserved for additional TankOS display context; formatting is
   always selected through the `format` argument.

The additional arguments are optional and must not alter the temporal value.
They only affect presentation. The core `Instant` remains a UTC-normalized
point on the timeline and a `LocalDate` remains a calendar date without a
zone. `timeZone` is intentionally ignored for `tankLocalDate`; a calendar date
must not be shifted by a time-zone conversion.

### Time-zone policy

The display zone is resolved at the presentation boundary, with this
precedence:

```text
explicit pipe timezone
        -> aquarium timezone supplied by the presentation context
        -> user timezone supplied by the presentation context
        -> UTC
```

The default Angular composition obtains its locale from `LOCALE_ID`, but the
display contract depends on `TimeLocalePort`, not on Angular. A future
Transloco or other localization integration can register its own source with
`provideTimeLocale(...)` without changing the time services, pipes or core
types.

`LOCALE_ID` and the pipe `locale` argument control language and regional
formatting. They do not select the aquarium or user time zone. An aquarium zone is supplied through
`provideTimeDisplayContext(...)` or an explicit pipe argument. It must never be
inferred from the browser locale.

Core time-zone resolution accepts IANA identifiers. Angular display additionally
accepts `UTC`, `Z` and validated fixed numeric offsets because those are the
values supported by the `DatePipe` boundary.

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

The native temporal adapter remains available for non-Angular consumers and
continues to use the JavaScript runtime for parsing and normalization. It does
not provide a second display implementation. Angular applications should use
`provideTankOsTime()` for the default composition. They may use
`provideTimeDisplayContext(...)` for aquarium and user fallback zones, or
`provideAngularTimeDisplayAdapter(...)` when a scoped explicit fallback must
override that context.

Angular's `DatePipe` accepts numeric timezone offsets rather than arbitrary
IANA zone identifiers. The Angular adapter therefore resolves an IANA
aquarium zone to the offset that applies at the instant being displayed before
delegating to `DatePipe`. This preserves daylight-saving transitions. A
localized zone name may consequently be rendered as its current GMT offset,
which is a limitation of the Angular formatter contract.

## Ports and adapters layout

The library is organized as an Angular-centric hexagonal boundary:

```text
time/
├── core/
│   ├── ports/             # runtime-independent contracts
│   ├── value-types/       # temporal values and accepted inputs
│   └── validation/        # pure calendar and temporal rules
├── application/           # Angular services and injection tokens
├── composition/angular/   # Angular provider composition
├── adapters/native/       # current JavaScript temporal implementation
├── adapters/angular/      # Angular DatePipe integration
└── presentation/         # Angular presentation entry point
```

Every file whose name starts with `native-` belongs below
`adapters/native/`. A future adapter must live in a sibling directory and
implement the `TimeAdapter` port without changing application consumers. The
native temporal adapter is an infrastructure detail; the port is the stable
dependency direction for the rest of TankOS.

## Sheriff boundaries

TankOS libraries are registered in the repository Sheriff configuration with
isolated `tank-os:layer:*` tags. The standard dependency direction is:

```text
library-root -> core, application, adapters, presentation
application  -> core, adapters
adapters     -> core
presentation -> application, core
core         -> core
```

Each library registers its actual internal directories explicitly because
Sheriff does not support repeating the same path placeholder to express a
library directory and its homonymous source directory. A different layer or
dependency requires an explicit Sheriff rule and an update to this document
(or the corresponding library documentation). The library's lint target is
the enforcement point for these boundaries.

## Build, test and coverage boundary

The library exposes Nx `build`, `test` and `lint` targets. The build compiles
the public TypeScript declarations and production sources into
`dist/libs/tank-os/time`.

The library enforces 100% V8 lines, statements, functions and branches for
executable production code. The coverage configuration excludes only type-only
contracts, the public barrel and test/build tooling; public contracts are
tested through the adapter, Angular DI and pipe tests. Component fixtures belong
to the consuming Angular application when a component is present.

Runtime boundaries validate structured values before they enter the temporal
model. JSON/HTTP strings use Zod followed by the active adapter; Firestore
timestamps must be client SDK `Timestamp` instances and must represent whole
milliseconds. Native structured values must contain their correct discriminant
(`instant` or `local-date`) and all required numeric fields.

## Future decisions

1. Whether `ZonedDateTime` and `Duration` become public value types in a later
   slice.
2. Whether a future slice should support precision finer than milliseconds.
3. The supported time-zone database and invalid-zone behavior.
4. Which original zone metadata is retained with a normalized instant.
5. Whether duration conversion is part of this library or remains delegated to
   `@tank-os/units`.

These future decisions do not invalidate the current `Instant`, `LocalDate`,
`TimeAdapter`, Angular provider or presentation contracts.
