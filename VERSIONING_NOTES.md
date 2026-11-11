# Versioning Notes

## 1. The change

`GET /listings` will return `{ "data": [ ... ], "count": N }` instead of `{ "listings": [ ... ] }`. The items inside (`id`, `status`, `reason`, `updatedAt`) do not change.

## 2. Why it is worth a break

Our API uses a different wrapper key on every list endpoint (`listings`, `bookings`), while the GymBuddy endpoint already uses `data`. Moving to one `{ data, count }` shape makes the API consistent and lets us add paging later without another breaking change.

## 3. Prediction

Our partner FundiLink calls `GET /listings` in `server/routes/partner.js` (route `GET /partner/vacant-homes`). The line that will fail is:

`listings = ver.parseList(body);`

Their v1 `parseList` (in `partnerVersions.js`) reads the `listings` key from our response. After the change that key no longer exists, so the parser throws. Their route catches it, logs `partner call failed`, and shows saved data marked `stale: true` (or a 502 if nothing is saved), so the page keeps working but quietly shows old data.