# `feedback`

## Purpose

Provider-neutral global feedback for success, information, warning and error
messages. The default implementation stores ephemeral messages in Angular
Signals.

## Architecture

The library owns the feedback contract and `FEEDBACK_SERVICE`. Applications
provide the implementation and a UI adapter such as `@tankos/feedback-ui`.
Domain, application and infrastructure libraries may depend on the contract,
but do not render global UI themselves.

## Limits and decisions

- Messages are transient UI state, not telemetry or error reporting.
- The in-memory implementation is process-local and is not persisted.
- The package has no dependency on Material, Firebase or a translation system.
- A host should mount one global outlet for a consistent user experience.

## Verification

The contract and signal-backed implementation are covered by Vitest tests.
