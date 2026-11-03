# NyumbaHub API & FundiLink Integration Guide

## 🌐 Live Base URL
The API is deployed and accessible 24/7 online for testing and integration:

```text
https://nyumbahub-api-gdit.onrender.com
```

- **Format:** JSON responses (`Content-Type: application/json`), except the root health check which returns plain text.
- **Authentication:** **Required.** Send your API key in the `X-API-Key` header (see [Authentication](#-authentication)). Only the health check `GET /` is public.
- **Rate limiting:** 100 requests per minute per API key (see [Rate Limiting](#-rate-limiting)).
- **Contract:** the full machine-readable API contract is in [`openapi.yaml`](./openapi.yaml).
- **Local Fallback:** `http://localhost:5000` (if running locally).

---

## 🔑 Authentication

Every endpoint except the health check (`GET /`) requires an API key in the `X-API-Key` request header.

```bash
curl -H "X-API-Key: YOUR_API_KEY" "https://nyumbahub-api-gdit.onrender.com/api/students"
```

- Keys are issued privately per consumer. Never share a key publicly or commit it to Git.
- On the server, valid keys are set in `server/.env` as a comma-separated list: `API_KEYS=key1,key2`. The real `.env` is never committed. See `server/.env.example` for the variable names.
- A missing or invalid key returns `401 Unauthorized`:

```json
{ "message": "Missing or invalid API key" }
```

> **Windows PowerShell:** use `curl.exe` instead of `curl`, because `curl` is an alias for a different command there.

## 🚦 Rate Limiting

Requests are limited **per API key** to **100 requests per minute**. Going over the limit returns `429 Too Many Requests` with a `Retry-After` header (seconds to wait) and a JSON body:

```json
{ "message": "Too many requests", "retryAfter": 42 }
```

Wait the number of seconds in `Retry-After`, then retry.

---

## ⚡ Quick Test

The health check is public, so you can open it directly in a browser:

| Endpoint | Test Link | Expected Result |
| :--- | :--- | :--- |
| **Health Check** | [GET /](https://nyumbahub-api-gdit.onrender.com/) | `"API is running"` |

A browser cannot add the `X-API-Key` header when you click a link, so every other endpoint must be called with `curl` or an API client (Postman, Thunder Client) that lets you set the header. Replace `YOUR_API_KEY` with your key:

| Endpoint | Request | Expected Result |
| :--- | :--- | :--- |
| **Available Listings** | `GET /listings?status=available&updatedSince=2026-01-01` | List of available properties |
| **Listing Location** | `GET /listings/1/location` | Area & city (`Kilimani, Nairobi`) |
| **Listing Size** | `GET /listings/1/size` | Bedrooms & bathrooms |
| **Landlord Contact** | `GET /listings/1/landlord-contact` | Landlord details (Jane Wanjiru) |
| **Refunded Bookings** | `GET /bookings?status=refunded&updatedSince=2026-01-01` | List of refunded bookings |
| **Escrow Status** | `GET /bookings/1/escrow-status` | Status (`released` or `held`) |
| **Students List** | `GET /api/students` | Array of 8 student records |
| **Gym Memberships** | `GET /api/gym/memberships` | GymBuddy membership tiers |

```bash
curl -H "X-API-Key: YOUR_API_KEY" "https://nyumbahub-api-gdit.onrender.com/listings/1/location"
```

> **Note on Render Free Tier:** If the API has not received traffic for 15 minutes, the first request may take ~30–45 seconds to spin up from sleep. Subsequent requests respond instantly.

---

## 📋 Endpoint Specification & Examples

All requests below need the `X-API-Key` header (shown in each cURL example).

### 1. Listings & Property Details

#### `GET /listings`
Retrieves listings filtered by status and update date.
- **Query Parameters:**
  - `status` (*required*): Must be `"available"`.
  - `updatedSince` (*required*): Date string in `YYYY-MM-DD` format (e.g., `2026-01-01`).
- **Example cURL:**
  ```bash
  curl -H "X-API-Key: YOUR_API_KEY" \
    "https://nyumbahub-api-gdit.onrender.com/listings?status=available&updatedSince=2026-01-01"
  ```
- **Example Response (`200 OK`):**
  ```json
  {
    "listings": [
      {
        "id": "1",
        "status": "available",
        "reason": "vacated",
        "updatedAt": "2026-09-21T22:54:06.000Z"
      },
      {
        "id": "2",
        "status": "available",
        "reason": "newly_listed",
        "updatedAt": "2026-09-21T22:54:06.000Z"
      }
    ]
  }
  ```

#### `GET /listings/:id/location`
Gets geographic area and city for a specific listing.
- **Example:** `GET https://nyumbahub-api-gdit.onrender.com/listings/1/location`
- **Response (`200 OK`):**
  ```json
  {
    "area": "Kilimani",
    "city": "Nairobi"
  }
  ```

#### `GET /listings/:id/size`
Gets room counts for a specific listing.
- **Example:** `GET https://nyumbahub-api-gdit.onrender.com/listings/1/size`
- **Response (`200 OK`):**
  ```json
  {
    "bedrooms": 2,
    "bathrooms": 1
  }
  ```

#### `GET /listings/:id/landlord-contact`
Returns landlord contact information **only if** the landlord has opted in (`opted_in = 1`).
- **Example with opt-in:** `GET https://nyumbahub-api-gdit.onrender.com/listings/1/landlord-contact`
  ```json
  {
    "available": true,
    "contact": {
      "name": "Jane Wanjiru",
      "phone": "0722000001",
      "email": "jane@example.com"
    }
  }
  ```
- **Example without opt-in (Listing 2):**
  ```json
  {
    "available": false,
    "contact": null
  }
  ```

---

### 2. Bookings & Escrow

#### `GET /bookings`
Fetches bookings with status filters.
- **Query Parameters:**
  - `status` (*required*): Must be `"refunded"`.
  - `updatedSince` (*required*): Date string in `YYYY-MM-DD` format (e.g., `2026-01-01`).
- **Example cURL:**
  ```bash
  curl -H "X-API-Key: YOUR_API_KEY" \
    "https://nyumbahub-api-gdit.onrender.com/bookings?status=refunded&updatedSince=2026-01-01"
  ```
- **Response (`200 OK`):**
  ```json
  {
    "bookings": [
      {
        "id": "1",
        "listingId": "3",
        "status": "refunded",
        "refundReasonCategory": "property_mismatch",
        "updatedAt": "2026-09-21T22:54:07.000Z"
      }
    ]
  }
  ```

#### `GET /bookings/:id/escrow-status`
Checks the escrow status of a booking.
- **Example:** `GET https://nyumbahub-api-gdit.onrender.com/bookings/1/escrow-status`
- **Response (`200 OK`):**
  ```json
  {
    "bookingId": "1",
    "escrowStatus": "released",
    "updatedAt": "2026-09-21T22:54:07.000Z"
  }
  ```

---

### 3. Student Records (`/api/students`)

#### `GET /api/students`
Lists all enrolled students.
- **Example cURL:**
  ```bash
  curl -H "X-API-Key: YOUR_API_KEY" https://nyumbahub-api-gdit.onrender.com/api/students
  ```
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "name": "David Kariuki",
      "email": "david.kariuki@strathmore.edu",
      "course": "Business Information Technology"
    },
    {
      "id": 2,
      "name": "Faith Mumbi",
      "email": "faith.mumbi@strathmore.edu",
      "course": "Computer Science"
    }
  ]
  ```

#### `POST /api/students`
Registers a new student. All three fields (`name`, `email`, `course`) are required.
- **cURL:**
  ```bash
  curl -X POST https://nyumbahub-api-gdit.onrender.com/api/students \
    -H "X-API-Key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"name":"Amina Hassan","email":"amina.hassan@strathmore.edu","course":"Computer Science"}'
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": 10,
    "name": "Amina Hassan",
    "email": "amina.hassan@strathmore.edu",
    "course": "Computer Science"
  }
  ```

#### `PUT /api/students/:id`
Updates student details by ID.
- **cURL:**
  ```bash
  curl -X PUT https://nyumbahub-api-gdit.onrender.com/api/students/1 \
    -H "X-API-Key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"name":"David Kariuki","email":"david.kariuki@strathmore.edu","course":"Software Engineering"}'
  ```
- **Response (`200 OK`):**
  ```json
  {
    "id": "1",
    "name": "David Kariuki",
    "email": "david.kariuki@strathmore.edu",
    "course": "Software Engineering"
  }
  ```

#### `DELETE /api/students/:id`
Deletes a student record.
- **cURL:**
  ```bash
  curl -X DELETE -H "X-API-Key: YOUR_API_KEY" https://nyumbahub-api-gdit.onrender.com/api/students/10
  ```
- **Response (`200 OK`):**
  ```json
  {
    "message": "Student deleted"
  }
  ```

---

### 4. GymBuddy Partner Amenity

#### `GET /api/gym/memberships`
Returns GymBuddy membership tiers. The backend calls the GymBuddy partner API and returns only the agreed contract fields `tier`, `price` and `details`; any other field the partner sends is dropped.
- **Example cURL:**
  ```bash
  curl -H "X-API-Key: YOUR_API_KEY" https://nyumbahub-api-gdit.onrender.com/api/gym/memberships
  ```
- **Response (`200 OK`):**
  ```json
  [
    {
      "tier": "Daily Drop-In",
      "price": "500 KES",
      "details": "Full facility access for 24 hours."
    },
    {
      "tier": "Monthly Standard",
      "price": "5,000 KES",
      "details": "Unlimited access + GymBuddy App."
    }
  ]
  ```
- **If the partner is down or returns an error (`502 Bad Gateway`):**
  ```json
  { "message": "Partner data unavailable" }
  ```

---

## 💻 Frontend Code Snippet (JavaScript / React / FundiLink Integration)

Here is a ready-to-copy code snippet for the FundiLink app to consume listings. Every request sends the `X-API-Key` header:

```javascript
const BASE_URL = 'https://nyumbahub-api-gdit.onrender.com';
const API_KEY = 'YOUR_API_KEY'; // issued to you privately; do not commit a real key
const headers = { 'X-API-Key': API_KEY };

// Fetch available listings
async function getAvailableListings() {
  try {
    const response = await fetch(`${BASE_URL}/listings?status=available&updatedSince=2026-01-01`, { headers });
    if (response.status === 401) throw new Error('Missing or invalid API key');
    if (response.status === 429) throw new Error('Rate limit reached, retry after a moment');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    console.log('Listings received:', data.listings);
    return data.listings;
  } catch (error) {
    console.error('Failed to fetch listings:', error);
  }
}

// Fetch details for a listing
async function getListingDetails(listingId) {
  try {
    const [locationRes, sizeRes, contactRes] = await Promise.all([
      fetch(`${BASE_URL}/listings/${listingId}/location`, { headers }),
      fetch(`${BASE_URL}/listings/${listingId}/size`, { headers }),
      fetch(`${BASE_URL}/listings/${listingId}/landlord-contact`, { headers })
    ]);

    const location = await locationRes.json();
    const size = await sizeRes.json();
    const contact = await contactRes.json();

    return { location, size, contact };
  } catch (error) {
    console.error(`Failed to fetch details for listing ${listingId}:`, error);
  }
}
```

> **Security note:** a key placed in browser code is visible to anyone who opens the browser's developer tools. For a public website, use a key you can revoke, or call the API from your own backend and keep the key on the server.

---

## ⚠️ Error Handling Contract

Failed requests return an HTTP status with a JSON error payload:

| Error Case | Status | Response Body |
| :--- | :--- | :--- |
| Missing or invalid API key | `401 Unauthorized` | `{"message": "Missing or invalid API key"}` |
| Rate limit exceeded | `429 Too Many Requests` | `{"message": "Too many requests", "retryAfter": 42}` (plus `Retry-After` header) |
| Missing query param in `/listings` | `400 Bad Request` | `{"code": "invalid_query_param", "message": "status and updatedSince are required query parameters"}` |
| Invalid query param value | `400 Bad Request` | `{"code": "invalid_query_param", "message": "status must be \"available\""}` |
| Listing not found | `404 Not Found` | `{"code": "listing_not_found", "message": "No listing with id 999"}` |
| Booking not found | `404 Not Found` | `{"code": "booking_not_found", "message": "No booking with id 999"}` |
| Missing fields in student create | `400 Bad Request` | `{"error": "name, email, and course are required"}` |
| GymBuddy partner unavailable | `502 Bad Gateway` | `{"message": "Partner data unavailable"}` |

> Error bodies currently come in three shapes: `{ message }` (auth, rate limit, partner), `{ code, message }` (listings and bookings) and `{ error }` (students). All three are documented in `openapi.yaml`.

---

## 🧪 Automated Regression Tests

The tests use Node's built-in test runner, so there is nothing extra to install. From the project root:

```bash
node --test server/tests/api.test.js
```

They start the real server on spare ports with throw-away keys and a mock GymBuddy partner, so they need no real keys and do not touch the database. They cover:

- **Authentication:** public health check, `401` for a missing, wrong or misplaced key, and protected write routes.
- **Input validation:** required query parameters and request fields return `400`.
- **GymBuddy:** `200` with only `tier`, `price` and `details`; `502` when the partner errors or is unreachable.
- **Rate limiting (optional):** a burst on one key returns `429` while a different key is unaffected.

The rate-limit test is skipped by default. To run it (PowerShell):

```powershell
$env:RUN_RATE_LIMIT_TEST=1; node --test server/tests/api.test.js
Remove-Item Env:RUN_RATE_LIMIT_TEST
```

## 📝 Known Limitations

- `PUT /api/students/:id` does not validate its request body.
- `PUT` and `DELETE` on `/api/students/:id` return `200` even when the id does not exist.

---

## 🛠️ Running Locally (Optional)

If you need to develop or run this repository on your local machine:

```bash
git clone https://github.com/Alvin425770/api_intergration.git
cd api_intergration/server
npm install
```

Configure `server/.env` (copy `server/.env.example` and fill in real values; never commit this file):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=students_db
DB_PORT=3306
PORT=5000
PARTNER_URL=https://partner-api-url.example.com
API_KEYS=team_key_sample,partner_key_sample
```

Load sample data:
```bash
mysql -u root -p -e "source schema.sql"
```

Start dev server:
```bash
npm start
```
Server runs at `http://localhost:5000`.