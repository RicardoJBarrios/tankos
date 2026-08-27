#!/usr/bin/env bash

set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$workspace_root"

bash "$workspace_root/tools/stop-dev.sh"

if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -x "/opt/homebrew/opt/openjdk@21/bin/java" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
  elif [[ -x "/opt/homebrew/opt/openjdk/bin/java" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk"
  fi
fi

if [[ ! -x "${JAVA_HOME:-}/bin/java" ]]; then
  echo "Java Runtime not found. Install or configure a supported JDK before running pnpm dev." >&2
  exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"

firebase_pid=""

cleanup() {
  exit_code=$?
  trap - EXIT INT TERM

  if [[ -n "$firebase_pid" ]] && kill -0 "$firebase_pid" 2>/dev/null; then
    kill -INT "$firebase_pid" 2>/dev/null || true
    wait "$firebase_pid" 2>/dev/null || true
  fi

  bash "$workspace_root/tools/stop-dev.sh"

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

./node_modules/.bin/firebase emulators:start --project demo-tankos --only auth,firestore &
firebase_pid=$!

emulators_ready=false
for _ in {1..60}; do
  if ! kill -0 "$firebase_pid" 2>/dev/null; then
    wait "$firebase_pid" || true
    echo "Firebase Emulator Suite stopped before becoming ready." >&2
    exit 1
  fi

  auth_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:9099/ || true)"
  firestore_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ || true)"
  if [[ "$auth_status" != "000" && "$firestore_status" != "000" ]]; then
    emulators_ready=true
    break
  fi

  sleep 1
done

if [[ "$emulators_ready" != true ]]; then
  echo "Firebase emulators did not become ready in time." >&2
  exit 1
fi

echo "Firebase Auth and Firestore emulators are ready."
node "$workspace_root/tools/seed-units.mjs"
pnpm nx serve tankos
