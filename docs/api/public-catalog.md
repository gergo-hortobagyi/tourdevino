# Public Catalog API (Phase 3)

Base prefix: `/api`

Response envelope:

```json
{ "data": {}, "meta": {} }
```

Errors use normalized shape:

```json
{
  "data": null,
  "error": {
    "code": "TOUR_NOT_FOUND",
    "message": "Tour not found"
  }
}
```

## Tours

- `GET /tours`
  - Query: `query`, `region`, `priceMin`, `priceMax`, `ratingMin`, `duration`, `sort`, `page`, `pageSize`
  - Returns paginated active tours with rating summary and optional map coordinates.
- `GET /tours/map`
  - Query: `region`, `lat`, `lng`, `radiusKm`
  - Returns active tours with coordinates for map markers.
- `GET /tours/:id`
  - `:id` accepts tour ID or slug.
  - Returns full detail, media, upcoming availability, and recent reviews summary.
- `GET /tours/:id/availability`
  - Returns date slots with `availableSpots`.

## Reviews (Public Read)

- `GET /tours/:id/reviews`
  - `:id` accepts tour ID or slug.
  - Returns review list + `meta.total`.

## Content

- `GET /content/:slug`
  - Public static page by slug.
- `GET /faq`
  - Returns published FAQ entries ordered by `sortOrder`.
- `POST /contact`
  - Body: `name`, `email`, `message`
  - Rate-limited and persisted to `ContactSubmission`.
