# Versioning Notes

## 1. The change

`GET /listings` will return `{ "data": [ ... ], "count": N }` instead of `{ "listings": [ ... ] }`. The items inside (`id`, `status`, `reason`, `updatedAt`) do not change.

## 2. Why it is worth a break

Our API uses a different wrapper key on every list endpoint (`listings`, `bookings`), while the GymBuddy endpoint already uses `data`. Moving to one `{ data, count }` shape makes the API consistent and lets us add paging later without another breaking change.

## 3. Prediction

Our partner FundiLink calls `GET /listings`. I have asked them for the file and the exact line, and will fill it in when they reply (pending).

Expected failure: any code that reads the `listings` key from the response, such as `body.listings` or `const { listings } = await res.json()`. After the change that key no longer exists, so the value is `undefined` and the next step (`.map` or `.filter`) throws.