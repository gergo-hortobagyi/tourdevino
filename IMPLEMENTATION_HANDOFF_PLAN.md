# IMPLEMENTATION_HANDOFF_PLAN

## Goal and Scope

- [x] Deliver a production-ready full-stack Tour de Vino application covering client, vendor, and admin capabilities from `FEATURE_INVENTORY.md`.
- [x] Implement with stack constraints from `README.md`: Nuxt SSR + Tailwind, NestJS domain modules, Prisma + PostgreSQL, Kubernetes (KIND + Tilt).
- [x] Follow operating constraints from `DEV_GUIDE_AGENT.md`: domain boundaries, DTO validation, role and ownership authorization, docs updated in the same change.
- [x] Use Playwright only for automated verification (integration + E2E). Unit tests are out of scope.
- [x] Produce code and docs such that a new coding agent can continue without prior context.

## Out of Scope (Initial Full Build)

- [ ] Native mobile apps.
- [ ] Microservice decomposition.
- [ ] Recommendation engine/ML.
- [ ] Multi-region deployment and advanced FinOps optimization.

---

## Architecture Baseline (Target)

- [x] Monorepo layout:
  - [x] `apps/web` (Nuxt SSR UI, route middleware, composables, components).
  - [x] `apps/api` (NestJS API, domain modules, guards, policies, services, repositories).
  - [x] `prisma` (schema + migrations only).
  - [x] `infra` (`kind`, `tilt`, `k8s` manifests/overlays).
  - [x] `docs` (API contract, architecture notes, runbooks).
- [x] API conventions:
  - [x] Prefix all routes with `/api`.
  - [x] Stable JSON envelope: `{ data, meta?, error? }`.
  - [x] Validation errors normalized (`code`, `message`, `details`).
- [x] AuthN/AuthZ conventions:
  - [x] JWT access + refresh token flow.
  - [x] Roles: `CLIENT`, `VENDOR`, `ADMIN`.
  - [x] Ownership guard for vendor-owned resources and user-owned bookings/reviews.
- [x] Data conventions:
  - [x] Prisma migrations for all schema changes.
  - [x] Soft delete where needed (`deletedAt`) for audit-sensitive entities.
- [x] Auditable timestamps/actor fields on admin/vendor mutations.
- [x] Frontend conventions:
  - [x] File-based routes under `pages/`.
  - [x] API access via composables (`useApi`, domain composables).
  - [x] SSR-safe fetching (`useFetch`, `useAsyncData`) and route middleware for role gates.

---

## Delivery Sequencing and Dependency Rules

- [x] Sequence is mandatory: Scaffold -> Security foundation -> Domain waves -> Hardening -> Infra rollout.
- [x] No feature endpoint ships without:
  - [x] DTO validation.
  - [x] auth/role/ownership checks where applicable.
  - [x] Playwright integration coverage.
- [x] No frontend protected page ships without:
  - [x] auth middleware.
  - [x] forbidden/unauthorized UX states.
  - [x] matching API contract documented.

---

## Phase-by-Phase Checklist (Dependencies + Exit Criteria)

## Phase 0 - Scaffold and Baseline Tooling

Dependencies: none
Exit criteria: local dev stack boots; baseline CI runs lint/typecheck/playwright skeleton.

- [x] Initialize/verify workspace structure (`apps/web`, `apps/api`, `prisma`, `infra`, `docs`).
- [x] Create `.env.example` with web/api/db/payment variables.
- [x] Configure package scripts for web, api, db, infra, playwright.
- [x] Add NestJS bootstrap with global prefix, global validation pipe, exception filter skeleton.
- [x] Add Nuxt baseline with Tailwind setup and app shell layout.
- [x] Configure Prisma connection and baseline migration.
- [x] Add Playwright setup:
  - [x] `playwright.integration.config` (API integration tests).
  - [x] `playwright.e2e.config` (browser E2E).
  - [x] global setup for seed/reset.
- [x] Add CI workflow skeleton with required checks.

## Phase 1 - Security Foundation First (Endpoint-Level)

Dependencies: Phase 0
Exit criteria: auth lifecycle + role/ownership guards + rate limiting + validation + secure defaults operational.

- [x] Implement auth module:
  - [x] `POST /api/auth/signup`
  - [x] `POST /api/auth/login`
  - [x] `POST /api/auth/refresh`
  - [x] `POST /api/auth/logout`
  - [x] `GET /api/auth/me`
  - [x] `POST /api/auth/forgot-password`
  - [x] `POST /api/auth/reset-password`
- [x] Implement password hashing, token rotation, refresh token invalidation.
- [x] Add guards/policies:
  - [x] JWT auth guard.
  - [x] roles guard (`CLIENT|VENDOR|ADMIN`).
  - [x] ownership guard (booking/tour/review ownership checks).
