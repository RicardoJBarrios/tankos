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

## Consequences

- Consumers can depend on a narrower calculation service or capability port.
- Relative text cannot accidentally become part of a generic duration style.
- Angular adapters are replaceable without importing the native timezone
  implementation.
- Custom adapters must implement `formatHumanizedDuration()`.
- `TimePort` and `TemporalCalculationPort` remain convenient aggregate contracts
  for composition and adapter construction.
