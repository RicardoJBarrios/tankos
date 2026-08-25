# Engineering contract

This is the compact workspace contract. Library-specific rules live in each
library's `docs/`; durable technical decisions live in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Boundaries

```text
UI -> Signal Store -> application -> ports <- adapters
```

- Domain code imports no Angular, Firebase, AngularFire, Zod or NgRx.
- External data is validated with Zod and mapped from DTOs to domain/view
  models at the boundary.
- Firebase, HTTP, browser APIs and Angular Material stay in adapters or UI.
- Libraries need a real owner, reuse case, protected boundary, isolated target
  or stable public contract; consume them through public APIs only.
- Use standalone Angular APIs, Signals, typed forms and `inject()` for new
  Angular code. Use `#private` for real private implementation state.
- One file has one primary responsibility; exported behavior has a focused
  contract test and public declarations have TSDoc.

## Tests and quality

- Vitest tests pure TypeScript; Spectator + Vitest tests Angular integration.
- Firebase adapters and Rules use the Emulator Suite; Playwright covers
  meaningful browser journeys only.
- Libraries target 100% V8 coverage for lines, statements, functions and
  branches, including public API/breaking contracts.
- Test every permitted input representation and relevant edge case at the
  parser/validator that owns the contract; keep facade tests focused.
- Run the affected Nx lint, test, build and formatting targets. Never use
  production Firebase for local development or CI.

## Runtime baseline

Node 24, pnpm 11, Nx 23, Angular 22, TypeScript 6, Vitest 4, Firebase JS SDK
12, NgRx Signals 22, Spectator 20 and Playwright. See `package.json` for exact
versions.

External tooling and SonarCloud are described in [`MCP.md`](MCP.md). They do
not belong in the application runtime.

## Safety

Do not commit secrets, bypass the architecture contract, add speculative
abstractions, or use destructive Git commands. Do not push from an agent.
