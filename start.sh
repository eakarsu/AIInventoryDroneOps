#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-4061}"
FRONTEND_PORT="${FRONTEND_PORT:-4060}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://127.0.0.1:$FRONTEND_PORT,http://localhost:$FRONTEND_PORT}"
REACT_APP_API_BASE="${REACT_APP_API_BASE:-http://127.0.0.1:$BACKEND_PORT/api}"
export BACKEND_PORT FRONTEND_PORT ALLOWED_ORIGINS REACT_APP_API_BASE

if [[ ! -d "$PROJECT_DIR/backend/node_modules" || ! -d "$PROJECT_DIR/frontend/node_modules" ]]; then
  echo "Dependencies are absent. Run ./scripts/bootstrap.sh explicitly." >&2
  exit 1
fi
if [[ -z "${DATABASE_URL:-}" && ( -z "${DB_HOST:-}" || -z "${DB_NAME:-}" || -z "${DB_USER:-}" || -z "${DB_PASSWORD:-}" ) ]]; then
  echo "Set DATABASE_URL or all DB_HOST/DB_NAME/DB_USER/DB_PASSWORD values." >&2
  exit 1
fi
JWT_SECRET_VALUE="${JWT_SECRET:-}"
if [[ "${#JWT_SECRET_VALUE}" -lt 32 ]]; then
  echo "JWT_SECRET must contain at least 32 characters." >&2
  exit 1
fi
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already occupied; no process was terminated." >&2
    exit 1
  fi
done

(cd "$PROJECT_DIR/backend" && npm start) &
backend_pid=$!
(cd "$PROJECT_DIR/frontend" && BROWSER=none PORT="$FRONTEND_PORT" npm start) &
frontend_pid=$!

cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$backend_pid"
