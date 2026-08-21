# Time library architecture decisions

This document records decisions that are specific to the `Time` library.
Repository-wide rules and cross-library architecture decisions belong in
`.codex`; they must not be recorded here unless they specifically constrain
the `Time` library.

## Capabilities and presentation boundaries

The `Time` library keeps the following capability composition:

- `TimePort` is the complete adapter contract used when an implementation needs
  every temporal capability.
- `TemporalCalculationPort` is composed from focused
  `InstantCalculationPort`, `DurationCalculationPort`,
  `IntervalCalculationPort` and `LocalDateCalculationPort` contracts.
- `TemporalCalculationService` is the Angular application facade for
  deterministic calculations.
- `TimeService` remains the facade for clock access, parsing, validation,
  serialization and timezone resolution.

Relative text is a separate presentation capability:

- `tankDuration` supports `iso`, `short`, `long` and `digital` styles.
- `tankHumanizeDuration` delegates to `formatHumanizedDuration()`.
- `TimeDisplayAdapter` and `TimeDisplayService` expose
  `formatHumanizedDuration()` explicitly.

The low-level `createAngularTimeDisplayAdapter()` factory receives an explicit
`TimeZoneDatabasePort`. Default runtime choices are made by Angular composition
providers, which may use the native implementation or a replacement adapter.

All public presentation adapters must implement the complete
`TimeDisplayAdapter` contract, including humanized duration output.

## Zod boundary adapter

Time provides an optional `adapters/zod` factory through
`createZodTimeSchemas()`. It is a validation and mapping boundary, not a
transport client.

The factory receives the active `CalendarPort`, `DurationPort`, `InstantPort`
and `TimeZoneDatabasePort`, and exposes schemas for:

- ISO instants mapped to normalized `Instant` values;
- `YYYY-MM-DD` values mapped to `LocalDate`;
- ISO 8601 durations mapped to millisecond `Duration` values;
- IANA time-zone identifiers validated against the configured zone database.

The schemas accept transport strings only. They do not use `z.coerce.date()`;
they do not infer a time zone; and they preserve the existing decision that
sub-millisecond duration precision is truncated to milliseconds by the active
Time port.

Firestore and JSON/HTTP remain separate conversion adapters. They may use Zod
schemas at their own boundary, but the Zod adapter does not import Firebase,
HTTP or a concrete runtime implementation. The Time core remains independent
from Zod.

The adapter invokes parser ports through their owning port object rather than
passing methods as unbound callbacks. This preserves compatibility with
class-based port implementations that use runtime-private state.

## Consequences

- Consumers can depend on a narrower calculation service or capability port.
- Relative text cannot accidentally become part of a generic duration style.
- Angular adapters are replaceable without importing the native timezone
  implementation.
- Custom adapters must implement `formatHumanizedDuration()`.
- `TimePort` and `TemporalCalculationPort` remain convenient aggregate contracts
  for composition and adapter construction.
