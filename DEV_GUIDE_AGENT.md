# DEV_GUIDE_AGENT

## Purpose
This guide is the default implementation contract for coding agents in this repo.
Use it to make consistent decisions, avoid architecture drift, and ship changes that are review-ready.

## Agent Operating Principles
- Use subagents liberally to keep context focused and parallelize research/analysis.
- Offload exploration and investigation tasks before implementing.
- Work autonomously: make reasonable decisions without blocking on avoidable questions.
- Keep documentation up to date in the same change as code updates.

## Decision Baseline (Use This Order)
1. Existing code patterns in this repo (when present).
2. Stack constraints from `README.md` (Nuxt SSR + Tailwind, NestJS domain modules, Prisma + PostgreSQL, KIND + Tilt).
3. Execution order and interface backlog from `IMPLEMENTATION_HANDOFF_PLAN.md`.
4. Feature boundaries from `FEATURE_INVENTORY.md`.
5. This guide.

If two options are both valid, choose the simpler one with lower maintenance cost.

---

## Architecture Guardrails

### System Boundaries
- `apps/web` (Nuxt SSR): UI rendering, route handling, UX state, API consumption.
- `apps/api` (NestJS): domain logic, validation, authorization, persistence orchestration.
- `prisma/`: schema and migrations only; no business logic.
- `infra/`: local/dev/prod runtime configs (KIND/Tilt/K8s).

### Non-Negotiables
- Keep business logic in backend services, not Nuxt pages/components.
- Organize backend by business domain (feature modules), not technical layers.
- Enforce DTO validation at API boundaries.
- Keep cross-domain coupling explicit; prefer events/use-case services over deep imports.
- Avoid circular dependencies between Nest modules.
- SSR-safe frontend code (guard browser-only APIs).

### Simplicity Rules
- Start monolith-first inside Nest modules; no microservices unless required.
- Prefer one clear implementation path over abstraction-heavy designs.
- Add new package/module only when reuse is proven across at least 2 domains.

---

## Coding Standards

### TypeScript
- Strict typing; avoid `any` unless unavoidable and documented.
- Small, focused functions; single responsibility per service/use-case.
- Name by domain intent (`createBooking`, `approveVendor`) over technical wording.
- Use explicit return types on exported functions/methods.

### Nuxt (Frontend)
- Route-driven organization under `pages/`; reusable UI under `components/`; shared logic in `composables/`.
- Use SSR-aware fetching (`useFetch`, `useAsyncData`).
- Keep page components thin; move transformation logic to composables/helpers.
- Tailwind utility-first styling; avoid large repeated class blocks.
- Handle loading, error, and empty states on all data-backed pages.

### NestJS (Backend)
- Per domain module: `controller` (transport), `service` (use case), `repository` (Prisma access).
- Controllers must not contain business logic.
- Validate input with DTOs and validation pipes.
- Use guards for auth/authz; never trust role flags from client payloads.
- Centralize exception mapping and return stable error shapes.

---

## Module Boundaries (Backend)

Domain modules:
- `auth`: signup/login/reset/session/token lifecycle.
- `users`: profiles, account data, role assignment hooks.
- `tours`: catalog, detail, media metadata, availability views.
- `bookings`: booking lifecycle, cancellation, booking history.
- `payments`: payment intents, webhooks, refunds orchestration.
- `reviews`: ratings/reviews CRUD and moderation hooks.
- `vendors`: vendor profile, approval status, vendor-owned resource checks.
- `admin`: admin-only operations across domains.
- `content`: static pages/FAQ/contact content management.
- `analytics`: reporting and aggregations.

Boundary rules:
- Consume another module only through exported interfaces.
- No direct Prisma access across module internals.
- Shared utilities go in `common/` only if truly cross-domain.

---

## API Design Rules

### Endpoint Conventions
- Prefix routes with configured `API_PREFIX` (default `api`).
- Resource-oriented routes:
  - `GET /tours`, `GET /tours/:id`
  - `POST /bookings`, `PATCH /bookings/:id/cancel`
- Role-scoped areas:
  - `/admin/...` for admin functions
  - `/vendor/...` for vendor-owned operations

### Request/Response Contract
- DTOs for all inputs and outputs.
- Server-generated IDs/timestamps only.
- Support pagination/filtering/sorting on list endpoints.
- Keep response shape stable; add fields backward-compatibly.
- Standard error payload (`code`, `message`, `details` when relevant).
- Include `requestId` in error payloads when available for correlation.

### Operational Endpoints
- Keep `/health/live` and `/health/ready` available for orchestration checks.
- Readiness must validate critical dependencies (at minimum database connectivity).

### Security/Authorization
- JWT auth for protected endpoints.
- Role and ownership checks in guards/policies.
- Rate-limit auth-sensitive endpoints.
- Never expose internal stack traces to clients.

---

## Database + Prisma Workflow

### Schema Change Checklist
- [ ] Update `prisma/schema.prisma`.
- [ ] Run migration locally:
  ```bash
  pnpm prisma migrate dev --name <descriptive_name>
  ```