- [x] Add endpoint throttling:
  - [x] strict limits on login/signup/reset/refresh.
  - [x] moderate limits on write-heavy endpoints.
- [x] Add input/output hardening:
  - [x] DTO validation and transform.
  - [x] request size limits.
  - [x] secure headers + env-based CORS.
  - [x] sanitized error responses.
- [x] Add audit logging for auth and privileged mutations.
- [x] Playwright integration tests for:
  - [x] successful auth flows.
  - [x] invalid credentials.
  - [x] token expiration/refresh.
  - [x] role forbidden paths.
  - [x] rate limit responses.

## Phase 2 - Core Domain Model and Shared Contracts

Dependencies: Phase 1
Exit criteria: Prisma schema supports all core features with migrations + seeded reference data.

- [x] Finalize Prisma models/entities:
  - [x] User, Role, Session/RefreshToken.
  - [x] VendorProfile + approval state.
  - [x] Tour, TourMedia, TourSchedule, TourAvailability.
  - [x] Booking, Booking guest data, Booking status history.
  - [x] Payment, Refund.
  - [x] Review + VendorResponse.
  - [x] ContentPage, FAQ, ContactSubmission.
  - [x] Analytics tables/views (if needed).
- [x] Add indexes/constraints:
  - [x] unique slugs.
  - [x] booking uniqueness/capacity constraints.
  - [x] foreign keys with cascade/restrict rules.
- [x] Seed baseline data:
  - [x] admin account.
  - [x] sample vendor/client.
  - [x] sample tours/schedules.
- [x] Publish API error code catalog and response schema in docs.
- [x] Playwright integration tests validate DB state transitions for key writes.

## Phase 3 - Public Catalog (Client Read Paths)

Dependencies: Phase 2
Exit criteria: public browsing/search/map/detail routes functional end-to-end.

- [x] Backend tours + reviews read interfaces.
- [x] Frontend pages:
  - [x] `/search`
  - [x] `/map`
  - [x] `/tours/:id`
  - [x] static pages (`/about`, `/faq`, `/terms`, `/contact`)
- [x] SSR-friendly filtering, pagination, sorting, map bounds query support.
- [x] UX states for loading/empty/error on each data page.
- [x] Playwright E2E:
  - [x] search/filter journey.
  - [x] map marker -> detail navigation.
  - [x] tour detail content and review rendering.
  - [x] static page render checks.

## Phase 4 - Booking and Payment Flow

Dependencies: Phase 3 + Phase 1 security
Exit criteria: authenticated client can book and complete payment flow with resilient status handling.

- [x] Backend booking lifecycle + payment intent/refund/webhook handling.
- [x] Enforce capacity checks and transactional booking writes.
- [x] Implement idempotency keys for payment/booking create endpoints.
- [x] Frontend pages/composables:
  - [x] `/tours/:id/book`
  - [x] booking confirmation/failure states
  - [x] account booking listing entry points
- [x] Playwright integration:
  - [x] booking create/cancel constraints.
  - [x] webhook handling and status reconciliation.
- [x] Playwright E2E:
  - [x] full booking checkout happy path.
  - [x] payment fail/retry path.
  - [x] cancellation policy flow.

## Phase 5 - Client Account and Reviews

Dependencies: Phase 4
Exit criteria: account profile/bookings/reviews features complete.

- [x] Backend:
  - [x] profile read/update.
  - [x] booking history endpoints.
  - [x] review create/edit/delete with eligibility checks.
- [x] Frontend pages:
  - [x] `/account/profile`
  - [x] `/account/bookings`
  - [x] `/account/reviews`
- [x] Route middleware for authenticated client pages.
- [x] Playwright E2E:
  - [x] profile edit persistence.
  - [x] bookings history accuracy.
  - [x] post-tour review permission and submission.

## Phase 6 - Vendor Portal

Dependencies: Phase 5 + vendor role workflows
Exit criteria: vendors can manage own tours, inventory, bookings, and profile.

- [x] Backend vendor-scoped endpoints:
  - [x] vendor dashboard metrics.
  - [x] CRUD own tours + media.
  - [x] availability management.
  - [x] own booking management actions.
  - [x] review responses.
  - [x] vendor profile + payout details.
- [x] Frontend pages:
  - [x] `/vendor`
  - [x] `/vendor/tours`, `/vendor/tours/new`, `/vendor/tours/:id/edit`
  - [x] `/vendor/tours/:id/availability`
  - [x] `/vendor/bookings`, `/vendor/bookings/:id`
  - [x] `/vendor/reviews`
  - [x] `/vendor/profile`, `/vendor/support`
- [x] Enforce ownership checks on every vendor read/write path.
- [x] Playwright integration + E2E for vendor role access and lifecycle operations.

