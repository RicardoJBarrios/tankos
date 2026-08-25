# Coding guide

This guide defines the small set of conventions that are not already enforced
by the Angular, TypeScript, ESLint and Nx profiles. The complete quality
contract is [`CODE_GUARDRAILS.md`](CODE_GUARDRAILS.md); the Angular-specific
style reference is [`angular-coding-style-guide.md`](angular-coding-style-guide.md).

## Language and responsibility

- Technical code, filenames, tests, comments and documentation use English.
- Use the ubiquitous domain language; keep provider names out of domain code.
- One file has one primary semantic responsibility. Split code when a type,
  rule, adapter, component or test has an independent contract.
- Prefer a small cohesive file over a monolith, but do not split tightly
  coupled implementation details merely for visual symmetry.
- Export only elements that are part of a real public contract. Every export
  has a focused test or is a type-only declaration.
- All public TypeScript and Angular declarations require TSDoc.

## Angular and structure

- Keep the application composition root in `apps/tankos`.
- Use standalone APIs, Signals, typed forms, lazy routes and `inject()` for new
  Angular code.
- Prefer Angular Material/CDK before custom UI primitives.
- Keep templates focused on rendering and intent; persistence and domain rules
  belong outside templates.
- Use signal inputs/outputs when they clarify a component contract. Use
  `computed()` for derivation and `effect()` only for integration side effects.
- Prefer OnPush-compatible, signal-driven components for new work.
- Use `protected` for members used only by a template and `#private` for real
  private implementation state.

## Feature boundaries

Use the smallest layers required by the feature:

```text
UI -> Signal Store -> application -> ports <- adapters
```

- `domain`: vocabulary, invariants and behavior with no framework imports.
- `application`: commands, queries, orchestration and ports.
- `infrastructure`: provider adapters and external data mapping.
- `ui`: presentation and user intent; no direct Firebase access.
- `composition`: the explicit place where implementations are wired.

Create an Nx library only for independent ownership, reuse, a protected
boundary, isolated targets or a stable public contract. Tag it and consume it
through its public API; never import `src` or private paths. `shared` is not a
default dumping ground and needs a named owner.

## Data and state

- Validate external data with Zod and map DTOs to domain and view models.
- Keep Firestore/HTTP DTOs outside the domain and UI.
- Use local Signals for local state and NgRx `signalStore` for shared or
  complex feature state scoped to the smallest useful injector.
- Use RxJS for streams and explicit bridges, not as an unbounded application
  state store.
- Application code depends on ports; adapters implement those ports.
