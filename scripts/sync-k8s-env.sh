#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ENV="${ROOT_DIR}/.env.test"
TARGET_ENV="${ROOT_DIR}/infra/k8s/overlays/local/.env.k8s"

read_env() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "${SOURCE_ENV}" | tail -n1 | cut -d'=' -f2- || true)"
  printf '%s' "$value"
}

if [ ! -f "${SOURCE_ENV}" ]; then
  echo "error: ${SOURCE_ENV} not found" >&2
  exit 1
fi

grep -E '^[A-Za-z_][A-Za-z0-9_]*=.*$' "${SOURCE_ENV}" > "${TARGET_ENV}"

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_PASSWORD="$(read_env POSTGRES_PASSWORD)"
POSTGRES_DB="$(read_env POSTGRES_DB)"

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-tourdevino}"

DB_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
SHADOW_DB_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}_shadow?schema=public"

sed -i.bak '/^DATABASE_URL=/d;/^SHADOW_DATABASE_URL=/d' "${TARGET_ENV}"
rm -f "${TARGET_ENV}.bak"
{
  echo "DATABASE_URL=${DB_URL}"
  echo "SHADOW_DATABASE_URL=${SHADOW_DB_URL}"
} >> "${TARGET_ENV}"

echo "synced ${TARGET_ENV} from .env.test"
