#!/usr/bin/env bash
set -euo pipefail

set -a
source ./.env.test
set +a

bash ./scripts/start-local-postgres.sh
pnpm prisma generate
pnpm prisma migrate deploy
pnpm --filter api prisma:seed

pnpm --filter api start:dev
