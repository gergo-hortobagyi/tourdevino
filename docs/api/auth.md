# Auth API (Phase 1)

Base prefix: `/api`
Response envelope for success:

```json
{ "data": { "...": "..." } }
```

Error envelope:

```json
{
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials",
    "details": []
  }
}
```

## Endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Rate limits

- Signup: 8 req/min
- Login: 30 req/min
- Refresh: 20 req/min
- Forgot/reset password: 5 req/min

## Auth matrix

- `GET /auth/me` requires bearer access token.
- Refresh token rotation enforced on each `/auth/refresh` call.
- Logout invalidates the provided refresh token.
