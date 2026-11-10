# Deprecation notice: Listings API v1

To: FundiLink team 
From: Nyumbahub team
Date: 10 November 2026

## Summary

v1 of `GET /listings` is deprecated. v2 is live now at `GET /v2/listings`. v1 will stop working on **Friday, 13 November 2026**. Please move before then.

## What is changing

- The list response is wrapped in a new shape: `{ "listings": [ ... ] }` becomes `{ "data": [ ... ], "count": N }`
- The array key is renamed from `listings` to `data`
- A new `count` field tells you how many items are in `data`
- Nothing else changes: the items inside (`id`, `status`, `reason`, `updatedAt`), their values, and your API key all stay the same

## Why

Our API used a different wrapper key on every list endpoint (`listings`, `bookings`), while GymBuddy already used `data`. One `{ data, count }` shape makes the API consistent and lets us add paging later without another breaking change.

## Before and after

v1 `GET /listings`

```json
{
  "listings": [
    { "id": 1, "status": "active", "reason": "New listing", "updatedAt": "2026-11-02T09:00:00Z" }
  ]
}
```

v2 `GET /v2/listings`

```json
{
  "data": [
    { "id": 1, "status": "active", "reason": "New listing", "updatedAt": "2026-11-02T09:00:00Z" }
  ],
  "count": 1
}
```

## How to migrate

1. Call `/v2/listings` instead of `/listings`. Same API key, same headers.
2. Read the array from `body.data` instead of `body.listings`.
3. Optionally use `body.count` instead of calling `.length` yourself.
4. Test it, then tell me, so I can see your calls to `GET /v2/listings` in my logs.

Tip: keep the shape in one small parser function so switching (or rolling back) is a one-line change.

## Timeline

- **Today (10 Nov):** v2 is live. v1 and the old `/listings` URL still work and now send `Deprecation`, `Sunset` and `Link` headers on every response.
- **Fri 13 Nov 2026:** v1 stops working.

## Questions

Message me any time. I will reply within 1 hour during lab. Please reply to confirm you have read this notice.