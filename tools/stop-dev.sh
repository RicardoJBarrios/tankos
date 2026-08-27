#!/usr/bin/env bash

set -euo pipefail

readonly DEV_PORTS=(4000 4200 4400 4500 8080 9099 9150)

for port in "${DEV_PORTS[@]}"; do
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    kill -INT "$pid" 2>/dev/null || true
  done < <(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
done

for _ in {1..20}; do
  remaining=false
  for port in "${DEV_PORTS[@]}"; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      remaining=true
      break
    fi
  done
  [[ "$remaining" == false ]] && exit 0
  sleep 0.1
done

for port in "${DEV_PORTS[@]}"; do
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    kill -TERM "$pid" 2>/dev/null || true
  done < <(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
done

for port in "${DEV_PORTS[@]}"; do
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    kill -KILL "$pid" 2>/dev/null || true
  done < <(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
done

for _ in {1..20}; do
  remaining=false
  for port in "${DEV_PORTS[@]}"; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      remaining=true
      break
    fi
  done
  [[ "$remaining" == false ]] && exit 0
  sleep 0.1
done

exit 1
