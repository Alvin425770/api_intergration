# SECURITY_AUDIT.md

## 1. Sensitive fields

**What I looked at:** the JSON returned by every GET, POST, PUT and DELETE route across `/listings`, `/bookings`, `/api/students`, and `/api/gym/memberships`.

**How to check [VERIFY]:**
```bash
curl -s -H "X-API-Key: <your-api-key>" "http://localhost:5000/listings?status=available&updatedSince=2026-01-01"
curl -s -H "X-API-Key: <your-api-key>" http://localhost:5000/api/students
curl -s -H "X-API-Key: <your-api-key>" http://localhost:5000/api/gym/memberships
```
Look for: `password`, `passwordHash`, `token`, `email`, `isAdmin`, `createdBy`, or any internal column the consumer's app does not need.

**What I found:** 
- `/listings` and `/bookings` build responses from explicit fields rather than returning raw database rows. Booking responses include refund reason and escrow status.
- `/listings/:id/landlord-contact` returns a landlord's name, phone, and email only when `opted_in` is true; these are personal contact details and must only be shared under that consent and the API's intended partner access.
- `/api/students` returns student IDs, names, email addresses, and courses. Email is personal information; the current endpoint contract exposes it to every valid API-key holder. Do not issue keys to callers that do not need student data.
- GymBuddy membership fields are explicitly mapped to `tier`, `price`, and `details`.
- No password hashes, tokens, or administrative flags are part of the current response schemas.

**Fix (if needed):** Stop returning raw database rows. Build each response from an explicit field list:
```js
// Before: leaks the whole row
res.json(row);
// After: only what openapi.yaml promises
res.json({ id: row.id, name: row.name });
```

---

## 2. Other people's data

**What I looked at:** whether changing an ID in the URL returns a record the caller should not see (IDOR - Insecure Direct Object References).

**How to check [VERIFY]:**
```bash
curl -i -H "X-API-Key: <your-api-key>" http://localhost:5000/listings/1/location
curl -i -H "X-API-Key: <your-api-key>" http://localhost:5000/listings/2/location
curl -i -H "X-API-Key: <your-api-key>" http://localhost:5000/listings/999999/location
```
Also confirm that every route that takes an ID uses a **parameterized query** (`WHERE id = ?` with the value passed separately), never string concatenation.

**What I found:** 
- Every database query in `students.js`, `listings.js`, and `bookings.js` uses parameterized SQL queries (`?` placeholders with parameter arrays). SQL injection via URL parameters is completely mitigated.
- Non-existent IDs (e.g., `999999`) cleanly return `404 Not Found` with structured JSON error codes (`listing_not_found`, `booking_not_found`).
- **Access-control limitation:** API keys identify consumers but do not grant different permissions or scope records. Any valid key can read the exposed listings, opted-in landlord contact details, booking data, and student records, and can call the student write endpoints. There is no tenant/owner relationship check for IDs. This is acceptable only if all issued consumers are trusted to access this shared dataset; it is not per-user or per-record authorization. Add scoped roles and ownership checks before using this API for tenant-private records.

---

## 3. Error messages

**What I looked at:** responses to bad input, missing records, malformed JSON, and database failures.

**How to check [VERIFY]:**
```bash
curl -i -H "X-API-Key: <your-api-key>" http://localhost:5000/listings/abc/location
curl -i -H "X-API-Key: <your-api-key>" http://localhost:5000/listings/999999/location
curl -i -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{bad json' http://localhost:5000/api/students
curl -i http://localhost:5000/does-not-exist
```
Look for: stack traces, file paths (`/home/...`), SQL text, table or column names, database hostnames.

**What I found:** 
- Route handlers return clean JSON error messages (e.g., `{"code":"invalid_query_param","message":"status and updatedSince are required query parameters"}`) without leaking stack traces or SQL error text.
- Before this audit, malformed JSON used Express's default error handler, which could return HTML and a stack trace in development. It is now handled with a sanitized JSON `400`; unknown routes return a generic JSON `404`.
- API-key validation now runs before JSON body parsing, so malformed unauthenticated requests are rejected with `401` before the body is processed.
- Database route failures return generic JSON messages. Server logs now record the operation and database error code/name instead of dumping the raw database error (which can include SQL details or values). The final Express error handler logs only a status and error type and does not send stack traces, SQL, file paths, or request contents to clients.

**Fix applied:** a final error handler returns sanitized JSON and logs only safe error identifiers:
```js
// Malformed JSON -> 400; unexpected parser/runtime errors -> generic 500.
```

---

## 4. Write endpoints and extra fields

**What I looked at:** whether a caller can send fields the API never offered (such as `id`, `isAdmin`, `createdAt`) and have them saved (Mass Assignment vulnerability).

**How to check [VERIFY]:**
```bash
curl -i -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" \
  -d '{"name":"Audit Test","email":"audit@test.com","course":"CS","id":9999,"isAdmin":true}' \
  http://localhost:5000/api/students
```
If record 9999 exists, or `isAdmin` was stored, the endpoint is vulnerable.

**What I found:** 
- In `POST /api/students` and `PUT /api/students/:id`, the route uses explicit object destructuring:
  ```js
  const { name, email, course } = req.body;
  ```
- Any extra fields supplied by an attacker (like `isAdmin`, `id`, `role`, or `timestamp`) are completely ignored and never passed to the SQL `INSERT` or `UPDATE` queries. The database auto-generates IDs, preventing caller-supplied ID spoofing.

---

## 5. Keys in the wrong place

**What I looked at:** the `.env` file, and where keys could end up (git history, console logs, README).

**Checked from local configuration (values are not recorded here):**

