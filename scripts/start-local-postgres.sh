#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="tourdevino-postgres"
PORT="${POSTGRES_PORT:-40002}"
USER_NAME="${POSTGRES_USER:-postgres}"
PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_NAME="${POSTGRES_DB:-tourdevino}"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "postgres container already running"
else
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker start "${CONTAINER_NAME}" >/dev/null
  else
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -e POSTGRES_USER="${USER_NAME}" \
      -e POSTGRES_PASSWORD="${PASSWORD}" \
      -e POSTGRES_DB="${DB_NAME}" \
      -p "${PORT}:5432" \
      postgres:16-alpine >/dev/null
  fi
fi

echo "waiting for postgres on port ${PORT}..."
for _ in $(seq 1 40); do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${USER_NAME}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "${CONTAINER_NAME}" psql -U "${USER_NAME}" -tc "SELECT 1 FROM pg_database WHERE datname='tourdevino_shadow'" | grep -q 1 || docker exec "${CONTAINER_NAME}" psql -U "${USER_NAME}" -c 'CREATE DATABASE tourdevino_shadow;' >/dev/null

echo "postgres ready"
