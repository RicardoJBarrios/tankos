# Code Documentation and Library Testing Guardrails

These are repository-wide delivery rules for new and modified code. They
apply especially to TankOS applications and libraries.

## TSDoc requirement

All exported TypeScript declarations must have TSDoc before the change is
considered complete:

- classes and Angular services;
- functions and methods;
- interfaces, types, enums and type aliases;
- exported constants, injection tokens and providers;
- Angular components, directives and pipes;
- public adapter ports and public view-model contracts.

Non-exported declarations also require TSDoc when they contain non-obvious
domain logic, conversion rules, compatibility behavior, error semantics or an
architectural decision. Comments must explain intent, invariants, assumptions
or justification; they must not merely restate the code.

## Runtime privacy

When a class member is genuinely private at runtime, use ECMAScript private
field or method syntax with `#` (for example, `#adapter` or `#rebuildIndex`).
Do not use TypeScript's `private` keyword where runtime privacy is part of the
contract; TypeScript `private` is only a compile-time restriction. Keep
implementation details private unless a public contract requires exposing
them.

## Angular dependency injection

Angular dependencies must be obtained with the `inject()` function. Do not add
constructor parameter injection. When migrating existing Angular code, run the
Angular migration schematic through Nx:

```text
nx generate @angular/core:inject --path=<project-or-scope>
```

The Angular ESLint rule `@angular-eslint/prefer-inject` is an error in Angular
projects and is the automated enforcement for future code.

## One responsibility per file

Each source file must have one primary semantic responsibility. Do not create
monolithic files that combine types, domain rules, parsing, provider adapters,
Angular DI, UI rendering and tests. Split code when a file crosses a meaningful
responsibility boundary, using names that describe the responsibility:

- types and public contracts;
- pure domain rules and validation;
- one external/runtime adapter;
- Angular services and providers;
- components and their templates/styles;
- tests for the corresponding contract.

Small, tightly coupled declarations may remain together when separating them
would obscure the contract, but that exception must be justified in TSDoc or
the local library documentation. A growing file is a signal to refactor before
adding another unrelated concern.

Libraries that abstract an external runtime must use ports and adapters. Keep
runtime-independent contracts in a `ports/` area, application orchestration in
its own area, and each concrete implementation in an `adapters/<name>/` area.
All files for a concrete adapter, including its paired tests, must remain
inside that adapter directory. In particular, files prefixed `native-` belong
under `adapters/native/` and must not be placed beside the port or application
files.

TankOS libraries must declare their internal modules and architectural layers
in `sheriff.config.ts`. The default dependency direction is strict:

```text
library-root -> core, application, adapters, presentation
application  -> core, adapters
adapters     -> core
presentation -> application, core
core         -> core
```

New library layers or exceptions require an explicit Sheriff rule and a local
documentation update. A library lint failure is an architectural failure, not
an import-order issue to bypass.

## Directory barrels

When a directory contains multiple reusable or public elements, add an
`index.ts` barrel for that directory and import the directory's public API
through the barrel from outside the directory. Keep direct file imports for
private implementation details and for the paired test of the file under test.
Barrels must expose only the intended public surface and must not be used to
hide circular dependencies.

At minimum, public TSDoc must state the purpose, relevant inputs and outputs,
failure behavior and important side effects. Use `@remarks` for architectural
justification and `@throws`, `@param`, `@returns` and `@example` where they add
meaningful contract information.

Do not use undocumented public APIs, `TODO` comments as a substitute for a
decision, or comments that expose stale historical reasoning. Update the
library's local `docs/` when a public contract or durable decision changes.

## Library coverage requirement

Every Nx library must maintain 100% coverage for all four V8 metrics:

```text
lines      100%
statements 100%
functions  100%
branches   100%
```

Coverage must be enabled by default in the library's Nx `test` target; passing
`--coverage` manually is not enough. The threshold applies to the library's
executable production source, not only to the files imported by one test. A
normal `nx test <library>` run must measure coverage and fail when a threshold
is not met. Type-only declarations and barrel files with no executable code may
be excluded explicitly and locally; their public contract must still be
covered through import-path tests. Generated scaffolding is not an exemption:
remove it, document it or cover it.

