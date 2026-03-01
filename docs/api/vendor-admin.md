# Vendor and Admin API (Phases 6-8)

Base prefix: `/api`

All routes below require bearer auth.

## Vendor Routes (`/vendor/*`)

Role: `VENDOR` required on all endpoints.

Approval policy:
- Operational endpoints (`dashboard`, tours, bookings, reviews, analytics) require vendor profile status `APPROVED`.
- Pending/rejected vendors receive `FORBIDDEN` with code `VENDOR_NOT_APPROVED`.

Implemented endpoints:
- `POST /vendor/applications`
- `GET /vendor/profile`
- `PATCH /vendor/profile`
- `GET /vendor/dashboard`
- `GET /vendor/analytics/overview`
- `GET /vendor/tours`
- `POST /vendor/tours`
- `GET /vendor/tours/:id`
- `GET /vendor/tours/:id/analytics`
- `PATCH /vendor/tours/:id`
- `DELETE /vendor/tours/:id`
- `PATCH /vendor/tours/:id/status`
- `PUT /vendor/tours/:id/availability`
- `GET /vendor/bookings`
- `GET /vendor/bookings/:id`
- `PATCH /vendor/bookings/:id/status`
- `GET /vendor/reviews`
- `POST /vendor/reviews/:id/respond`

Key constraints:
- Ownership enforced on all vendor reads/writes through `vendorId` joins.
- Booking transition guardrails enforce allowed state changes only.
- Availability upsert rejects duplicate dates and capacity below booked count.
- Vendor application rules:
  - first application creates pending vendor profile and promotes user role to `VENDOR`,
  - duplicate pending application is rejected,
  - rejected applications can be resubmitted and transition back to `PENDING`.

## Admin Routes (`/admin/*`)

Role: `ADMIN` required on all endpoints.

Implemented endpoints:
- `GET /admin/dashboard`
- `GET /admin/settings`
- `PATCH /admin/settings`
- Users:
  - `GET /admin/users`
  - `GET /admin/users/:id`
  - `PATCH /admin/users/:id/role`
  - `PATCH /admin/users/:id/status`
- Vendors:
  - `GET /admin/vendors`
  - `GET /admin/vendors/:id`
  - `PATCH /admin/vendors/:id/approve`
  - `PATCH /admin/vendors/:id/reject`
- Tours:
  - `GET /admin/tours`
  - `GET /admin/tours/:id`
  - `POST /admin/tours`
  - `PATCH /admin/tours/:id`
  - `PATCH /admin/tours/:id/status`
- Bookings + refunds:
  - `GET /admin/bookings`
  - `GET /admin/bookings/:id`
  - `PATCH /admin/bookings/:id/cancel`
  - `POST /admin/payments/:bookingId/refund`
- Content:
  - `GET /admin/content`
  - `POST /admin/content`
  - `PATCH /admin/content/:id`
  - `DELETE /admin/content/:id`
  - `POST /admin/faq`
  - `PATCH /admin/faq/:id`
  - `DELETE /admin/faq/:id`
- Review moderation:
  - `PATCH /admin/reviews/:id/moderate`
- Analytics/reports:
  - `GET /admin/analytics/overview`
  - `GET /admin/reports/revenue`
  - `GET /admin/reports/conversion`

Key constraints:
- Self-demotion and self-ban are blocked for admins.
- Refund amounts are bounded by refundable balance.
- Report date range guardrail: max 366 days.
- Admin settings are persisted in `AppSetting(key=platform)` and audited.

## Hardening Additions

- Health probes:
  - `GET /health/live`
  - `GET /health/ready`
- Response header: `x-request-id`.
- Error payload includes `requestId` for correlation.
- In-memory TTL caching for high-read endpoints:
  - public tours list/map,
  - content page and FAQ,
  - dashboard/reports snapshots.
