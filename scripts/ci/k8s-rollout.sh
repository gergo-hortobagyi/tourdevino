#!/usr/bin/env bash
set -euo pipefail

OVERLAY="${1:-infra/k8s/overlays/local}"
NAMESPACE="${2:-tourdevino}"

echo "Applying namespace/config/secrets for ${OVERLAY}"
kubectl apply -k "${OVERLAY}"

echo "Running migration job"
kubectl delete job prisma-migrate -n "${NAMESPACE}" --ignore-not-found=true
kubectl apply -f infra/k8s/base/migrate-job.yaml
kubectl wait --for=condition=complete --timeout=180s job/prisma-migrate -n "${NAMESPACE}"

echo "Waiting for deployments"
kubectl rollout status deployment/api -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/web -n "${NAMESPACE}" --timeout=180s

echo "Rollout complete"
