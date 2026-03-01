#!/usr/bin/env bash
set -euo pipefail

docker stop tourdevino-postgres >/dev/null 2>&1 || true
echo "postgres stopped"