- [ ] Regenerate client:
  ```bash
  pnpm prisma generate
  ```
- [ ] Validate migration state:
  ```bash
  pnpm prisma migrate status
  ```
- [ ] Update affected services/DTOs/tests.
- [ ] Commit schema and migration files.

### Rules
- Do not edit previously applied migration files.
- Use `migrate dev` locally only.
- Use `migrate deploy` in CI/CD/prod.
- Prefer explicit relations, indexes, and constraints.
- Use transactions for multi-step state changes (booking + payment updates).

---

## Testing Baseline

### Minimum Required per Change
- Playwright integration coverage for changed endpoint flows (auth, booking, payment, role access).
- Playwright E2E coverage for affected role journeys and critical UI paths.
- Regression test for every bug fix, implemented in Playwright.
- Unit testing is not required in the current implementation program.

### Quality Gates
- [ ] Changed paths covered by tests.
- [ ] Existing tests still pass.
- [ ] Role/permission checks tested (happy + forbidden paths).
- [ ] Validation and error cases tested.

### Useful Commands
```bash
pnpm playwright test -c playwright.integration.config.ts
pnpm playwright test -c playwright.e2e.config.ts
pnpm lint
pnpm typecheck
```

---

## Infra + Dev Workflow (KIND + Tilt)

### Standard Local Loop
1. Create cluster:
   ```bash
   kind create cluster --name tourdevino --config infra/kind/kind-config.yaml
   ```
2. Verify context:
   ```bash
   kubectl cluster-info --context kind-tourdevino
   ```
3. Start orchestration:
   ```bash
   tilt up
   ```
4. Tilt UI: `http://localhost:10350`
5. Tear down:
   ```bash
   tilt down
   kind delete cluster --name tourdevino
   ```

### Agent Expectations
- Prefer Tilt/K8s workflow for integration verification.
- For quick loops, direct app runs are acceptable:
  ```bash
  pnpm --filter web dev
  pnpm --filter api start:dev
  ```

---

## Feature-to-Module Ownership Map

| Feature Area | Frontend Routes | Backend Modules |
|---|---|---|
| Search and Browse Tours | `/search` | `tours`, `analytics` |
| Map View | `/map` | `tours` |
| Tour Detail | `/tours/:id` | `tours`, `reviews` |
| Booking Flow | `/tours/:id/book` | `bookings`, `payments`, `auth` |
| User Account/Auth | `/login`, `/signup`, `/reset-password`, `/account/profile` | `auth`, `users` |
| Booking History | `/account/bookings` | `bookings` |
| Reviews and Ratings | `/account/reviews`, `/tours/:id` | `reviews`, `bookings` |
| Static Pages and Contact | `/about`, `/faq`, `/terms`, `/contact` | `content` |
| Admin Ops | `/admin`, `/admin/*` | `admin` + related domains |
| Vendor Ops | `/vendor`, `/vendor/*` | `vendors` + related domains |

---

## Explicit Do and Don't Rules

### Do
- Do implement only what the scope requires.
- Do reuse existing patterns and naming conventions.
- Do add validation, auth checks, and tests with each endpoint change.
- Do keep PRs small and domain-focused.
- Do update docs when behavior/contracts/workflows change.

### Don't
- Don't introduce new architecture styles (CQRS/event bus/microservices) without clear requirement.
- Don't bypass module boundaries with direct cross-domain Prisma queries.
- Don't mix admin/vendor/client responsibilities in one endpoint/page component.
- Don't ship undocumented API/DB contract changes.
- Don't leave TODO placeholders in critical paths (auth, payment, booking integrity).

---

## Documentation Update Requirements

For every meaningful change, update docs in the same PR:
- [ ] `README.md` for workflow/command/infra changes.
- [ ] `IMPLEMENTATION_HANDOFF_PLAN.md` phase checklists and handoff progress.
- [ ] `FEATURE_INVENTORY.md` when routes/features are added, renamed, or re-scoped.
- [ ] API contract docs for endpoint/request/response changes.
- [ ] Prisma/data model docs for entity/relationship changes.
- [ ] Add a short agent handoff note in PR description (what changed, why, risks, follow-ups).

---

## PR and Change Checklist

- [ ] Scope is clear and limited.
- [ ] Architecture guardrails respected.
- [ ] API contracts explicit and backward-compatible (or versioned).
- [ ] Prisma migration included and verified for schema changes.
- [ ] Playwright integration and E2E tests added/updated and passing.
- [ ] Lint and typecheck passing.
- [ ] Docs updated.
- [ ] Security/privacy checks completed for auth/payment/user data paths.
- [ ] Operational impact noted (env vars, infra changes, migration steps).

---

## Definition of Done (Agent)

A task is done only when all are true:
- [ ] Implementation matches requested behavior and inventory scope.
- [ ] Code follows domain boundaries and stack conventions.
- [ ] API/DB changes are migrated, tested, and documented.
- [ ] Client/admin/vendor role constraints are enforced and verified.
- [ ] Local verification completed (lint, typecheck, relevant tests).
- [ ] Documentation and handoff notes updated for the next agent.
