#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
npm --prefix "$PROJECT_DIR/backend" ci
npm --prefix "$PROJECT_DIR/frontend" ci
echo "Dependencies installed from lockfiles. No schema or seed data was changed."
