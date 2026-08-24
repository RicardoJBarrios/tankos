# TankOS

Angular web application managed with Nx.

## Development

Install dependencies and start the application:

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Angular development server together with the Firebase
Auth and Firestore emulators. The application is available at
`http://localhost:4200`.

The development environment requires a supported Java runtime for the
Firebase emulators. Press `Ctrl+C` to stop the application and emulators.

## Useful commands

```bash
pnpm nx build tankos
pnpm nx test tankos
pnpm nx lint tankos
pnpm nx graph

# Quality checks
pnpm quality:affected
pnpm quality:knip
pnpm quality:semgrep
pnpm quality:audit
```

Vitest library targets enforce 100% V8 coverage and write test results under
`reports/test` plus coverage artifacts under `coverage`. The complete quality
tooling is documented in [`tools/quality/README.md`](tools/quality/README.md).

Application source code lives under `apps/tankos`.

Project guidance starts at [`.codex/AGENT.md`](.codex/AGENT.md).
