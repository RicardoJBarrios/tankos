# Tool integrations

Use the smallest tool that answers the question; tooling does not authorize
destructive changes, secret access, pushes or production mutations.

- **Nx:** projects, targets, generators, dependency graph and boundaries.
- **CodeGraph:** local imports, callers, callees and structural impact after
  exact search shows that relationships matter.
- **Firebase:** current Auth, Firestore, Rules, Emulator Suite and Hosting
  guidance; local emulator execution remains the validation authority.
- **GitHub:** repository, issues, pull requests and external delivery state.
- **SonarCloud:** external quality analysis and quality gate. It is not a
  runtime dependency or domain authority. Run `pnpm quality:sonar` or
  `pnpm quality:all`; credentials come only from the ignored root `.env` as
  `SONARQUBE_TOKEN` and `SONARQUBE_ORG`. The SonarQube MCP server is registered
  in `.codex/config.toml` and runs through the official Docker image without
  persisting credentials in the repository.

The SonarCloud runner analyzes the active TankOS working tree but publishes to
the configured main branch `master`, because branch analysis is not enabled for
the current plan. It includes Nx lint/test/build output and Vitest LCOV reports
and excludes `legacy/`.

For local quality, use `tools/quality/README.md` and the `quality:*` scripts in
`package.json`. When an integration is unavailable, fall back to local docs,
`rg`, Git and focused workspace commands.
