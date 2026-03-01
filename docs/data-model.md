# Data Model Snapshot

Implemented baseline + Phase 3/4 + Phase 5 partial entities in `prisma/schema.prisma`:

- `User`, `RefreshToken`, `PasswordResetToken`
- `VendorProfile`
- `Tour`, `TourMedia`, `TourSchedule`, `TourAvailability`
- `Booking`, `BookingStatusHistory`
- `Payment`, `Refund`
- `Review`, `VendorResponse`
- `ContentPage`, `FAQ`, `ContactSubmission`
- `AppSetting`

Phase 6-7 extensions:
- `VendorProfile` payout + approval review fields:
  - `payoutProvider`, `payoutAccountMasked`, `payoutConfiguredAt`
  - `reviewedById`, `reviewedAt`, `rejectionReason`
- `VendorResponse.updatedAt`
- audit attribution fields on content models:
  - `ContentPage.updatedById`
  - `FAQ.updatedById`

## Key Notes

- Public catalog supports map data with `Tour.latitude` and `Tour.longitude`.
- Booking flow uses transactional updates for capacity-safe create/cancel operations.
- Booking and payment create endpoints support idempotency keys.
- Payment webhook verifies HMAC signature when `STRIPE_WEBHOOK_SECRET` is configured.
- Reviews support client CRUD with completed-booking eligibility checks.
- Vendor/admin mutations emit audit log events with actor and target IDs.
- Health/readiness checks rely on direct DB connectivity probe (`SELECT 1`).

## Migrations

- `20260228120000_init`
- `20260301093000_add_tour_coordinates`
- `20260301110000_add_payment_idempotency`
- `20260301153000_vendor_admin_audit_fields`
- `20260301170000_add_app_settings`
