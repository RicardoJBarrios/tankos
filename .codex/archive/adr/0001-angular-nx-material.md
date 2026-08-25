# ADR-0001: Angular, Nx and Angular Material

## Status

Accepted

## Context

`tankos` needs a modern web platform, consistent workspace tooling and an
accessible component system that can grow without creating parallel conventions.
See the [target architecture](../../ARCHITECTURE.md).

## Decision

Use compatible stable releases of Angular, Nx and Angular Material. Prefer
standalone APIs, Signals, modern control flow, lazy loading, typed forms and
functional Angular APIs. Nx owns project generation, targets, the project graph
and enforceable module boundaries. Material and CDK are the default UI foundation.

## Consequences

- Angular packages, builders and Material stay on a compatible release matrix.
- Nx generators and targets are the standard workspace entry points.
- Custom UI primitives require a domain or accessibility reason.
- Framework upgrades are coordinated rather than performed package by package.

## Alternatives considered

- Angular without Nx: rejected because it loses the chosen workspace governance.
- A separate UI system: rejected because Angular Material covers the initial need.
- Legacy Angular module patterns: rejected for new code.