## Phase 7 - Admin Portal

Dependencies: Phase 6
Exit criteria: admin can govern users/vendors/tours/bookings/content/settings/reports.

- [x] Backend admin endpoints:
  - [x] dashboard KPIs.
  - [x] vendor approval/rejection.
  - [x] global user/role management.
  - [x] global bookings and refunds.
  - [x] static content/FAQ management.
  - [x] reports endpoints.
- [x] Frontend pages:
  - [x] `/admin`, `/admin/tours*`, `/admin/vendors*`, `/admin/bookings*`
  - [x] `/admin/users*`, `/admin/reports`, `/admin/content`, `/admin/settings`
- [x] Add admin middleware and stronger audit trail for privileged operations.
- [x] Playwright E2E:
  - [x] admin login + dashboard.
  - [x] vendor approval workflow.
  - [x] role assignment and access impact.
  - [x] content update reflected on public pages.

## Phase 8 - Hardening, Accessibility, and Performance

Dependencies: Phase 7
Exit criteria: critical security/perf/accessibility checks pass and regressions are covered.

- [x] Add caching strategy for high-read endpoints (`tours`, `faq`, selected reports).
- [x] Add pagination limits and query guardrails.
- [x] Add health/readiness endpoints and dependency checks.
- [x] Accessibility pass on core journeys (keyboard, labels, error messaging).
- [x] Observability baseline (structured logs, request IDs, error correlation).
- [x] Expand Playwright regression pack for bugs/security regressions.

## Phase 9 - Infra Rollout and Release Readiness

Dependencies: Phase 8
Exit criteria: local KIND+Tilt stable and k8s deployment path documented + runnable.

- [x] Finalize `infra/kind` cluster config and local networking/ingress setup.
- [x] Finalize `Tiltfile` for web/api/db/prisma migration flow with hot reload.
- [x] Create k8s manifests/overlays:
  - [x] base (web/api/postgres/ingress/config/secret refs).
  - [x] local/dev/staging/prod overlays.
- [x] Add migration job/init container strategy for `prisma migrate deploy`.
- [x] Define rollout strategy:
  - [x] pre-deploy checks.
  - [x] apply order (db migration -> api -> web).
  - [x] smoke tests.
  - [x] rollback instructions.
- [x] Add CI/CD gate docs and environment variable matrix.

---

## Backend Interface Specification Backlog (By Module)

## Auth Module

- [x] `POST /api/auth/signup`
  - [ ] Request DTO: `email`, `password`, `firstName`, `lastName`, `role?` (default CLIENT).
  - [ ] Response: `AuthTokensDto + UserPublicDto`.
- [x] `POST /api/auth/login`
  - [ ] Request DTO: `email`, `password`.
  - [ ] Response: `AuthTokensDto + UserPublicDto`.
- [x] `POST /api/auth/refresh`
  - [ ] Request DTO: `refreshToken`.
  - [ ] Response: rotated `AuthTokensDto`.
- [x] `POST /api/auth/logout`
  - [ ] Request DTO: `refreshToken`.
  - [ ] Response: `{ success: true }`.
