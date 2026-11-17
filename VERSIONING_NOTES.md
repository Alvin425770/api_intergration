# Versioning Notes

## 1. The change

`GET /v2/listings` returns `{ "data": [ ... ], "count": N }` instead of the v1 `{ "listings": [ ... ] }` wrapper. `GET /listings` and `GET /v1/listings` retain the old shape. The items inside (`id`, `status`, `reason`, `updatedAt`) do not change.

## 2. Why it is worth a break

Our API uses a different wrapper key on every list endpoint (`listings`, `bookings`), while the GymBuddy endpoint already uses `data`. Moving to one `{ data, count }` shape makes the API consistent and lets us add paging later without another breaking change.

## 3. Prediction

Our partner FundiLink calls `GET /listings` in `server/routes/partner.js` (route `GET /partner/vacant-homes`). The line that will fail is:

`listings = ver.parseList(body);`

Their v1 `parseList` (in `partnerVersions.js`) reads the `listings` key from our response. After the change that key no longer exists, so the parser throws. Their route catches it, logs `partner call failed`, and shows saved data marked `stale: true` (or a 502 if nothing is saved), so the page keeps working but quietly shows old data.

## 4. Proof that v1 did not change

On 13 November 2026, `server/scripts/diff-v1.js` fetched the live v1 response and wrote `v1_after.json`. The script printed `v1 unchanged`, and `diff -u v1_before.json v1_after.json` printed nothing. The version tests also pin the old item fields, complete error body, legacy-route parity, deprecation headers, and v2 authentication.

## 5. Receiving GymBuddy's notice

GymBuddy's notice was clear about the new `{ data, count }` wrapper, the `price` to `rate` rename, the reason, and the 13 November sunset. However, it did not contain a complete after example or migration steps. An authenticated manual check on 13 November returned HTTP 200 from `/memberships` but HTTP 404 from `/v2/memberships`; v1 also had no deprecation headers. For this lab demonstration we deliberately remain on GymBuddy v1 because its v2 is being used to simulate a faulty upstream change. We do not claim a successful partner-v2 migration.

## 6. Who still uses v1

A fresh local `/stats` capture on 13 November recorded two successful `GET /v1/listings/` calls from our anonymized verification caller `key-d70ac0`. There were no rows for `GET /listings/` or `GET /v2/listings/` at that point. No FundiLink traffic appeared in this fresh local capture, so it is not evidence that all downstream consumers have migrated. We cannot safely switch v1 off based on this sample and will keep it running through Demo Day.

## 7. Reflection

Receiving GymBuddy's breaking change was uncomfortable because our page could continue looking healthy by serving saved memberships. We first read the notice and compared its v1 example with our parser, then used authenticated curl requests instead of changing code immediately. That showed the old endpoint still returned 200, while the expected v2 URL returned 404. The notice did well by identifying the wrapper and price-to-rate rename, giving a reason and a sunset date. It was missing a complete v2 example, exact migration path, and working successor URL. For this demonstration we deliberately kept the integration on v1 because v2 is being used to simulate an upstream failure; we do not claim a successful v2 migration.

Reading our own notice as FundiLink, we would make the examples match real `available` and `vacated` values and state the required query parameters beside the new URL. We would also verify that our Sunset header and notice agree before sending it. As API owners next time, we would test the successor URL and headers from the consumer's machine before announcing that v2 is live, then ask for an acknowledgement and a stats line proving the migration.