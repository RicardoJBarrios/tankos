# TankOS Time

**Status:** Angular-centric temporal slice implemented, including fixed elapsed
durations and boundary conversions.

This library owns the reusable temporal capability for TankOS. It is separate
from `@tank-os/units`: dates and times are not measurement units, even though
durations can be expressed using units such as hours or minutes.

## Boundary

`@tank-os/time` provides Angular-centric, typed helpers for:

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
Instant                  A unique point on the global timeline.
LocalDate                A calendar date without a time or time zone.
ZonedDateTimeResolution  A local date-time resolved to an Instant with origin metadata.
Duration                 An elapsed amount of time between instants.
```

These values must not be represented interchangeably as arbitrary strings.
Their meaning determines validation, normalization, persistence and display.

## UTC normalization

When a user, device or imported source declares a date-time, TankOS preserves
the declared instant and normalizes the stored instant to UTC at the server
boundary. When required, the original time-zone context is retained in a
separate resolution envelope; it is never added to the `Instant` value itself.

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

The transport adapters are infrastructure adapters and depend only on
the capability ports they need, rather than on native parsing. Firestore and
JSON/HTTP use `InstantPort`, `DurationPort` and `CalendarPort`; the Angular
display adapter uses `InstantPort` and `CalendarPort`:

```ts
const firestore = createFirestoreTimeAdapter(timePort);
const jsonHttp = createJsonHttpTimeAdapter(timePort);
```

The Firestore adapter uses the client SDK `Timestamp` and stores `Instant` at
the library's millisecond precision. Nanoseconds below milliseconds are
truncated, never rounded. `LocalDate` is stored as the canonical `YYYY-MM-DD`
string because it is a calendar value, not a timestamp. The adapter rejects
Admin SDK or unrelated timestamp objects instead of silently accepting a
structurally similar value.

The JSON/HTTP adapter serializes `Instant` as canonical UTC ISO 8601 with
millisecond precision and `LocalDate` as `YYYY-MM-DD`. Deserializers validate
the transport value with Zod and then through the active capability ports; they
raise `RangeError` for malformed or unsupported input.

The reusable `@tank-os/time/zod` entry point exposes `createZodTimeSchemas()`. It
creates schemas for instants, local dates, durations and IANA time zones using
the active Time ports and zone database. It is a validation/mapping adapter,
not a JSON client, Firestore adapter or replacement for the existing transport
adapters. It never uses `z.coerce.date()` and never infers a time zone.

It is imported separately as `@tank-os/time/zod`. The primary entry point also
re-exports the adapter contracts needed for package composition; consumers that
only need a transport boundary should use the dedicated secondary entry point.

`Duration` is an elapsed, fixed-unit value normalized to an integer number of
milliseconds. JSON/HTTP represents it as canonical ISO 8601 using days, hours,
minutes and seconds, with at most three fractional digits. Firestore stores
the normalized integer milliseconds as a number. Calendar units such as years,
months and weeks are rejected because they require a calendar reference to
have a stable elapsed meaning.

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
- `Duration` and `DurationInput` typed values;
- the `InstantPort`, `DurationPort`, `CalendarPort` and `TimeZonePort`
  contracts, composed as `TimePort` when all capabilities are required;
- the `TimeZoneDatabasePort` port;
- the `TemporalCalculationPort` aggregate and its focused
  `InstantCalculationPort`, `DurationCalculationPort`,
  `IntervalCalculationPort` and `LocalDateCalculationPort` contracts;
- the `TimeLocalePort` port for replaceable locale sources;
- the `ClockPort` port, `TimeService` and `TemporalCalculationService`;
- `createNativeClock()`, `createNativeTimeAdapter()` and
  `createNativeTimeZoneDatabase()`;
- the native duration validation, parsing and serialization helpers;
- `TIME_PORT`, `TIME_CLOCK`, `provideTimePort(...)`,
  `provideTimeClock(...)`, `provideTimeZoneDatabase(...)`,
  `provideTimeLocale(...)` and
  `provideTankOsTime()`;
- `TimeDisplayAdapter`, `TimeDisplayService` and the `tankInstant`,
  `tankLocalDate`, `tankDuration` and `tankHumanizeDuration` presentation
  pipes. `tankDuration` uses the `iso`, `short`, `long` and `digital` styles;
  ISO is a presentation style, while ISO serialization
  remains a separate transport operation. `tankHumanizeDuration` is the
  dedicated relative-text entry point.
- Firestore and JSON/HTTP conversion adapters through their dedicated entry
  points.
- `TimeService.parseDuration()`, `TimeService.isValidDuration()` and
  `TimeService.toDurationIsoString()`;
- `TemporalCalculationService.durationBetween()`, `addDuration()`, temporal
  comparisons, closed intervals, `addLocalDate()` and calendar-date duration
  differences;
- `TimeService.resolveZonedDateTime()` and
  `TimeService.resolveOffsetDateTime()`;

The temporal operations are methods on the capability ports and
`TemporalCalculationService`, not global functions.

## Documentation boundary

All documentation and architecture decisions specific to this library belong
under `libs/tank-os/time/docs`. The repository `.codex` directory is reserved
for shared guardrails and cross-library decisions; do not add `Time`-specific
ADRs or design notes there.

The public capability split and presentation boundary are recorded in
[`architecture-decisions.md`](./architecture-decisions.md).

## Temporal calculations

The calculation port operates on normalized temporal values and keeps business
meaning outside this library:

- `durationBetween(start, end)` returns signed elapsed milliseconds between two
  instants;
- `addDuration(start, duration)` shifts an instant by an elapsed duration;
- `compareInstants()` and `compareDurations()` return `-1`, `0` or `1`;
- `TimeInterval` is a closed interval, so both boundaries belong to it;
- `contains()` checks interval membership and `clamp()` limits a value to its
  boundaries;
- `addLocalDate()` applies whole calendar years, months and days without a
  time-zone conversion;
- `durationBetweenLocalDates()` returns the signed distance in whole calendar
  days, represented as a duration in milliseconds.

Calendar arithmetic constrains a day to the last valid day of the resulting
month: adding one month to January 31 therefore produces February 28 or 29.
Instant arithmetic and calendar arithmetic are deliberately separate; a local
date does not become an instant unless a time zone is supplied explicitly.
Recurrence rules, aquarium schedules and business concepts such as quarantine
or maintenance periods remain outside `Time`.

Tests for the library are intentionally split by public operation and use
Given/When/Then descriptions so that the test suite acts as executable
documentation of each temporal contract.

The implementation uses millisecond precision permanently for this library.
ISO date-times with `Z` or an explicit offset may contain finer fractions, but
those fractions are truncated after the first three digits. Numeric epoch
values and Firestore nanoseconds follow the same truncation rule. The library
accepts only ISO date-times with `Z` or an explicit offset for `Instant`, and
rejects local date-times that are nonexistent or ambiguous in their time zone.

The public API does not accept or expose JavaScript `Date` or `Intl` objects.
Those runtimes are confined to the native and Angular adapters.

## Runtime abstraction

The library exposes capability ports and Angular application services. Angular
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
adapter consumes the active capability ports; it does not import the native
implementation directly. Consumers should use `TimeService` for normalization
and `TemporalCalculationService` for calculations inside Angular, or call
methods on an explicit adapter created with `createNativeTimeAdapter()` outside
Angular. There are no parallel global helper functions.

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

Date and duration presentation is provided by the Angular pipes `tankInstant`,
`tankLocalDate` and `tankDuration`. They delegate to `TimeDisplayService`, whose
`TimeDisplayAdapter` port keeps locale and runtime formatting outside the
presentation classes.

`tankDuration` accepts `style` (`iso`, `short`, `long` or `digital`) and an
optional locale. Its `iso` style is deterministic and does not use
internationalization; the other styles are delegated to the active display
adapter. The pipe remains a single presentation entry point for all duration
styles.

`tankHumanizeDuration` is the dedicated relative-text pipe. It interprets the duration sign relative to the current
moment: negative values become past text such as “3 hours ago”, positive values
become future text such as “in 2 hours”, and zero becomes the locale's “now”.
It chooses seconds, minutes, hours or days according to the largest applicable
unit and delegates wording to the active display adapter.

It accepts `calendarUnits: 'none' | 'approximate'`. The default `none` keeps
the exact elapsed-time units. `approximate` may select months using 30 days and
years using 365 days; these are explicitly approximate and must not be used as
calendar arithmetic.

Locale responsibility is split between the pipe and the display adapter. Pipe
tests verify that an explicitly supplied locale is forwarded unchanged to
`TimeDisplayService`; they do not duplicate the formatting implementation.
The Angular display-adapter tests verify the observable localized output,
including explicit locales and locale sources that change at runtime. This
keeps the pipes focused on input normalization and delegation while keeping
locale-specific behavior in the adapter that owns it.

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
4. `options` supplies additional `TimeDisplayOptions`; when the same field is
   provided positionally and inside `options`, the positional argument wins.

The additional `options` argument is optional and must not alter the temporal
value. It only affects presentation. The core `Instant` remains a UTC-normalized
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

Display pipes are deliberately impure so that a localization adapter whose
active locale changes at runtime can be observed without changing the temporal
value. Custom locale sources must return the current locale from
`TimeLocalePort.getLocale()`. A custom display adapter remains responsible for
reactive translation details and must return a synchronous display string.

Core named-zone resolution accepts IANA identifiers. Angular display additionally
accepts `UTC`, `Z` and validated fixed numeric offsets because those are the
values supported by the `DatePipe` boundary.

### Angular display adapter

The library provides an Angular-specific display adapter that delegates the
final localized formatting to `DatePipe`. It is an adapter, not a dependency
of the native temporal implementation:

```text
tankInstant / tankLocalDate / tankDuration / tankHumanizeDuration
          -> TimeDisplayService
          -> TimeDisplayAdapter
          -> AngularTimeDisplayAdapter
          -> DatePipe and Intl.NumberFormat
