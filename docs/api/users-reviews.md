# Users and Reviews API (Phase 5 Partial)

Base prefix: `/api`

## Users (Client)

- `GET /users/me`
  - Returns persisted profile data.
- `PATCH /users/me`
  - Body: editable profile fields (`firstName`, `lastName`).
  - Returns updated profile.

## Reviews

Public:
- `GET /tours/:id/reviews`

Client:
- `GET /reviews/me`
- `POST /reviews`
  - Body: `tourId`, `bookingId`, `rating`, `comment?`
  - Eligibility rules:
    - booking must belong to current user,
    - booking must match `tourId`,
    - booking status must be `COMPLETED`,
    - one review per booking.
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`
