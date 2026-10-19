# NyumbaHub API

## Overview

NyumbaHub is a house-hunting platform for Kenya. This REST API serves property listings, booking and escrow status, landlord contact details and student records to the NyumbaHub web app. It is for developers building or testing against NyumbaHub: frontend contributors, API testers and anyone integrating with listing or booking data.

- **Base URL (local):** `http://localhost:5000`
- **Format:** responses are JSON, except the health check, which is plain text. Send request bodies as JSON with `Content-Type: application/json`.
- **Full reference docs:** open `docs/index.html` in a browser.

## Quickstart (one command)

Make sure the API is running (see [Run it locally](#run-it-locally)),:
commands:
cd server
node index.js

then open a second terminal and run:

```
curl "http://localhost:5000/listings?status=available&updatedSince=2026-01-01"
```

> **Windows PowerShell users:** type `curl.exe` instead of `curl` (plain `curl` is a different command in PowerShell). Do this for every example below.

You should get back `200` and:

```json
{
  "listings": [
    { "id": "1", "status": "available", "reason": "vacated", "updatedAt": "2026-09-21T19:54:06.000Z" },
    { "id": "2", "status": "available", "reason": "newly_listed", "updatedAt": "2026-09-21T19:54:06.000Z" }
  ]
}
```

Those two listings are sample data from `server/schema.sql`. Timestamps are produced from your machine's timezone, so the hour may differ on your computer.

## Authentication

None yet. You do **not** need a token or API key: send requests exactly as shown below. Real authentication is planned for Week 9; this section will change then.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/listings` | Available listings updated since a date |
| GET | `/listings/{id}/landlord-contact` | Landlord contact (only if opted in) |
| GET | `/listings/{id}/location` | Area and city |
| GET | `/listings/{id}/size` | Bedrooms and bathrooms |
| GET | `/bookings` | Refunded bookings updated since a date |
| GET | `/bookings/{id}/escrow-status` | Escrow status of a booking |
| GET | `/api/students` | List students |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/{id}` | Update a student |
| DELETE | `/api/students/{id}` | Delete a student |

Note that student routes start with `/api`, but listings and bookings do not.

### Health check: `GET /`

```
curl http://localhost:5000/
```

Response `200` (plain text):

```
API is running
```

### List available listings: `GET /listings`

Both query parameters are required. `status` must be exactly `available`. `updatedSince` is a date such as `2026-01-01`; listings updated on or after it are returned. `reason` is `vacated` if the listing was previously rented, otherwise `newly_listed`.

```
curl "http://localhost:5000/listings?status=available&updatedSince=2026-01-01"
```

Response `200`: see the quickstart above.

### Get landlord contact: `GET /listings/{id}/landlord-contact`

Returns contact details only if the landlord has opted in.

```
curl http://localhost:5000/listings/1/landlord-contact
```

Response `200`:

```json
{
  "available": true,
  "contact": { "name": "Jane Wanjiru", "phone": "0722000001", "email": "jane@example.com" }
}
```

If the landlord has not opted in (try listing `2`), you still get `200`:

```json
{ "available": false, "contact": null }
```

### Get listing location: `GET /listings/{id}/location`

```
curl http://localhost:5000/listings/1/location
```

Response `200`:

```json
{ "area": "Kilimani", "city": "Nairobi" }
```

### Get listing size: `GET /listings/{id}/size`

```
curl http://localhost:5000/listings/1/size
```

Response `200`:

```json
{ "bedrooms": 2, "bathrooms": 1 }
```

### List refunded bookings: `GET /bookings`

Both query parameters are required. `status` must be exactly `refunded`.

```
curl "http://localhost:5000/bookings?status=refunded&updatedSince=2026-01-01"
```

Response `200`:

```json
{
  "bookings": [
    {
      "id": "1",
      "listingId": "3",
      "status": "refunded",
      "refundReasonCategory": "property_mismatch",
      "updatedAt": "2026-09-21T19:54:07.000Z"
    }
  ]
}
```

### Get booking escrow status: `GET /bookings/{id}/escrow-status`

```
curl http://localhost:5000/bookings/1/escrow-status
```

Response `200`:

```json
{ "bookingId": "1", "escrowStatus": "released", "updatedAt": "2026-09-21T19:54:07.000Z" }
```

Booking `2` returns `"escrowStatus": "held"`.

> Payments and escrow are simulated in NyumbaHub. These endpoints only read stored records; they do not move money.

### List students: `GET /api/students`

```
curl http://localhost:5000/api/students
```

Response `200`: a plain array (not wrapped in an object). The sample data has 8 students; the first two are:

```json
[
  { "id": 1, "name": "David Kariuki", "email": "david.kariuki@strathmore.edu", "course": "Business Information Technology" },
  { "id": 2, "name": "Faith Mumbi", "email": "faith.mumbi@strathmore.edu", "course": "Computer Science" }
]
```

### Create a student: `POST /api/students`

Body fields `name`, `email` and `course` are all required.

macOS, Linux or Command Prompt:

```
curl -X POST http://localhost:5000/api/students -H "Content-Type: application/json" -d "{\"name\":\"Amina Hassan\",\"email\":\"amina.hassan@strathmore.edu\",\"course\":\"Computer Science\"}"
```

Windows PowerShell (PowerShell mangles quotes inside `curl.exe` bodies, so use this instead):

```
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/students -ContentType "application/json" -Body '{"name":"Amina Hassan","email":"amina.hassan@strathmore.edu","course":"Computer Science"}' | ConvertTo-Json
```

Response `201 Created`:

```json
{ "id": 10, "name": "Amina Hassan", "email": "amina.hassan@strathmore.edu", "course": "Computer Science" }
```

Save the `id`; yours may differ if you have created students before.

### Update a student: `PUT /api/students/{id}`

Send all three fields. Replace `10` with the `id` you just got.

macOS, Linux or Command Prompt:

```
curl -X PUT http://localhost:5000/api/students/10 -H "Content-Type: application/json" -d "{\"name\":\"Amina Hassan\",\"email\":\"amina.hassan@strathmore.edu\",\"course\":\"Software Engineering\"}"
```

Windows PowerShell:

```
Invoke-RestMethod -Method Put -Uri http://localhost:5000/api/students/10 -ContentType "application/json" -Body '{"name":"Amina Hassan","email":"amina.hassan@strathmore.edu","course":"Software Engineering"}' | ConvertTo-Json
```

Response `200`:

```json
{ "id": "10", "name": "Amina Hassan", "email": "amina.hassan@strathmore.edu", "course": "Software Engineering" }
```

The `id` comes back as a string here. This route does not check that the student exists: updating an `id` that does not exist still returns `200` and changes nothing.

### Delete a student: `DELETE /api/students/{id}`

```
curl -X DELETE http://localhost:5000/api/students/10
```

Response `200`:

```json
{ "message": "Student deleted" }
```

Use the `id` you got from the create call (replace `10` if yours was different). Deleting an `id` that does not exist also returns `200` with this same message.

## Errors

Failed requests return an HTTP error status plus a small JSON body. There are **two shapes**, depending on which part of the API you called.

| Part of the API | Body shape |
|---|---|
| `/listings`, `/bookings` | `{ "code": "...", "message": "..." }` |
| `/api/students` | `{ "error": "..." }` |

Real examples:

`GET /listings?status=available` (missing `updatedSince`) → `400`
```json
{ "code": "invalid_query_param", "message": "status and updatedSince are required query parameters" }
```

`GET /listings?status=rented&updatedSince=2026-01-01` → `400`
```json
{ "code": "invalid_query_param", "message": "status must be \"available\"" }
```

`GET /bookings?status=confirmed&updatedSince=2026-01-01` → `400`
```json
{ "code": "invalid_query_param", "message": "status must be \"refunded\"" }
```

`GET /listings/9999/location` (also `/size` and `/landlord-contact`) → `404`
```json
{ "code": "listing_not_found", "message": "No listing with id 9999" }
```

`GET /bookings/9999/escrow-status` → `404`
```json
{ "code": "booking_not_found", "message": "No booking with id 9999" }
```

`POST /api/students` with a missing field → `400`
```json
{ "error": "name, email, and course are required" }
```

`GET /listings?status=available&updatedSince=banana` (a value that is not a date) → `500`
```json
{ "code": "internal_error", "message": "Failed to fetch listings" }
```

A request body that is not valid JSON (usually a shell quoting problem) → `400` with an **HTML error page**, not JSON. If you see HTML instead of JSON, check your quotes; in PowerShell use the `Invoke-RestMethod` examples above.

Any unexpected database failure returns `500` (for example `{ "code": "internal_error", "message": "Failed to fetch listings" }`). If you see a `500` on every request, check your database settings in `server/.env`.

## Run it locally

You need:

1. **Node.js 18 or newer** (check with `node -v`).
2. **MySQL 8** (or MariaDB, as bundled with XAMPP) running on port 3306.
3. **Git.**

Run these commands one at a time:

```
git clone https://github.com/Alvin425770/api_intergration.git
cd api_intergration/server
npm install
```

Create your settings file by copying the example, then open `.env` and put in your own MySQL password:

```
copy .env.example .env      (Windows)
cp .env.example .env        (macOS / Linux)
```

Create the database and load the sample data in one step (enter your MySQL password when asked):

```
mysql -u root -p -e "source schema.sql"
```

(This form works in Command Prompt, PowerShell and macOS/Linux terminals. The shorter `mysql -u root -p < schema.sql` does not work in PowerShell.)

Start the API:

```
npm run dev
```

Leave that terminal open. Then check it is alive: open <http://localhost:5000/> in a browser. You should see `API is running`. Then run the quickstart command above.

Re-run the `schema.sql` import any time to reset the sample data. `npm start` also works if you do not want auto-restart.

Settings in `server/.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (use `students_db`), `DB_PORT` (usually `3306`) and optionally `PORT` (the API port, default `5000`).

## Limitations

This is an initial backend. Server-side authentication, real M-Pesa (Daraja) payments, server-enforced escrow, and endpoints to create or change listings and bookings are not implemented yet.