- [x] `GET /api/auth/me` (auth required) -> `UserProfileDto`.
- [x] `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
  - [x] Generic success for anti-enumeration.

## Users Module

- [x] `GET /api/users/me`
- [x] `PATCH /api/users/me` (editable profile only) -> updated `UserProfileDto`.
- [ ] Admin:
  - [x] `GET /api/admin/users`
  - [x] `GET /api/admin/users/:id`
  - [x] `PATCH /api/admin/users/:id/role`
  - [x] `PATCH /api/admin/users/:id/status`

## Vendors Module

- [x] `POST /api/vendor/applications` (business/legal/contact basics).
- [x] `GET /api/vendor/profile`
- [x] `PATCH /api/vendor/profile`
- [ ] Admin governance:
  - [x] `GET /api/admin/vendors`
  - [x] `GET /api/admin/vendors/:id`
  - [x] `PATCH /api/admin/vendors/:id/approve`
  - [x] `PATCH /api/admin/vendors/:id/reject`

## Tours Module

- [x] Public:
  - [x] `GET /api/tours` (query, region, priceMin/Max, ratingMin, date, duration, sort, page/pageSize)
  - [x] `GET /api/tours/:id`
  - [x] `GET /api/tours/:id/availability`
  - [x] `GET /api/tours/map` (bounds/radius)
- [ ] Vendor:
  - [x] `GET /api/vendor/tours`
  - [x] `POST /api/vendor/tours`
  - [x] `GET /api/vendor/tours/:id`
  - [x] `PATCH /api/vendor/tours/:id`
  - [x] `DELETE /api/vendor/tours/:id`
  - [x] `PATCH /api/vendor/tours/:id/status`
  - [x] `PUT /api/vendor/tours/:id/availability`
- [ ] Admin:
  - [x] `GET /api/admin/tours`
  - [x] `PATCH /api/admin/tours/:id/status`

## Bookings Module

- [x] Client:
  - [x] `POST /api/bookings`
  - [x] `GET /api/bookings/me`
  - [x] `GET /api/bookings/:id` (ownership required)
  - [x] `PATCH /api/bookings/:id/cancel`
- [ ] Vendor:
  - [x] `GET /api/vendor/bookings`
  - [x] `GET /api/vendor/bookings/:id`
  - [x] `PATCH /api/vendor/bookings/:id/status`
- [ ] Admin:
  - [x] `GET /api/admin/bookings`
  - [x] `GET /api/admin/bookings/:id`
  - [x] `PATCH /api/admin/bookings/:id/cancel`

## Payments Module

- [x] `POST /api/payments/intents` (auth required, booking context)
- [x] `GET /api/payments/:bookingId/status` (ownership/role check)
- [x] `POST /api/payments/webhooks/stripe` (signature verified)
- [ ] Admin:
  - [x] `POST /api/admin/payments/:bookingId/refund`
- [x] Response DTOs include `paymentStatus`, `providerRef`, `amount`, `currency`, `updatedAt`.

## Reviews Module

- [x] Public: `GET /api/tours/:id/reviews`
- [x] Client:
  - [x] `POST /api/reviews`
  - [x] `PATCH /api/reviews/:id`
  - [x] `DELETE /api/reviews/:id`
  - [x] `GET /api/reviews/me`
- [x] Vendor: `POST /api/vendor/reviews/:id/respond`
- [x] Admin: `PATCH /api/admin/reviews/:id/moderate`
- [ ] Rule: review creation only after completed booking.

## Content Module

- [x] Public:
  - [x] `GET /api/content/:slug`
  - [x] `GET /api/faq`
  - [x] `POST /api/contact`
- [ ] Admin:
  - [x] `GET /api/admin/content`
  - [x] `POST /api/admin/content`
  - [x] `PATCH /api/admin/content/:id`
  - [x] `DELETE /api/admin/content/:id`
  - [x] `GET/POST/PATCH/DELETE /api/admin/faq*`

## Analytics Module

- [ ] Admin:
  - [x] `GET /api/admin/analytics/overview`
  - [x] `GET /api/admin/reports/revenue`
  - [x] `GET /api/admin/reports/conversion`
- [ ] Vendor:
  - [x] `GET /api/vendor/analytics/overview`
  - [x] `GET /api/vendor/tours/:id/analytics`
- [ ] Query DTOs include date range, granularity, filters.

---

## Frontend Interface Specification Backlog (Nuxt)

## Cross-Cutting Frontend Foundation

- [x] App shell with navigation variants for guest/client/vendor/admin.
- [x] Route middleware:
  - [x] `auth` (login required)
  - [x] `role-vendor`
  - [x] `role-admin`
  - [x] `role-client`
- [x] Core composables:
  - [x] `useApi` (typed fetch wrapper, normalized errors, auth header handling)
  - [x] `useAuth` (session state, login/logout/refresh)
  - [x] `usePagination`, `useFilters`, `useToast`
- [ ] Shared components:
  - [ ] loading/empty/error blocks
  - [ ] paginated table/list
  - [ ] confirmation modal
  - [ ] form field primitives + validation states

## Public Client Routes

- [x] `/` (landing + featured tours)
- [x] `/search` with `useToursSearch`
- [x] `/map` with `useToursMap`
- [x] `/tours/:id` with `useTourDetail`, `useTourReviews`
- [x] `/tours/:id/book` with `useBookingCheckout`
- [x] `/login`, `/signup`, `/reset-password`
- [x] `/about`, `/faq`, `/terms`, `/contact`

## Authenticated Client Routes

- [x] `/account/profile` with `useProfile`
- [x] `/account/bookings` with `useMyBookings`
- [x] `/account/reviews` with `useMyReviews`

## Vendor Routes

- [x] `/vendor` (dashboard KPIs)
- [x] `/vendor/tours`, `/vendor/tours/new`, `/vendor/tours/:id/edit`
- [x] `/vendor/tours/:id/availability`
- [x] `/vendor/bookings`, `/vendor/bookings/:id`
- [x] `/vendor/reviews`
- [x] `/vendor/profile`
- [x] `/vendor/support`

## Admin Routes

- [x] `/admin` dashboard
- [x] `/admin/tours`, `/admin/tours/new`, `/admin/tours/:id/edit`
- [x] `/admin/vendors`, `/admin/vendors/:id`
- [x] `/admin/bookings`, `/admin/bookings/:id`
- [x] `/admin/users`, `/admin/users/:id`
- [x] `/admin/reports`
- [x] `/admin/content`
- [x] `/admin/settings`

## Frontend-API Contract Rules

- [x] Every page/composable maps to a defined backend endpoint + DTO.
- [x] Forbidden/unauthorized responses produce deterministic redirects or inline state.
- [x] No business logic in page SFCs; keep in composables/services.
- [x] SSR-safe code paths only (guard browser APIs on client).

---

## Playwright-Only Testing Plan (Integration + E2E)

## Test Architecture

- [x] Integration tests with Playwright `request` context:
  - [x] auth, role checks, validation, rate limit, transactional state changes.
- [x] E2E browser tests for full user journeys across client/vendor/admin.
- [x] No unit tests in this implementation program.

## Test Data and Fixtures

- [x] Global setup seeds:
  - [x] admin, vendor-approved, client users.
  - [ ] tours with mixed statuses and availability.
  - [ ] bookings in draft/paid/cancelled/completed states.
- [ ] Isolated test accounts per worker or deterministic reset strategy.
- [x] Utilities:
  - [x] login helpers by role.
  - [x] API helper for creating bookings/tours quickly.
  - [ ] time control helpers for date-sensitive scenarios.

## Required Suites by Milestone

- [x] Security suite (Phase 1): auth, RBAC, ownership, throttling, validation failures.
- [x] Public suite (Phase 3): search/map/detail/static pages.
- [x] Booking suite (Phase 4): checkout, payment status transitions, cancel/refund.
- [x] Client account suite (Phase 5): profile + review permissions.
- [x] Vendor suite (Phase 6): own-tour CRUD, availability, booking actions.
- [x] Admin suite (Phase 7): vendor approvals, role changes, content publish.
- [x] Regression suite (Phase 8): historical bugs locked with tests.

## CI Gates

- [x] PR checks:
  - [x] lint + typecheck
  - [x] Playwright integration (changed modules + security smoke)
  - [x] Playwright E2E smoke (critical paths)
- [ ] Main branch checks:
  - [ ] full integration + E2E matrix
- [ ] Nightly:
  - [ ] extended cross-browser E2E
  - [ ] flaky test detection report

---

## Infra Rollout Plan (KIND + Tilt -> Kubernetes)

## Local Development (KIND + Tilt)

- [x] `kind create cluster --name tourdevino --config infra/kind/kind-config.yaml`
- [x] `tilt up` orchestrates:
  - [x] Postgres workload
  - [x] API service with live reload/sync
  - [x] Web service with live reload/sync
  - [x] local migration step
- [x] Port-forward matrix documented for web/api/db/Tilt dashboard.
- [x] `tilt down` and cluster teardown documented.

## Kubernetes Deploy Path (Dev -> Staging -> Prod)

- [ ] Build and tag immutable images for web/api.
- [x] Apply manifests in order:
  - [x] config/secrets
  - [x] db dependencies
  - [x] migration job
  - [x] api deployment/service
  - [x] web deployment/service/ingress
- [x] Post-deploy smoke:
  - [x] health endpoints
  - [x] auth login
  - [x] public tour listing
- [x] Rollback plan:
  - [x] rollback web/api deployments
  - [x] DB rollback policy documented (forward-fix preferred)
- [x] Environment matrix documented for all required vars and secrets.

---

## Documentation Maintenance Checklist (Mandatory Every Wave)

- [x] Update `README.md` for command/workflow/env/infra changes.
- [x] Update `FEATURE_INVENTORY.md` when route scope/features change.
- [x] Update `DEV_GUIDE_AGENT.md` when conventions or process gates evolve.
- [x] Maintain API docs (`docs/api/*`): endpoints, DTOs, responses, error codes, auth matrix.
- [x] Maintain data model docs (`docs/data-model.md`): entities, relations, migration notes.
- [x] Maintain deployment docs (`docs/deploy.md`): KIND/Tilt/K8s, rollout/rollback.
- [x] Add phase handoff notes: completed items, open risks, next actions.

---

## Definition of Done (Program-Level)

- [x] All inventory routes for client/admin/vendor are implemented with matching API support.
- [ ] Security baseline is complete and verified early (authn/authz/guards/rate-limit/validation).
- [ ] All endpoints have DTO validation, stable responses, and documented contracts.
- [ ] Playwright integration and E2E suites cover critical and role-sensitive paths.
- [ ] KIND + Tilt local workflow is reliable; k8s deployment path is documented and tested.
- [x] Required docs are current (`README.md`, `FEATURE_INVENTORY.md`, `DEV_GUIDE_AGENT.md`, API/data/deploy docs).
- [ ] No blocking unknowns remain for a new coding agent to continue.

---

## Handoff Instructions for Next Coding Agent

- [ ] Start at the earliest unchecked phase and complete in strict order.
- [ ] For each task, ship code + Playwright tests + docs update in the same change.
- [ ] Do not bypass security checks for speed; enforce guards/policies before feature completion.
- [ ] Keep module boundaries strict (no cross-module direct Prisma access).
- [ ] Before marking a phase complete, verify all exit criteria and update this plan checkboxes.
- [ ] In each PR/handoff note include:
  - [ ] completed items
  - [ ] commands run and results
  - [ ] migration names applied
  - [ ] known risks/follow-ups
  - [ ] exact next recommended phase/task

---

## Handoff Note (2026-02-28)

Completed items
- Phase 0 checklist completed (workspace scaffold, env/scripts, Nest/Nuxt baseline, Prisma baseline migration, Playwright setup, CI skeleton).
- Phase 1 checklist completed (auth lifecycle endpoints, JWT + refresh rotation, RBAC + ownership guards, throttling, validation/hardening, audit logging).
- Phase 2 foundational data work completed (core schema models, constraints/indexes, seed data, docs for API errors + data model).

Commands run and results
- `pnpm install` -> pass.
- `pnpm prisma generate` -> pass.
- `pnpm lint` -> pass.
- `pnpm typecheck` -> pass.
- `pnpm test:integration` -> pass (5/5).
- `pnpm test:e2e` -> pass (3/3).

Migrations
- Applied `20260228120000_init`.

Risks / follow-ups
- Continue Phase 3 from public catalog read paths (`/search`, `/map`, `/tours/:id`, static content pages + API read endpoints).
- Replace demo RBAC/ownership probe endpoints with real domain endpoints as catalog and booking modules are implemented.
- Harden audit trail coverage for upcoming admin/vendor mutation endpoints.

Next recommended task
- Start Phase 3: implement `tours` + `reviews` public read endpoints and Nuxt pages (`/search`, `/map`, `/tours/:id`) with SSR-safe filters/pagination and Playwright E2E coverage.

---

## Handoff Note (2026-03-01)

Completed items
- Phase 3 completed end-to-end:
  - backend public read interfaces for tours, reviews, content,
  - frontend pages `/search`, `/map`, `/tours/:id`, `/about`, `/faq`, `/terms`, `/contact`,
  - SSR-safe fetching and explicit loading/error/empty states,
  - Playwright integration + E2E catalog coverage.
- Phase 4 advanced to meaningful partial completion:
  - booking create/me/detail/cancel endpoints with transactional capacity handling,
  - payment intent/status/webhook scaffold,
  - frontend `/tours/:id/book` and `/account/bookings` entry point,
  - Playwright integration + E2E booking happy-path coverage.
- Docs updated in same change (`README.md`, `docs/api/*`, `docs/data-model.md`, `docs/deploy.md`).

Commands run and results
- `pnpm prisma generate` -> pass.
- `pnpm lint` -> pass.
- `pnpm typecheck` -> pass.
- `pnpm test:integration` -> pass (10/10).
- `pnpm test:e2e` -> pass (7/7).

Migrations
- Applied `20260301093000_add_tour_coordinates`.

Risks / follow-ups
- Phase 4 still missing idempotency keys for booking/payment create endpoints.
- Payment fail/retry and cancellation policy UX flows are not implemented yet.
- Webhook endpoint is scaffolded and stateful but signature verification/hardening is pending.

Next recommended task
- Continue Phase 4 to completion: add idempotency key handling, payment fail/retry UI path, cancellation policy behavior, and integration/E2E tests for those scenarios.

---

## Handoff Note (2026-03-01b)

Completed items
- Phase 4 completed:
  - booking/payment idempotency keys implemented,
  - webhook signature verification added,
  - payment fail/retry flow implemented in UI + backend contract,
  - cancellation policy enforced and surfaced in UI,
  - integration + E2E tests added for idempotency/reconciliation/fail-retry/cancellation.
- Phase 5 completed:
  - profile read/update API + UI,
  - booking history refinements (policy metadata),
  - review create/edit/delete + eligibility checks,
  - `/account/profile`, `/account/bookings`, `/account/reviews` parity,
  - integration + E2E coverage for profile and review permissions.

Commands run and results
- `pnpm prisma generate` -> pass.
- `pnpm lint` -> pass.
- `pnpm typecheck` -> pass.
- `pnpm test:integration` -> pass.
- `pnpm test:e2e` -> pass.

Migrations
- Applied `20260301110000_add_payment_idempotency`.

Risks / follow-ups
- Payment simulation endpoint is intentionally local/dev oriented and should be disabled or removed for production rollout.
- Webhook verification currently uses local HMAC strategy and should be aligned with full provider signature scheme in production.
- `/vendor` and `/admin` routes currently render placeholders only; do not treat them as Phase 6/7 completion.

Next recommended task
- Start Phase 6: implement vendor-scoped tours/inventory/bookings/review-response APIs and vendor portal routes with strict ownership checks and Playwright role-journey coverage.

---

## Phase 6 Orchestration Plan (Prepared 2026-03-01c)

Execution order is mandatory. Do not start Phase 7 work until all Phase 6 exit criteria pass.

### Wave 6.1 - Backend vendor foundation (authorization + profile + dashboard)

- [x] Add `vendors` module and wire it in `apps/api/src/app.module.ts`.
- [x] Add vendor role guard usage on all `/vendor/*` controllers (`JwtAuthGuard` + `Roles(VENDOR)`).
- [x] Add vendor approval policy check (approved vendors only for operational endpoints; clear `FORBIDDEN` error code for pending/rejected).
- [x] Implement:
  - [x] `GET /api/vendor/profile`
  - [x] `PATCH /api/vendor/profile`
  - [x] `GET /api/vendor/dashboard` (KPIs: active tours, upcoming bookings, total paid bookings, average rating)
- [x] Ensure stable envelope + normalized errors for all new endpoints.

### Wave 6.2 - Backend vendor tours and availability

- [x] Implement vendor-scoped tours endpoints:
  - [x] `GET /api/vendor/tours`
  - [x] `POST /api/vendor/tours`
  - [x] `GET /api/vendor/tours/:id`
  - [x] `PATCH /api/vendor/tours/:id`
  - [x] `DELETE /api/vendor/tours/:id` (soft/business delete strategy + guardrails)
  - [x] `PATCH /api/vendor/tours/:id/status`
- [x] Implement media handling in the same module contract (URLs/ordering; no external upload provider integration in this phase).
- [x] Implement availability upsert endpoint:
  - [x] `PUT /api/vendor/tours/:id/availability`
- [x] Enforce ownership on every read/write path (vendor can only access own `tourId`).

### Wave 6.3 - Backend vendor bookings and reviews

- [x] Implement booking endpoints:
  - [x] `GET /api/vendor/bookings`
  - [x] `GET /api/vendor/bookings/:id`
  - [x] `PATCH /api/vendor/bookings/:id/status` (allowed transitions only)
- [x] Implement review response endpoint:
  - [x] `POST /api/vendor/reviews/:id/respond`
- [x] Enforce ownership checks through joins (`booking.tour.vendorId`, `review.tour.vendorId`).
- [x] Add audit log events for status changes and review responses.

### Wave 6.4 - Frontend vendor portal parity (Nuxt)

- [x] Add/extend composables for vendor API surface (`useVendorDashboard`, `useVendorTours`, `useVendorBookings`, `useVendorReviews`, `useVendorProfile`).
- [x] Implement pages:
  - [x] `/vendor`
  - [x] `/vendor/tours`, `/vendor/tours/new`, `/vendor/tours/:id/edit`
  - [x] `/vendor/tours/:id/availability`
  - [x] `/vendor/bookings`, `/vendor/bookings/:id`
  - [x] `/vendor/reviews`
  - [x] `/vendor/profile`, `/vendor/support`
- [x] Apply `auth` + `role-vendor` middleware on all vendor pages.
- [x] Ensure deterministic loading/empty/error/forbidden states.

### Wave 6.5 - Data model and migrations

- [x] Evaluate schema deltas needed for payout/profile and operational audit fields. At minimum decide and implement one of:
  - [x] Keep payout details out of DB in Phase 6 (document deferred design), or
  - [x] Add vendor payout fields (for example: `payoutProvider`, masked account reference, `payoutConfiguredAt`).
- [x] Add auditable actor fields for vendor/admin mutations where required by checklist.
- [x] Create Prisma migration(s), regenerate client, and update `docs/data-model.md`.

### Wave 6.6 - Playwright integration + E2E

- [x] Integration suite (`tests/integration/vendor-portal.spec.ts`):
  - [x] vendor role access happy path.
  - [x] client/admin forbidden on vendor endpoints.
  - [x] ownership isolation across two vendors.
  - [x] tour CRUD + availability upsert.
  - [x] booking status transition validation.
  - [x] review response create/duplicate rules.
- [x] E2E suite (`tests/e2e/vendor-portal.spec.ts`):
  - [x] vendor login -> dashboard KPI render.
  - [x] create/edit tour -> availability update.
  - [x] booking list/detail -> status action.
  - [x] review response submission.
  - [x] unauthorized user redirected/forbidden UX.

### Wave 6.7 - Documentation and handoff updates

- [x] Update `README.md` implementation status to mark Phase 6 completion when done.
- [x] Update `FEATURE_INVENTORY.md` if vendor scope changes.
- [x] Update `DEV_GUIDE_AGENT.md` if new conventions are introduced (for example vendor approval guard policy).
- [x] Add API docs for vendor endpoints under `docs/api/`.
- [x] Update this plan checkboxes and append a new dated handoff note.

### Wave 6.8 - Verification commands (required before phase exit)

- [x] `pnpm prisma generate`
- [x] `pnpm prisma migrate status`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test:integration`
- [x] `pnpm test:e2e`

### Phase 6 exit criteria (must all be true)

- [x] All Phase 6 checklist items are checked with implementation evidence in code.
- [x] Vendor endpoints enforce auth + role + ownership and return normalized errors.
- [x] Vendor pages are functional and role-gated with robust UX states.
- [x] New/changed schema is migrated and documented.
- [x] Vendor integration and E2E suites pass locally.
- [x] No open blockers remain for Phase 7 admin work.

---

## Handoff Note (2026-03-01d)

Completed items
- Phase 6 completed end-to-end:
  - vendor API (`/api/vendor/*`) for profile/dashboard/tours/availability/bookings/reviews/analytics,
  - strict vendor role + ownership + approval policy checks,
  - vendor portal routes implemented (`/vendor`, tours, availability, bookings, reviews, profile, support),
  - integration + E2E coverage for vendor role-sensitive paths.
- Phase 7 completed end-to-end:
  - admin API (`/api/admin/*`) for users/vendors/tours/bookings/refunds/content/faq/reports/review moderation,
  - admin portal routes implemented (`/admin*`) including dashboard, users, vendors, bookings, tours, reports, content, settings,
  - privileged mutation audit logging applied.
- Phase 8 hardening baseline completed:
  - request ID propagation + structured request logging,
  - health/readiness endpoints (`/api/health/live`, `/api/health/ready`),
  - caching for high-read endpoints (tours, content/faq, reports),
  - pagination/query guardrails and date-range limits,
  - accessibility-oriented UX states across new vendor/admin journeys.
- Phase 9 rollout baseline completed locally:
  - expanded K8s base + local/dev/staging/prod overlays,
  - Prisma migration Job manifest strategy,
  - updated Tilt orchestration and port-forward mapping,
  - rollout/rollback and environment matrix documented.

Commands run and results
- `pnpm prisma generate` -> pass.
- `pnpm prisma migrate status` -> pass (schema up to date).
- `pnpm lint` -> pass.
- `pnpm typecheck` -> pass.
- `pnpm test:integration` -> pass (19/19).
- `pnpm test:e2e` -> pass (12/12).

Migrations
- Applied `20260301153000_vendor_admin_audit_fields`.

Risks / follow-ups
- `POST /api/vendor/applications` remains intentionally deferred; vendor onboarding currently relies on role assignment + profile update.
- Admin settings page is currently UX scaffolded and environment-backed; persistent settings storage is not implemented.
- Kubernetes manifests are release-ready baseline templates; image build/publish automation remains a CI/CD integration task.

Next recommended task
- Finalize CI/CD implementation for image build/sign/deploy pipeline with environment-specific secret management and production smoke gates.

---

## Handoff Note (2026-03-01e)

Completed items
- Closed remaining gap: vendor onboarding endpoint `POST /api/vendor/applications`.
  - validated payload,
  - anti-duplication on pending applications,
  - state transitions for rejected -> pending resubmission,
  - role promotion to `VENDOR` on first application,
  - audit logging for create/resubmit events.
- Closed remaining gap: admin settings persistence.
  - added persisted `AppSetting` model,
  - implemented `GET /api/admin/settings` + `PATCH /api/admin/settings`,
  - wired `/admin/settings` UI to backend with load/save feedback,
  - added integration + E2E verification.
- Strengthened Phase 9 CI/CD readiness artifacts.
  - added `apps/api/Dockerfile` + `apps/web/Dockerfile`,
  - added release readiness workflow `.github/workflows/release-readiness.yml`,
  - added rollout/smoke/rollback/build scripts under `scripts/ci/`.
- Updated docs and plan checkboxes for completion and added this handoff.

Commands run and results
- `pnpm prisma generate` -> pass.
- `pnpm prisma migrate status` -> pass.
- `pnpm lint` -> pass.
- `pnpm typecheck` -> pass.
- `pnpm test:integration` -> pass.
- `pnpm test:e2e` -> pass.

Migrations
- Applied `20260301170000_add_app_settings`.

Risks / follow-ups
- Docker image publication and cluster deployment remain environment/secret dependent CI wiring tasks (workflow scaffolded in-repo).
- `POST /api/vendor/applications` currently accepts core onboarding fields; legal/compliance expansion can be layered without contract breakage.

Next recommended task
- Connect `.github/workflows/release-readiness.yml` to real registry credentials and deployment target environment secrets, then execute a staging dry-run rollout.
