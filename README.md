# Veril

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
pnpm nx build veril
pnpm nx test veril
pnpm nx lint veril
pnpm nx graph
```

Application source code lives under `apps/veril`.

Project guidance starts at [`.codex/AGENT.md`](.codex/AGENT.md).
