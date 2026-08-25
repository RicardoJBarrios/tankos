#!/usr/bin/env bash

set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$workspace_root"

if [[ ! -f .env ]]; then
  echo 'Missing .env with SONARQUBE_TOKEN and SONARQUBE_ORG.' >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

: "${SONARQUBE_TOKEN:?SONARQUBE_TOKEN is required in .env}"
: "${SONARQUBE_ORG:?SONARQUBE_ORG is required in .env}"

export SONAR_TOKEN="$SONARQUBE_TOKEN"
export SONAR_HOST_URL="https://sonarcloud.io"
export NX_DAEMON=false

declare -a sonar_scm_options=()
if ! git diff --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  # Dirty worktrees can make the containerized blame phase block on macOS
  # file timestamp translation. The source analysis remains complete; SCM
  # metadata is restored automatically once the worktree is clean.
  sonar_scm_options+=('-Dsonar.scm.disabled=true')
fi

pnpm exec nx run-many -t lint test build --parallel=3 --skipNxCache

sonar_lcov_dir="$(mktemp -d "$workspace_root/.sonar-lcov.XXXXXX")"
cleanup() {
  rm -rf "$sonar_lcov_dir"
}
trap cleanup EXIT

declare -a rewritten_lcov_reports=()
while IFS= read -r report; do
  project_root="${report#coverage/}"
  project_root="${project_root%/lcov.info}"
  rewritten_report="$sonar_lcov_dir/report-${#rewritten_lcov_reports[@]}.lcov"

  awk -v prefix="$project_root" '
    /^SF:/ {
      source_file = substr($0, 4)
      if (source_file !~ /^\// && source_file !~ /^(apps|libs)\//) {
        source_file = prefix "/" source_file
      }
      print "SF:" source_file
      next
    }
    { print }
  ' "$report" > "$rewritten_report"

  container_report="/usr/src/${rewritten_report#"$workspace_root"/}"
  rewritten_lcov_reports+=("$container_report")
done < <(find coverage \
  -mindepth 3 -maxdepth 3 \
  -type f -name lcov.info \
  -print 2>/dev/null | sort)

if [[ "${#rewritten_lcov_reports[@]}" -eq 0 ]]; then
  echo 'No LCOV reports were generated.' >&2
  exit 1
fi

lcov_reports="$(IFS=,; printf '%s' "${rewritten_lcov_reports[*]}")"

docker run --rm \
  --mount "type=bind,src=$workspace_root,dst=/usr/src" \
  --mount 'type=volume,src=tankos-sonar-scanner-cache,dst=/opt/sonar-scanner/.sonar/cache' \
  --workdir /usr/src \
  --env SONAR_HOST_URL \
  --env SONAR_TOKEN \
  sonarsource/sonar-scanner-cli:latest \
  "-Dsonar.organization=$SONARQUBE_ORG" \
  "${sonar_scm_options[@]}" \
  "-Dsonar.javascript.lcov.reportPaths=$lcov_reports"
