#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="tourdevino"
CLUSTER_CONTEXT="kind-${CLUSTER_NAME}"
ENV_FILE="${ROOT_DIR}/.env.test"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command not found: $1" >&2
    exit 1
  fi
}

for cmd in docker pnpm kind kubectl tilt; do
  require_cmd "$cmd"
done

cd "${ROOT_DIR}"

if [ ! -f "${ENV_FILE}" ]; then
  if [ -f "${ROOT_DIR}/.env.example" ]; then
    cp "${ROOT_DIR}/.env.example" "${ENV_FILE}"
    echo "created .env.test from .env.example"
  else
    echo "error: .env.test is missing and .env.example was not found" >&2
    exit 1
  fi
fi

bash scripts/sync-k8s-env.sh

if ! grep -q '^PORT=40001$' "${ENV_FILE}" || ! grep -q '^NUXT_PORT=40000$' "${ENV_FILE}" || ! grep -q '^POSTGRES_PORT=40002$' "${ENV_FILE}"; then
  echo "warning: .env.test does not match expected local ports (web 40000, api 40001, db 40002)" >&2
fi

echo "installing dependencies..."
pnpm install

if ! kind get clusters | grep -qx "${CLUSTER_NAME}"; then
  echo "creating kind cluster ${CLUSTER_NAME}..."
  kind create cluster --name "${CLUSTER_NAME}" --config infra/kind/kind-config.yaml
else
  echo "kind cluster ${CLUSTER_NAME} already exists"
fi

kubectl config use-context "${CLUSTER_CONTEXT}" >/dev/null
kubectl cluster-info --context "${CLUSTER_CONTEXT}" >/dev/null

echo "starting tilt..."
echo "Tilt UI: http://localhost:10350"
exec tilt up
