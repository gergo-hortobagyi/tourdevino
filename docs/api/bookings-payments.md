# Booking and Payments API (Phase 4)

Base prefix: `/api`

All booking/payment routes below require bearer auth except webhook.

## Idempotency

- `POST /bookings` supports `idempotency-key` header (or body fallback) and returns the original booking for repeated same payload.
- `POST /payments/intents` supports `idempotency-key` header (or body fallback) and returns the original payment intent for repeated same payload.
- Reusing an idempotency key with a different payload returns conflict.

## Bookings (Client)

- `POST /bookings`
  - Body: `tourId`, `scheduledAt`, `guestCount`, `specialRequests?`
  - Enforces active tour + availability + capacity checks.
  - Transactional write:
    - booking (`PENDING_PAYMENT`),
    - status history insert,
    - availability `bookedCount` increment.
- `GET /bookings/me`
  - Returns current user bookings with tour summary and cancellation policy flags:
    - `canCancel`,
    - `cancellationPolicyHours`,
    - `cancellationReason`.
- `GET /bookings/:id`
  - Ownership-checked booking detail.
- `PATCH /bookings/:id/cancel`
  - Ownership-checked cancellation.
  - Enforces cancellation policy window (`CANCELLATION_WINDOW_HOURS`, default `24`).
  - Transactional write:
    - status update,
    - status history insert,
    - availability `bookedCount` decrement.

## Payments

- `POST /payments/intents`
  - Body: `bookingId`, `idempotencyKey?`
  - Creates provider intent scaffold record (`provider: stripe`) and returns
    `paymentStatus`, `providerRef`, `amount`, `currency`, `updatedAt`.
- `GET /payments/:bookingId/status`
  - Ownership-checked payment status by booking.
- `POST /payments/webhooks/stripe`
  - Body: `providerRef`, `status` (`succeeded|failed`)
  - Signature header required when `STRIPE_WEBHOOK_SECRET` is set:
    - `stripe-signature: sha256=<hex>`
    - locally supports deterministic HMAC SHA256 over raw request body.
  - Reconciles payment + booking statuses.
- `POST /payments/:bookingId/simulate`
  - Authenticated local/dev helper to simulate provider outcome (`succeeded|failed`) and exercise fail/retry UX.

## Notes

- Webhook hardening is enabled via HMAC signature verification for local constraints.
- Refund/admin payment endpoints remain for a later phase.