Use focused tests for pure logic and Angular tests for Angular behavior. Tests
must cover successful behavior, invalid input, boundary values and relevant
failure paths. In addition, every documented use case and public contract must
have an explicit test scenario; V8 coverage percentages cannot substitute for
use-case coverage. A feature is incomplete when its statements are covered but
one of its user-visible flows, failure modes or compatibility contracts is not
tested. Avoid lowering thresholds, excluding source files or adding unreachable
branches merely to make coverage pass.

Angular integration tests must use `@ngneat/spectator/vitest` for components,
directives, rendered pipes, fixtures and Angular DI contexts. Use Spectator
factories such as `createComponentFactory` and `createPipeFactory`; focused
unit tests for injectable classes or pipes that do not render a template may
use `TestBed.runInInjectionContext`. Use plain Vitest for pure domain logic
and runtime adapters.

## Test structure and Gherkin style

Every executable TypeScript implementation file must have one test file with
the same basename and the `.spec.ts` suffix. For example,
`native-time-adapter.ts` pairs with `native-time-adapter.spec.ts`. The test file
may contain several scenarios for the single implementation responsibility,
but tests for a different implementation file must not be placed there.

The only exceptions are type-only files, public barrels with no executable
code, and explicitly documented generated/tooling files. Those exceptions must
be visible in the library's local documentation or coverage configuration.
Do not create test files with unrelated names such as
`create-native-time-adapter.spec.ts` for `native-time-adapter.ts`.

The paired test must cover every public element and behavior owned by its
implementation file. If a source file grows beyond one coherent responsibility,
split the source/test pair together rather than scattering tests across
unrelated specs.

## Input variants and edge cases

Whenever a function, method, pipe or public contract accepts more than one
possible input type or value category, tests must cover every allowed type and
category explicitly. This includes relevant boundary and exceptional values,
such as `NaN` and infinities for numeric inputs, `null`, `undefined`, empty
strings, whitespace-only strings, zero, negative values and empty collections
when they are permitted or represent meaningful invalid inputs. Each scenario
must state the expected result, normalization or error; type-level unions and
aggregate coverage percentages do not replace these behavioral cases.

Each test description must be readable as a behavior specification and should
follow this structure:

```text
Given <initial context>,
When <operation>,
Then <observable result>
```

The wording may use `describe` and `it` rather than a Gherkin runner, but the
test must preserve the Given/When/Then sequence. A reader should be able to
derive the tested contract and expected failure behavior without opening the
implementation. Use one scenario per expected behavior; parameterized tests
are acceptable only when every row expresses the same behavior.

### Extreme-value completeness checklist

Before closing a test review for a public operation, explicitly check the
following matrix against its runtime contract:

- numeric inputs: `NaN`, `Infinity` and `-Infinity`;
- nullable inputs: `null` and `undefined`;
- strings: empty, whitespace-only, leading/trailing whitespace and unexpected
  special characters;
- signed and boundary values: zero, negative values, minimum/maximum supported
  values and truncation or rounding boundaries;
- structured inputs: missing fields, wrong field types, wrong discriminators,
  invalid nested values and valid normalized objects;
- union arguments: every permitted input type, including meaningful mixed-type
  combinations when more than one argument accepts the union.

Do not treat testing only `Infinity` as coverage of both infinities, and do not
treat aggregate V8 coverage as evidence that this matrix is complete. Shared
parsers and validators may own the exhaustive malformed-input matrix; facade,
adapter and Angular integration tests should add only the boundary cases that
prove they preserve that contract.

Avoid overtesting by keeping each invalid-value matrix next to the layer that
owns the behavior. Do not repeat every parser case in every service when the
service is a transparent delegation boundary; do test a representative
success, failure and normalization case at that public boundary.

## Breaking and compatibility tests

Each library with a public API must include breaking/contract tests. These
tests pin the supported public surface and behavior at the boundary:

- exported names and import paths;
- accepted input and output shapes;
- validation and error behavior;
- adapter/provider contracts;
- serialization or compatibility formats when exposed;
- Angular DI contracts for injectable public services and providers.

A deliberate breaking change must update the contract tests and document the
migration in the library's `docs/`. An accidental breaking change is a failed
change, even when unit coverage remains at 100%.

## Required library validation

Before completing a library change, run the applicable commands:

```text
nx test <library> --coverage
nx lint <library>
tsc --noEmit -p <library>/tsconfig.lib.json
prettier --check <library>
git diff --check
```

The final report must state the actual coverage result and identify any
intentionally excluded type-only or barrel files. No executable production
code may be excluded without an explicit documented reason.
