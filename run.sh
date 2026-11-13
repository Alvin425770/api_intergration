#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$ROOT_DIR/server/.env" ]]; then
  printf 'Missing server/.env. Copy server/.env.example and configure real local values first.\n' >&2
  exit 1
fi

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  npm --prefix "$ROOT_DIR" ci
fi

if [[ ! -d "$ROOT_DIR/server/node_modules" ]]; then
  npm --prefix "$ROOT_DIR/server" ci
fi

node "$ROOT_DIR/server/index.js" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in {1..30}; do
  if curl -fs "http://localhost:5000/" >/dev/null; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    wait "$SERVER_PID"
    exit 1
  fi
  sleep 1
done

if ! curl -fs "http://localhost:5000/" >/dev/null; then
  printf 'API did not become healthy on http://localhost:5000.\n' >&2
  exit 1
fi

npm --prefix "$ROOT_DIR" run dev
