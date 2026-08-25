# Workspace quality checks

The workspace keeps quality responsibilities separate:

- Nx, ESLint, ESLint Boundaries and SonarJS enforce code quality and project
  boundaries.
- Vitest enforces the library coverage contract and writes machine-readable
  test and coverage reports.
- Knip detects unused files and dependencies. It currently reports without
  failing the command while the pre-existing workspace baseline is cleaned;
  no findings are suppressed as resolved.
- Semgrep checks high-confidence security and architecture patterns defined in
  [`/semgrep.yml`](../../semgrep.yml).
- Gitleaks checks repository history and working-tree content for secrets.
- `pnpm audit --prod` checks production dependency advisories.

SonarQube Cloud receives the complete TankOS local analysis, including
TypeScript/Angular analysis and Vitest LCOV coverage.

## Commands

```bash
python3 -m venv .quality-venv
.quality-venv/bin/python -m pip install --requirement tools/quality/semgrep-requirements.txt
pnpm quality:knip
pnpm quality:semgrep
pnpm quality:gitleaks
pnpm quality:audit
pnpm quality:sonar
pnpm quality:local
pnpm quality:all
```

`quality:local` is the strict local gate: formatting, Nx lint/test/build,
unused-code analysis, Semgrep, secret scanning and production dependency audit
must all pass. `quality:all` adds the SonarCloud analysis and waits for the
server quality gate. There is no non-zero-exit override for any of these
checks.

`quality:sonar` loads `SONARQUBE_TOKEN` and `SONARQUBE_ORG` from the ignored
root `.env`, runs lint, tests with coverage and production builds for the active
TankOS projects, then launches the official SonarScanner CLI Docker image.
It prefixes each report's `src/...` paths with its Nx project directory before
uploading so same-named files from different libraries do not collide.
The runner always publishes to the SonarCloud main branch, `master`, regardless
of the local Git branch. This is intentional because the current SonarCloud
organization plan does not provide branch analysis. The organization is
supplied by `SONARQUBE_ORG` from `.env`, so local configuration and the
checked-in project definition cannot diverge.
The active SonarCloud project contains only the browser application and its
publishable libraries.

Semgrep is a Python CLI and is intentionally not added as an npm dependency.
Use the pinned version in `semgrep-requirements.txt` for local and CI runs.
