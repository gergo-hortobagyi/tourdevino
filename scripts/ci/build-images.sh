#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-$(git rev-parse --short HEAD 2>/dev/null || echo dev)}"
API_IMAGE="tourdevino/api:${TAG}"
WEB_IMAGE="tourdevino/web:${TAG}"

echo "Building ${API_IMAGE}"
docker build -f apps/api/Dockerfile -t "${API_IMAGE}" .

echo "Building ${WEB_IMAGE}"
docker build -f apps/web/Dockerfile -t "${WEB_IMAGE}" .

echo "Built images: ${API_IMAGE}, ${WEB_IMAGE}"