```

The native temporal adapter remains available for non-Angular consumers and
continues to use the JavaScript runtime for parsing and normalization. It does
not provide a second display implementation. Angular applications should use
`provideTankOsTime()` for the default composition. They may use
`provideTimeDisplayContext(...)` for aquarium and user fallback zones, or
`provideAngularTimeDisplayAdapter(...)` when a scoped explicit fallback must
override that context. The lower-level
`createAngularTimeDisplayAdapter(...)` factory requires an explicit
`TimeZoneDatabasePort`; default runtime choices belong to the composition
layer, not to the adapter itself.

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
├── adapters/zod/          # Zod boundary schemas backed by Time ports
└── presentation/         # Angular presentation entry point
```

Every file whose name starts with `native-` belongs below
`adapters/native/`. A future adapter must live in a sibling directory and
implement the composed temporal ports without changing application consumers. The
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

The library exposes Nx `build`, `test` and `lint` targets. The build uses
`@nx/angular:ng-packagr-lite` and packages the public TypeScript declarations
and production sources into `dist/libs/tank-os/time`, including the `firestore`,
`json-http` and `zod` secondary entry points.

The library enforces 100% V8 lines, statements, functions and branches without
a manual source exclusion list. Type-only declarations, barrels and files with
no executable counters do not lower the resulting percentage; their public
contracts are exercised through adapter, Angular DI and pipe tests. Component
fixtures belong to the consuming Angular application when a component is
present.

