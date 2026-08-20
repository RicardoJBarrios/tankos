# Coding Guide

## Language and naming

Technical code, filenames, tests, comments and documentation use English.
Spanish is user-facing content only. Use domain language consistently and avoid
provider-specific names in domain code.

All exported TypeScript and Angular declarations require TSDoc. Non-exported
code requires TSDoc when it carries non-obvious domain logic, conversion,
compatibility, failure or architectural meaning. TSDoc must explain the
contract and justification, not restate the implementation. Follow
[`CODE_GUARDRAILS.md`](CODE_GUARDRAILS.md) for the complete requirement.

Each file has one primary semantic responsibility. Split types, pure rules,
adapters, Angular services, components and tests at meaningful boundaries;
avoid monolithic files and document any deliberate small-file exception.

Use Angular's `inject()` function for dependency injection. Constructor
parameter injection is not permitted; migrate existing code with the Angular
`inject` schematic exposed through Nx and keep `@angular-eslint/prefer-inject`
enabled.

## Structure

Keep the application composition root in `apps/veril`. New domain code follows:

```text
<domain>/{domain,application,infrastructure,ui}
```

Extract to Nx libraries only for real ownership, reuse or boundary needs.

Within a feature, use only the layers the use case needs:

- `feature`: route-level composition and user workflow coordination.
- `application`: commands, queries, orchestration and ports.
- `domain`: business vocabulary, behavior and accepted invariants.
- `infrastructure`: adapters to Firebase, browser APIs or other providers.
- `ui`: reusable presentation components with no domain persistence knowledge.

Use a container for feature composition and interaction orchestration, and a
presentational component for focused rendering and emitted intent. A facade owns
shared feature state only when local state is insufficient. An adapter translates
an external API; a mapper translates between transport, domain and view models.
These are responsibilities, not mandatory folders or classes.

Give a domain concept its own type or file when it owns domain meaning,
invariants, creation/parsing behavior or independent evolution. File boundaries
follow semantic responsibility, not visual symmetry: keep tightly coupled
concepts together when separation would add ceremony, and do not merge distinct
concepts merely because their representations look alike.

Aggregate identities generated internally by Veril follow a common validation
policy. A different identity format requires an explicit business requirement;
imports, migrations and external integrations may define one only when those
capabilities actually exist.

## Nx libraries and boundaries

Keep code in `apps/veril` while it has one clear owner and no independently
enforceable boundary. Create a library only when a validated feature needs one
of: independent ownership, reuse by more than one project, a protected
dependency boundary, isolated tests/build target, or a stable public contract.

- Name projects by domain and responsibility, for example
  `aquariums-feature` or `aquariums-data-access`; do not use generic names such
  as `common`, `core` or `shared` without explicit ownership.
- Tag each library with `scope:<domain>` and `type:<responsibility>`.
- Enforce tags through Nx/ESLint boundaries as part of the same change that
  creates the library. Cross-domain access goes through an explicit public
  application contract, not deep imports.
- Import another library through its public API. Do not import its `src` tree or
  private implementation paths.
- `shared` is exceptional: give it a named owner and a narrow technical or
  cross-domain purpose; it is never a default destination.

## Angular

Prefer standalone components, functional APIs, Signals, typed forms, lazy routes
and `inject()` where they improve clarity. Use Angular Material/CDK before custom
primitives and preserve accessibility semantics.

- Use signal inputs and outputs when they make a component contract clearer;
  avoid mutable input patterns.
- Use `computed()` for synchronous derivation and `effect()` only for explicit
  integration side effects, never as ordinary data flow or persistence logic.
- Prefer OnPush-compatible, signal-driven rendering for new components where it
  improves local reasoning; do not refactor existing code merely to enforce it.
- Use functional guards and interceptors at application boundaries. Guards are
  navigation UX, never authorization.
- Keep templates focused on rendering and intent; do not embed business logic
  or persistence orchestration in them.
- Do not use arbitrary `Subject`s or singleton services as feature-domain state
  stores. Components must not access Firebase directly.

## Feature and domain interaction

UI expresses intent to an application use case. A scoped Signal Store may
coordinate shared feature state; it does not own domain persistence. Application
code depends on ports, and adapters implement those ports at infrastructure
boundaries. Firebase, AngularFire and browser APIs remain outside the domain.

Cross-domain imports require an explicit application contract or documented
justification. Keep shared code technical, narrow and owned; never create an
empty port, adapter, facade or library in anticipation of reuse.

## State and asynchronous work

Use local Signals for local state. Use NgRx `signalStore` for shared or complex
feature state, scoped to the smallest useful injector. Use RxJS for streams and
bridge it explicitly; do not create duplicate persistence or pending-write queues.

## Data boundaries

Validate external data with Zod, derive DTO types with `z.infer`, then map DTOs
to domain entities or value objects. Keep Firestore DTOs and AngularFire outside
the domain and UI.

## Dependency direction

```text
UI -> Signal Store -> application -> ports <- adapters
```

The domain must not import Angular, Firebase, AngularFire, Zod or NgRx.
