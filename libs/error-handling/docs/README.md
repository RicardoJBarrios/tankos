# `@tankos/error-handling`

## Purpose

`@tankos/error-handling` defines the provider-neutral error contract used to
classify failures, normalize library errors and report unexpected failures.
It provides Angular integration, but the core error model does not depend on a
specific persistence provider or user-facing translation system.

## Responsibilities

- define `AppError`, error codes, severity and retryability;
- normalize unknown or library-owned errors through ordered normalizers;
- report errors through an injected `ErrorReporter`;
- provide the Angular global error boundary and composition helpers.

## Architecture

```text
provider / domain error
          |
          v
  ErrorNormalizer adapters
          |
          v
  normalizeUnknownError -> AppError
          |
          v
  ErrorReporter / Angular boundary
```

Libraries should expose normalizers for errors they own. The application
composes all applicable normalizers and decides how errors are logged,
telemetrized or shown to users.

## Security and presentation boundary

An `AppError` is an operational contract, not a user-facing message. Error
messages must be resolved by the application or an i18n adapter. Causes and
contexts may contain sensitive information and must be filtered before being
sent to telemetry or displayed.

## Decisions and limits

- Unknown errors normalize to a non-retryable critical error.
- Existing `AppError` values are preserved.
- Normalizers are explicit and ordered; this library does not guess provider
  semantics.
- Retryability is a classification hint, not an automatic retry mechanism.
- The global Angular handler is a last boundary, not a replacement for local
  expected-error handling in feature flows.

## Extension guide

Add provider adapters in the provider library that owns the error vocabulary,
then register their `ErrorNormalizer` at the application composition root.
Keep domain-specific error codes and recovery decisions near the domain.

## Current status

The core contract, normalization pipeline and Angular global boundary are
implemented and tested. Provider-specific normalizers remain application or
adapter responsibilities.