| Item | Result |
|------|--------|
| API keys hard-coded in auth middleware | No; it reads `API_KEYS` from the process environment |
| `server/.env` present in this checkout | No; configure deployment/local server environment separately |
| Local Vite `.env.local` | Ignored by Git; contains a local development proxy key only |
| Current key count, strength, and partner URL | Not reverified; no `server/.env` is present in this checkout |

**Checked in repository & history [VERIFY]:**
```bash
git check-ignore .env.local server/.env      # confirm local credential files are ignored
git ls-files .env server/.env .env.local     # confirm they are not currently tracked
git log --all --oneline -- .env server/.env  # inspect credential-file history; never copy values into the audit
grep -rn "X-API-Key" README.md openapi.yaml  # placeholders only (<your-api-key>)
```

**What I found:** 
- `.gitignore` properly includes `.env` and `server/.env`.
- `.env.local` and `server/.env` are ignored, and neither is tracked in the current checkout.
- Git history does contain an older `server/.env`. A value-safe inspection found only local database settings and a placeholder database password; no `API_KEYS` or `PARTNER_API_KEY` entries were present in that historical file. The file is absent from the current checkout.
- `server/.env.example` contains only placeholder values (`API_KEYS=key1,key2`, `DB_PASSWORD=your_mysql_password`).
- Documentation files (`README.md`, `openapi.yaml`) use placeholder `<your-api-key>` values and never expose live credentials.
- API-key authentication and rate-limit middleware do not log the supplied API-key header.

---

## Authentication and rate limiting (supporting evidence)

| Test | Expected | Actual |
|------|----------|--------|
| No key: `curl -i http://localhost:5000/listings` | 401 | `HTTP/1.1 401 Unauthorized` (`{"message":"Missing or invalid API key"}`) |
| Wrong key: `-H "X-API-Key: wrong-key"` | 401 | `HTTP/1.1 401 Unauthorized` (`{"message":"Missing or invalid API key"}`) |
| Valid key: `-H "X-API-Key: <valid-key>"` | 200 | `HTTP/1.1 200 OK` (returns JSON payload) |
| 5 requests with limit set to 3 | `200 200 200 429 429` | `200 200 200 429 429` (Throttled on 4th & 5th request) |
| 429 has `Retry-After` header and JSON body | Yes | `Retry-After: 60`, `{"message":"Too many requests","retryAfter":60}` |

**Rate limit threshold:** 100 requests per minute per key.
**Why:** A normal client application (page navigation, loading listings, checking status) makes fewer than 30 calls per minute under normal interactive use. Setting the limit at 100 per minute accommodates peak browsing while immediately cutting off infinite loops, rapid scraping, and brute-force attempts. Tracking is keyed on `req.apiKey` (falling back to `req.ip`), ensuring one noisy consumer cannot starve another.
**Known limit:** The in-memory limiter resets upon server restart and does not share state across horizontally scaled instances. A distributed store (such as Redis) would be used in multi-instance production.

---

## Issues found & Mitigations

| # | Issue | Severity | Status | Mitigation |
|---|-------|----------|--------|------------|
| 1 | Raw DB rows in student endpoint | Low | Fixed | Mapped returned student rows explicitly to contract fields (`id`, `name`, `email`, `course`). |
| 2 | Missing API authentication | High | Fixed | Implemented `requireApiKey` middleware validating `X-API-Key` before all routes. |
| 3 | Unbounded requests / loop risk | High | Fixed | Implemented `rateLimiter` (100 req/min) returning HTTP 429 with `Retry-After` header. |
| 4 | Potential credential leakage | Critical | Fixed | Enforced `.env` in `.gitignore`, committed `.env.example` with placeholders only. |
| 5 | Downstream partner key sharing | Medium | Completed | Generated distinct 24-byte crypto keys; transmitted partner key privately via DM. |
| 6 | API keys do not scope access to individual records or read/write permissions | Medium | Open | Recorded as an access-model limitation; implement per-consumer scopes and ownership checks before using private multi-tenant data. |
| 7 | Default malformed-JSON errors could include HTML/stack details in development | Low | Fixed | Authenticate before parsing; return sanitized JSON errors and generic JSON 404 responses. |
| 8 | Raw database errors could include SQL details or bound values in server logs | Low | Fixed | Log operation plus database error code/name instead of dumping the raw error object. |

---

## Fixes made checklist

| # | Fix | Done |
|---|-----|------|
| 1 | Generated distinct 24-byte hex API keys for team and ring partner (`node crypto.randomBytes`) | [x] |
| 2 | Confirmed `.env` is listed in `.gitignore` and does not appear in `git status` or git history | [x] |
| 3 | Added `.env.example` with placeholder values only (`API_KEYS=key1,key2`) | [x] |
| 4 | Enforced API key verification (`X-API-Key`) across all endpoints with 401 rejection | [x] |
| 5 | Enforced rate limiting (100 req/min) with HTTP 429 and `Retry-After` header | [x] |
| 6 | Verified error responses return structured JSON without stack traces or SQL errors | [x] |
| 7 | Verified write endpoints (`POST`/`PUT`) strictly whitelist allowed input attributes | [x] |
| 8 | Updated OpenAPI contract and README with security schemes, 401 & 429 response definitions | [x] |
| 9 | Confirmed full test suite passes with auth coverage | [x] |

---

## Remaining risks & Architecture Notes

- **Single access level and shared records:** Any valid API key can access the shared API dataset and student write endpoints. Do not use this model for tenant-private records; implement per-consumer permissions and record ownership checks first.
- **Personal information:** Student email addresses and opted-in landlord contact details are exposed by the documented API contract. Issue keys only to trusted consumers with a need for these fields, and review retention/sharing obligations.
- **In-memory store:** Rate limiter resets on process restart. Production deployments should back this with Redis or Memcached.
- **Key lifecycle:** API keys are static without automatic expiration; revocation requires updating the environment variable.
