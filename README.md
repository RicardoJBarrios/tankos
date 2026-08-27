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

The emulator integration is development-only. The production Angular build
replaces the local Firebase composition with `firebase.production.ts`, which
does not import or connect to any emulator. Its Firebase Web SDK configuration
is public project metadata kept in `firebase.production.config.ts`; private
service-account credentials must never be added to the frontend.

### Local emulator accounts

These accounts are only for the local Firebase Auth emulator:

| Role   | Email                    | Password             |
| ------ | ------------------------ | -------------------- |
| Keeper | `developer@tankos.local` | `tankos-local-dev`   |
| Admin  | `admin@tankos.local`     | `tankos-local-admin` |

The local auth adapter assigns the matching Firebase role claim before the app
accesses Firestore. Never use these credentials in a real Firebase project or
in production.

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