Runtime boundaries validate structured values before they enter the temporal
model. JSON/HTTP strings use Zod followed by the active adapter; Firestore
timestamps must be client SDK `Timestamp` instances; sub-millisecond
nanoseconds are truncated at the boundary. Native structured values must
contain their correct discriminant (`instant`, `local-date` or `duration`) and
all required numeric fields.

All temporal millisecond normalization uses the shared validation helpers in
`core/validation`; adapters must not implement their own rounding or
truncation formula.

## Time-zone database and origin metadata

Time-zone identifiers use the IANA TZDB vocabulary. The native adapter obtains
rules from the runtime's `Intl` implementation through the
`TimeZoneDatabasePort`; the port allows a future adapter to provide another
TZDB or Temporal implementation. Abbreviations such as `CET` and `PST` are
not accepted because they are ambiguous. Invalid identifiers raise
`RangeError` when used for resolution and return `false` during validation.

`fromZonedDateTime()` returns only the normalized `Instant` for callers that
do not need provenance. `resolveZonedDateTime()` returns an envelope with the
instant and the declared IANA zone plus the offset applicable at that instant.
`resolveOffsetDateTime()` provides the equivalent contract when the source only
declared a numeric offset.
The owning observation, measurement or event may persist this envelope when
provenance matters; the source metadata never changes the normalized instant.

## Future decisions

1. Whether to add a bundled or Temporal-backed TZDB adapter.
2. Which original zone metadata domain records require persistence.

These future decisions do not invalidate the current `Instant`, `LocalDate`,
temporal ports, Angular provider or presentation contracts.
