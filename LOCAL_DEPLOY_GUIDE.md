# Local Deploy Guide (KIND + Tilt)

This guide explains how to run Tour de Vino locally with Kubernetes (KIND) and Tilt, using the reserved port range `40000-40100`.

## Quick Start (single line)

From repo root:

```bash
pnpm local:k8s:up
```

This command installs dependencies, ensures `.env.test` exists, creates/uses the `tourdevino` KIND cluster, and starts `tilt up`.

## 1) Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (or Docker Engine)
- kubectl
- kind
- tilt

Verify tools:

```bash
node -v
pnpm -v
docker -v
kubectl version --client
kind version
tilt version
```

## 2) Install dependencies

From repo root:

```bash
pnpm install
```

## 3) Configure environment

Create `.env.test` (or update existing) with local values in the allowed range:

```bash
NUXT_PORT=40000
NUXT_PUBLIC_API_BASE_URL=http://localhost:40001/api

PORT=40001
API_PREFIX=api
CORS_ORIGIN=http://localhost:40000
REQUEST_BODY_LIMIT=1mb
CANCELLATION_WINDOW_HOURS=24

DATABASE_URL=postgresql://postgres:postgres@localhost:40002/tourdevino?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:40002/tourdevino_shadow?schema=public

JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

STRIPE_WEBHOOK_SECRET=dev_stripe_webhook_secret
```

## 4) Create KIND cluster

```bash
kind create cluster --name tourdevino --config infra/kind/kind-config.yaml
kubectl cluster-info --context kind-tourdevino
```

If the cluster already exists:

```bash
kubectl config use-context kind-tourdevino
```

## 5) Start Tilt

From repo root:

```bash
tilt up
```

Tilt UI:

- `http://localhost:10350`

Expected local resources:

- `postgres` (K8s resource)
- `api` (K8s resource)
- `web` (K8s resource)

Hot reload behavior:

- Local and remote both run API/Web as Kubernetes workloads.
- In local mode, Tilt `live_update` syncs changed files into running pods for fast reload.
- There are no separate host-side `api-dev` / `web-dev` processes.

## 6) Port mapping

- Web: `http://localhost:40000`
- API: `http://localhost:40001/api`
- PostgreSQL: `localhost:40002`
- Tilt UI: `http://localhost:10350`

## 7) First-run database setup

If needed, run manually from repo root:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
pnpm --filter api prisma:seed
```

## 8) Smoke checks

After Tilt is healthy, verify:

```bash
curl -s http://localhost:40001/api/health/live
curl -s http://localhost:40001/api/health/ready
curl -s http://localhost:40001/api/tours
```

Then open in browser:

- `http://localhost:40000/search`
- `http://localhost:40000/map`
- `http://localhost:40000/login`

## 9) Run local quality gates

From repo root:

```bash
pnpm lint
pnpm typecheck
pnpm test:integration
pnpm test:e2e
```

## 10) Stop and clean up

Stop Tilt:

```bash
tilt down
```

Delete cluster (optional):

```bash
kind delete cluster --name tourdevino
```

## Troubleshooting

- Ports busy: make sure nothing else is using `40000`, `40001`, `40002`.
- DB connection issues: confirm `postgres` is healthy in Tilt and `DATABASE_URL` points to `localhost:40002`.
- API/web not reloading: restart the `api` or `web` resource in Tilt.
- Migration errors: rerun `pnpm prisma generate` then `pnpm prisma migrate deploy`.
- Cluster context mismatch: use `kubectl config current-context` and switch to `kind-tourdevino`.
