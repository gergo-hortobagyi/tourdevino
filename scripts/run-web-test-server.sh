#!/usr/bin/env bash
set -euo pipefail

set -a
source ./.env.test
set +a

pnpm --filter web dev
