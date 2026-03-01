#!/usr/bin/env bash
set -euo pipefail

pnpm prisma migrate deploy
pnpm --filter api prisma:seed
