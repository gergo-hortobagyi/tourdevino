#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-tourdevino}"

kubectl rollout undo deployment/api -n "${NAMESPACE}"
kubectl rollout undo deployment/web -n "${NAMESPACE}"

kubectl rollout status deployment/api -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/web -n "${NAMESPACE}" --timeout=180s

echo "Rollback complete. Database rollback is forward-fix only."
