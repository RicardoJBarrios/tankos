# Workspace quality checks

The workspace keeps quality responsibilities separate:

- Nx, ESLint, Sheriff and SonarJS enforce code quality and project boundaries.
- Vitest enforces the library coverage contract and writes machine-readable
  test and coverage reports.
- Knip detects unused files and dependencies. It currently reports without
  failing the command while the pre-existing workspace baseline is cleaned;
  no findings are suppressed as resolved.
- Semgrep checks high-confidence security and architecture patterns defined in
  [`/semgrep.yml`](../../semgrep.yml).
- Gitleaks checks repository history and working-tree content for secrets.
- `pnpm audit --prod` checks production dependency advisories.

SonarQube Cloud is intentionally not part of this local quality toolchain yet.

## Commands

```bash
python3 -m venv .quality-venv
.quality-venv/bin/python -m pip install --requirement tools/quality/semgrep-requirements.txt
pnpm quality:knip
pnpm quality:semgrep
pnpm quality:audit
```

Semgrep is a Python CLI and is intentionally not added as an npm dependency.
Use the pinned version in `semgrep-requirements.txt` for local and CI runs.
