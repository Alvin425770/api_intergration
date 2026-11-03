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
- `/listings` and `/bookings` endpoints explicitly build Data Transfer Objects (DTOs) with whitelisted fields and do not expose raw database tables.
- `/listings/:id/landlord-contact` checks the `opted_in` flag and only returns landlord contact details when opted-in (`available: true`).
- `/api/students` originally used `SELECT * FROM students` and returned raw rows. We audited this and ensured only contracted fields (`id`, `name`, `email`, `course`) are transmitted.
- No password hashes, tokens, or private administrative flags are present in any API responses.

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
- **Access model note:** This API uses server-to-server API Key authentication with a unified access tier (no multi-tenant user accounts). Any caller with a valid API key has permission to query published listings and student records.

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
- Missing routes return standard 404 responses.
- Database connection catch blocks log detailed errors to server console/logs via `console.error(err)` while returning safe, sanitized messages (`500 {"error": "Failed to fetch students"}` or `502 {"message": "Partner data unavailable"}`). No database connection strings or internal paths are leaked to the client.

**Fix (if needed):** add a final error handler that logs details server-side only:
```js
app.use((err, req, res, next) => {
  console.error(err);                       // full detail stays in server logs
  res.status(500).json({ message: 'Internal server error' });
});
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

**Checked from the `.env` file:**

| Item | Result |
|------|--------|
| API keys stored in environment, not source code | Yes (`API_KEYS`) |
| One key per consumer | Yes: 2 distinct keys (ring partner and own team) |
| Key strength | Good: 48 hex characters each (24 random bytes, matches the handout's generator) |
| Partner URL uses HTTPS | Yes (`https://webapp-production-36f4.up.railway.app`) |
| Database credentials in `.env` | Yes: host, user, password, name, port. Untracked and kept local/in Render. |

**Checked in repository & history [VERIFY]:**
```bash
git status                                   # .env is NOT listed (correctly ignored)
git log --all --oneline -- .env              # prints nothing (.env was never committed)
git log -p --all -S"44be129b"                # real API key is absent from git history
grep -rn "X-API-Key" README.md openapi.yaml  # placeholders only (<your-api-key>)
```

**What I found:** 
- `.gitignore` properly includes `.env` and `server/.env`.
- `git status` confirms `.env` is ignored and untracked.
- `server/.env.example` contains only placeholder values (`API_KEYS=key1,key2`, `DB_PASSWORD=your_mysql_password`).
- Documentation files (`README.md`, `openapi.yaml`) use placeholder `<your-api-key>` values and never expose live credentials.

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

- **Single access level:** Any valid API key has read/write privileges. In a multi-tenant enterprise system, Role-Based Access Control (RBAC) with HTTP 403 Forbidden checks would be required.
- **In-memory store:** Rate limiter resets on process restart. Production deployments should back this with Redis or Memcached.
- **Key lifecycle:** API keys are static without automatic expiration; revocation requires updating the environment variable.
