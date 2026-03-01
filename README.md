# Tour de Vino

Tour de Vino is a full-stack TypeScript monorepo for wine-tour discovery and booking.

## Current Implementation Status

- Phase 0 complete: monorepo scaffold, Nuxt SSR + Tailwind baseline, NestJS bootstrap, Prisma baseline migration, Playwright configs, CI skeleton.
- Phase 1 complete: auth lifecycle endpoints, JWT + refresh rotation, role/ownership guards, throttling, validation, normalized error envelope, audit logging, integration + E2E coverage.
- Phase 2 complete: core Prisma domain model, constraints/indexes, and deterministic seed data.
- Phase 3 complete: public catalog API + UI (`/search`, `/map`, `/tours/:id`, `/about`, `/faq`, `/terms`, `/contact`) with SSR-safe data fetching and catalog E2E coverage.
- Phase 4 complete: booking lifecycle with idempotency, payment intents/status/webhook reconciliation with signature verification, payment fail/retry flow, cancellation policy handling, integration + E2E coverage.
- Phase 5 complete: client profile/bookings/reviews flows with completed-booking eligibility and Playwright integration + E2E coverage.
- Phase 6 complete: vendor portal backend + frontend (`/vendor/*`) with ownership checks, approval policy, audit logging, and Playwright integration/E2E coverage.
- Phase 7 complete: admin portal backend + frontend (`/admin/*`) including vendors/users/tours/bookings/content/reports with privileged audit logging and role enforcement.
- Phase 8 complete baseline: request IDs + structured logs, health/readiness probes, high-read endpoint caching, pagination guardrails, and accessibility-oriented UX states in role portals.
- Phase 9 complete baseline: expanded KIND/Tilt/K8s manifests (base + local/dev/staging/prod overlays), migration job strategy, rollout/rollback and env matrix docs.
- Gap closure update: vendor onboarding endpoint (`POST /api/vendor/applications`) and persisted admin settings (`/api/admin/settings`) are now implemented with tests.

## Stack (Authoritative)

- Frontend: Nuxt 3 SSR + Tailwind CSS
- Backend: NestJS 11 + TypeScript
- Database: PostgreSQL + Prisma ORM
- Tests: Playwright integration + Playwright E2E
- Infrastructure: Kubernetes (KIND + Tilt)

## Monorepo Layout

```text
.
|- apps/
|  |- web/            # Nuxt SSR frontend
|  `- api/            # NestJS API
|- prisma/            # schema + migrations + seed
|- infra/             # kind + tilt + k8s manifests
|- docs/              # api/data/deploy docs
|- tests/             # playwright integration/e2e
`- scripts/           # local db + test server scripts
```

## Ports (Reserved 40000-40100)

- Web: `40000`
- API: `40001`
- PostgreSQL: `40002`
- KIND ingress host ports: `40010`, `40011`

## Environment

Copy from `.env.example` and adjust as needed.

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

STRIPE_WEBHOOK_SECRET=dev_stripe_webhook_secret
```

## Local Development

```bash
pnpm install
bash scripts/start-local-postgres.sh
pnpm prisma generate
pnpm prisma migrate deploy
pnpm --filter api prisma:seed
pnpm --filter api start:dev
pnpm --filter web dev
```

## Core Commands

```bash
pnpm lint
pnpm typecheck
pnpm test:integration
pnpm test:e2e
```

## CI/CD Readiness Scripts

```bash
bash scripts/ci/build-images.sh
bash scripts/ci/k8s-rollout.sh infra/k8s/overlays/local
bash scripts/ci/smoke-tests.sh
bash scripts/ci/k8s-rollback.sh
```

Release readiness workflow: `.github/workflows/release-readiness.yml`

## Testing Strategy

- Integration tests: Playwright request-context API tests (`playwright.integration.config.ts`)
- E2E tests: Playwright browser journeys (`playwright.e2e.config.ts`)
- Unit tests are intentionally out of scope in this implementation program.

## Infra Loop

```bash
kind create cluster --name tourdevino --config infra/kind/kind-config.yaml
tilt up
```

Tilt UI: `http://localhost:10350`

## Handoff Docs

- `IMPLEMENTATION_HANDOFF_PLAN.md`
- `DEV_GUIDE_AGENT.md`
- `FEATURE_INVENTORY.md`
- `docs/api/auth.md`
- `docs/api/public-catalog.md`
- `docs/api/bookings-payments.md`
- `docs/api/users-reviews.md`
- `docs/api/vendor-admin.md`
- `docs/api/error-codes.md`
- `docs/data-model.md`
- `docs/deploy.md`
