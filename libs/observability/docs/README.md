# `@tankos/observability`

## Purpose

`@tankos/observability` supplies replaceable logging and telemetry contracts.
Libraries depend on `Logger` and `Telemetry` interfaces rather than directly
importing Console, Firebase Analytics, Azure Monitor or another vendor SDK.

## Responsibilities

- expose log levels, structured context and telemetry event contracts;
- filter logs by a configured minimum level;
- fan out records to configured sinks;
- isolate sink failures from application flow;
- provide the Console log sink;
- provide the Firebase Analytics telemetry adapter.

## Architecture

```text
library
  |
  v
Logger / Telemetry
  |
  v
Observability composition
  |------------------|
  v                  v
Console sink      Firebase sink
```

The core is vendor-neutral. Sink adapters are optional and are selected by the
application composition root.

## Environment policy

The application should configure `minimumLogLevel` by environment, normally
including `debug` locally and restricting production to `warn` or `error`.
Telemetry enablement and sampling are also host decisions. The library never
assumes that development logs or production telemetry are enabled.

## Security and privacy

Contexts and exception payloads must not contain passwords, tokens or
unfiltered personal data. Redaction, sampling, user consent and retention
policy belong to the host and its selected sink.

## Decisions and limits

- Sink failures are swallowed so observability cannot break business flow.
- Logger and telemetry are independent and can be replaced separately.
- Firebase is an adapter, not a dependency of the core contract.
- The current Firebase adapter sends exception data as an Analytics event; a
  dedicated Crashlytics adapter can be added later without changing consumers.
- This library does not automatically intercept every domain operation;
  feature libraries add meaningful logs at their own boundaries.

## Extension guide

Implement `LogSink` or `TelemetrySink` for a new backend and register it with
`createObservability`. Keep SDK imports and vendor-specific mapping inside the
adapter package or the application.

## Current status

Console logging, minimum-level filtering, Firebase telemetry and isolated sink
failures are implemented and tested.
