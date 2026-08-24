#!/usr/bin/env bash

set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
semgrep_bin="${SEMGREP_BIN:-$workspace_root/.quality-venv/bin/semgrep}"

if [[ ! -x "$semgrep_bin" ]]; then
  echo "Semgrep is not installed at $semgrep_bin. Run:" >&2
  echo "  python3 -m venv .quality-venv" >&2
  echo "  .quality-venv/bin/python -m pip install --requirement tools/quality/semgrep-requirements.txt" >&2
  exit 1
fi

cd "$workspace_root"
exec "$semgrep_bin" scan --config semgrep.yml --error --no-git-ignore \
  --exclude node_modules --exclude dist --exclude coverage --exclude reports \
  apps/tankos libs tools semgrep.yml
