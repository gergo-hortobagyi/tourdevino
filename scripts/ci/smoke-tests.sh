#!/usr/bin/env bash
set -euo pipefail

API_BASE="${1:-http://localhost:40001/api}"
WEB_BASE="${2:-http://localhost:40000}"

echo "Smoke: health/live"
curl -fsS "${API_BASE}/health/live" >/dev/null

echo "Smoke: health/ready"
curl -fsS "${API_BASE}/health/ready" >/dev/null

echo "Smoke: tours"
curl -fsS "${API_BASE}/tours" >/dev/null

echo "Smoke: web"
curl -fsS "${WEB_BASE}" >/dev/null

echo "Smoke tests passed"
