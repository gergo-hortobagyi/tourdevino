# Deploy and Local Runtime

## Local direct run (ports 40000-40100)

- Web: `pnpm --filter web dev` (port `40000`)
- API: `pnpm --filter api start:dev` (port `40001`)
- DB: `bash scripts/start-local-postgres.sh` (port `40002`)

## Local bootstrap

```bash
pnpm install
bash scripts/start-local-postgres.sh
pnpm prisma generate
pnpm prisma migrate deploy
pnpm --filter api prisma:seed
```

## Key environment values

```bash
CANCELLATION_WINDOW_HOURS=24
STRIPE_WEBHOOK_SECRET=test_stripe_webhook_secret
```

## Tests against real local services

```bash
pnpm lint
pnpm typecheck
pnpm test:integration
pnpm test:e2e
```

## KIND + Tilt

- `kind create cluster --name tourdevino --config infra/kind/kind-config.yaml`
- `tilt up`

Tilt resources:
- `postgres`, `api`, `web` Kubernetes workloads rendered from `infra/k8s/overlays/local`
- local hot reload is provided via Tilt `live_update` sync into running `api` and `web` pods

Port forwards:
- `40000 -> web:40000`
- `40001 -> api:40001`
- `40002 -> postgres:5432`
- Tilt UI: `http://localhost:10350`

## Rollout order

1. Apply secrets/config (`tourdevino-secrets`, `tourdevino-config`)
2. Apply DB (`postgres-statefulset`, `postgres-service`)
3. Run migration job (`prisma-migrate`) or init strategy before app rollouts
4. Deploy API (`api-deployment`, `api-service`)
5. Deploy Web (`web-deployment`, `web-service`, `ingress`)
4. Smoke checks:
   - `/api/health/live`
   - `/api/health/ready`
   - `/api/tours`
   - `/search` and `/tours/:id`
   - booking create/cancel and `/account/bookings`
   - review create and `/account/reviews`

## Kubernetes Layout

Base manifests: `infra/k8s/base`
- `configmap.yaml`
- `secret-template.yaml` (example only; do not commit real secrets)
- `postgres-statefulset.yaml`, `postgres-service.yaml`
- `migrate-job.yaml`
- `api-deployment.yaml`, `api-service.yaml`
- `web-deployment.yaml`, `web-service.yaml`
- `ingress.yaml`

Overlays:
- `infra/k8s/overlays/local`
- `infra/k8s/overlays/dev`
- `infra/k8s/overlays/staging`
- `infra/k8s/overlays/prod`

## Rollback

- Roll back app deployments with `kubectl rollout undo deployment/api` and `kubectl rollout undo deployment/web`.
- DB rollback policy remains forward-fix only; do not down-migrate production automatically.
- Re-run smoke checks after rollback.

Automation scripts:
- `scripts/ci/build-images.sh`
- `scripts/ci/k8s-rollout.sh`
- `scripts/ci/smoke-tests.sh`
- `scripts/ci/k8s-rollback.sh`

CI/CD workflow:
- `.github/workflows/release-readiness.yml`
  - verifies lint/typecheck/integration/e2e,
  - builds api/web images,
  - validates kustomize overlays render.

## Environment Matrix (minimum)

- Database: `DATABASE_URL`, `SHADOW_DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- API: `PORT`, `API_PREFIX`, `CORS_ORIGIN`, `REQUEST_BODY_LIMIT`, `CANCELLATION_WINDOW_HOURS`
- Web: `NUXT_PORT`, `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_APP_NAME`
- Payments: `STRIPE_WEBHOOK_SECRET`
