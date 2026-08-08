# Permanent Decisions

These decisions are accepted and should not be reopened without a documented ADR.

## Direction and implementation timing

An accepted direction is not automatically work for the current slice. The
accepted specification and the timing table in `architecture/target-architecture.md`
decide what is required now. The first slice requires private authenticated
persistence; public presentation, domain offline capability, App Check and E2E
remain deferred.

## Architecture

- Use Screaming Hexagonal Architecture with domain-first boundaries.
- Use standalone Angular APIs, lazy loading and explicit composition roots.
- Keep applications and libraries small; extract only for real ownership or reuse.
- Use Nx tags and ESLint boundaries to enforce project ownership.

## Coding

- Use pnpm, Nx, Angular, Angular Material and Angular CDK.
- Use Angular standalone APIs, Signals, lazy loading and typed forms.
- Use Firebase for Authentication, Firestore and Hosting.
- Use GitHub Actions for CI and GitHub Issues, Projects and Releases for project
  coordination and delivery.

## Code and data

- Use NgRx Signals for shared or complex feature state; keep local state local.
- Use Zod at external boundaries and derive DTO types with `z.infer`.
- Keep transport DTOs, domain models and view models separate.
- Use Angular Material before creating custom UI primitives.

## Testing

- Use Vitest for pure TypeScript tests.
- Use Spectator with Vitest for Angular tests.
- Use Firebase Emulator Suite for Firebase adapters and Security Rules.
- Use Playwright for E2E tests against isolated environments.

## Firebase and offline

- Use Firebase Authentication, Firestore, Hosting and App Check behind adapters.
- Use Emulator Suite for local development, Rules and integration tests.
- Never use production Firebase for local development or CI.
- Require explicit trusted-device consent for persistent private offline data.

### Local development entry point

- Use Firebase CLI directly for local emulators.
- `pnpm dev` is the canonical local-development entry point.
- `tools/dev.sh` coordinates Angular, Auth Emulator and Firestore Emulator.
- Do not add a Firebase/Nx plugin unless a concrete need emerges, such as
  Firebase Functions, multiple Firebase applications or substantially more
  complex Nx-native deployment orchestration.
- Re-evaluate plugin compatibility and fit when such a need appears; this is
  not a permanent prohibition on future plugins.

## UI and accessibility

- Use Angular Material/CDK before custom primitives.
- Preserve keyboard access, visible focus, labels, semantic structure and usable
  contrast.
- Do not add a separate design system until Material fails a concrete requirement.

## Performance

- Bound Firestore queries and paginate with cursors.
- Prefer lazy feature loading and a small PWA asset cache.
- Establish budgets from measured user journeys before optimizing broadly.

## Security

- Keep Security Rules deny-by-default and test them in emulators.
- Keep administrative credentials and deployment secrets outside frontend code.
- Treat guards as UX, never as authorization.

## GitHub and delivery

- Use GitHub Actions for reproducible checks.
- Use Issues, Projects and Releases for traceable work and delivery.
- Keep production deployment protected by environments and review checks.

## Never

- Never expose Firestore DTOs directly to domain or UI code.
- Never bypass Zod at an external data boundary.
- Never duplicate runtime models when a schema can be canonical.
- Never bypass Nx for workspace tasks or generators.
- Never bypass an applicable ADR without documenting the exception.
- Never introduce a predicted library or abstraction without a real boundary.
- Never use production Firebase for local development or CI.
- Never commit secrets, push from an agent or use `git reset --hard`.
