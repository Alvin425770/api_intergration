# SECURITY_AUDIT.md


## 1. Sensitive fields

**What I looked at:** the documented response schema of all six endpoints.

**Contract review:**
- `GET /memberships`, `/trainers`, `/testimonials`, `/schedules`, `/hours` return only business information meant for a partner (tier names and prices, trainer names and specialties, class times). No emails, phone numbers, ids or flags are documented.
- `/testimonials` shows an abbreviated name ("James K."), not a full name or contact details, which is the right level of detail.
- `POST /users` receives `fullName`, `email`, `phone`, `tier` and `password`, which is personal data. The documented 201 response returns only `message` and `id`, so none of it is echoed back.

**Risks to confirm in the real responses:**
- The code might return raw database rows (for example trainer rows with email or phone columns, or a `created_by` field) even though the contract lists fewer fields.
- The password must be **hashed** (bcrypt or similar) before it is stored, never saved or logged as plain text.
- There must be no `GET /users` endpoint that lists registered tenants.

**Live test result:** _[paste the "1. SENSITIVE FIELDS" output and the `GET /users` status]_

**Fix if needed:** build each response from an explicit field list, for example `res.json({ name: t.name, specialty: t.specialty })`, and hash passwords with bcrypt before saving.

---

## 2. Other people's data

**What I looked at:** whether a caller can reach records they shouldn't by changing an ID or a query value.

**Contract review:**
- The contract has no `GET /resource/{id}` endpoint, so there is no URL ID to tamper with, which removes the most common route to other people's data.
- `POST /users` returns a sequential id (the example shows `4`). That reveals roughly how many users exist and makes ids guessable, but it is harmless while no endpoint reads a user by id.
- The only user-controlled input on a GET is `GET /hours?status=open`. The value should be checked against the allowed list (`open`) and must never be placed straight into a SQL string.

**Live test result:** _[paste "2. OTHER PEOPLE'S DATA" and the "?status=" results]_

**Note:** the API has one access level, so any valid key can call everything. That is acceptable for this week (401 only, no 403).

---

## 3. Error messages

**What I looked at:** every documented error and the errors I can trigger on purpose (bad input, malformed JSON, unknown route, database failure).

**Contract review:**
- The only documented error is `400 {"error": "Email already exists"}`. It lets a caller test whether a given email is already registered (account enumeration). This is a known trade-off: the partner's app needs to tell a tenant that the email is taken. It is acceptable here because every call needs an API key, so only the partner can ask. It is recorded as a low-severity, accepted risk.
- The contract does not document 401, 429 or 500. Unhandled errors (a failed database call, malformed JSON, missing fields) are the likeliest place for a stack trace or SQL error to leak.

**Live test result:** _[paste "3. ERROR MESSAGES" output; every line should say OK]_

**Fix if needed:** add a final error handler that logs details on the server and returns a generic message:
```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## 4. Write endpoints and extra fields

**What I looked at:** `POST /users`, the only endpoint that writes data.

**Contract review:**
- The client chooses `tier`. The server should accept only known tier values and reject anything else.
- A caller could add fields the contract never offered (`id`, `isAdmin`, `role`). The code must pick only `fullName`, `email`, `phone`, `tier` and `password` from `req.body`, and generate the id itself.
- Input should be validated: a valid email format, a phone number pattern, a minimum password length, and a 400 (not a 500) for missing fields.

**Live test result:** _[paste "4. EXTRA FIELDS ON WRITE" output. Expect: id not accepted, isAdmin/role not echoed or stored, password not echoed, missing fields give 400]_

**Fix if needed:**
```js
const { fullName, email, phone, tier, password } = req.body;   // allow-list
```

---

## 5. Keys in the wrong place

**What I looked at:** the `.env` file, `.gitignore`, git history, README, `openapi.yaml` and logs.

**Reviewed from the `.env` file:**

| Item | Result |
|------|--------|
| API keys stored in the environment, not in source code | Yes (`API_KEYS`) |
| One key per consumer | Yes: 2 distinct keys (NyumbaHub and own team) |
| Key strength | Good: 48 hex characters each (24 random bytes) |
| `PARTNER_URL` uses HTTPS | Yes |
| Database credentials in `.env` | Yes (host, user, password, name, port). Must never be committed. |
| Values wrapped in double quotes | Yes. Some loaders keep the quotes in the value, so confirm the loaded key count at startup. |

**Live test result:** _[paste "5. KEYS IN THE WRONG PLACE" output: `.env` in .gitignore = yes, tracked = no, in history = no, real key in git/README/openapi = no]_

**Hygiene:** the real `.env` was shared outside the repo while preparing this assignment, so the database password and both API keys should be rotated, and NyumbaHub should be sent the new key privately.

---

## Authentication and rate limiting evidence

| Test | Expected | Actual |
|------|----------|--------|
| `GET /memberships`, no key | 401 | [VERIFY] |
| `GET /memberships`, wrong key | 401 | [VERIFY] |
| `GET /memberships`, valid key | 200 | [VERIFY] |
| `POST /users`, no key | 401 | [VERIFY] |
| 5 requests with the limit set to 3 | `200 200 200 429 429` | [VERIFY] |
| 429 has a `Retry-After` header and a JSON body | Yes | [VERIFY] |

**Rate limit threshold:** 100 requests per minute per key.
**Why:** NyumbaHub's pages only need to fetch memberships, trainers, schedules and hours when a visitor opens them, and that stays far below 100 calls a minute even with cached misses. A runaway loop or scraper is stopped within seconds, and because the count is per key, one misbehaving consumer cannot block the other. `POST /users` is the most abusable endpoint (fake sign-ups), so a lower limit such as 10 per minute is worth considering for it.
**Known limit:** the limiter is in memory, so it resets on restart and does not work across several server copies. Production systems use a shared store such as Redis.

---

## Issues found

| # | Issue | Severity | Check |
|---|-------|----------|-------|
| 1 | The real `.env` (DB credentials and both API keys) was shared outside the repo, so treat those secrets as exposed | High | 5 |
| 2 | `openapi.yaml` declares no security scheme and no 401 or 429 responses, so the docs say the API is open | Medium | Docs |
| 3 | `POST /users` takes a plaintext `password`; storage as a bcrypt hash must be confirmed | High if unhashed | 1, 4 |
| 4 | `POST /users` takes client-supplied `tier` and could accept extra fields (`id`, `isAdmin`, `role`) | Medium | 4 |
| 5 | `400 "Email already exists"` allows testing which emails are registered | Low (accepted: key required) | 3 |
| 6 | Sequential user ids are returned by `POST /users` | Low | 2 |
| 7 | `.env` values are wrapped in quotes, which some loaders keep | Low | 5 |
| 8 | Single access level: any valid key can call everything | Medium | 2 |
| 9 | In-memory rate limiter and manual key rotation | Low | Rate limiting |
| 10 | Add anything `audit_check.sh` flags | n/a | 1 to 4 |

## Fixes made

Tick each box only once it is true in the repo.

| # | Fix | Done |
|---|-----|------|
| 1 | Rotated the DB password and generated new API keys; sent NyumbaHub its key privately | [ ] |
| 2 | `.env` is in `.gitignore`, not tracked, not in git history; `.env.example` added with placeholders | [ ] |
| 3 | `openapi.yaml` now declares an `X-API-Key` security scheme and the 401 and 429 responses | [ ] |
| 4 | Passwords are hashed with bcrypt before saving and never returned or logged | [ ] |
| 5 | `POST /users` allow-lists `fullName`, `email`, `phone`, `tier`, `password`; the id is generated by the server | [ ] |
| 6 | `tier`, `email`, `phone` and `password` are validated; bad input returns 400 | [ ] |
| 7 | Responses are built from explicit field lists, not raw database rows (if check 1 found extras) | [ ] |
| 8 | Added a final error handler that returns a generic 500 and logs details server-side (if check 3 found leaks) | [ ] |
| 9 | `status` on `/hours` is checked against the allowed value and uses parameterized queries | [ ] |
| 10 | Added tests: no key gives 401, valid key gives 200; the full suite passes | [ ] |

## Remaining risks

- Single access level: acceptable this week, but a real permission model would use 401 and 403.
- Duplicate-email message is kept on purpose so NyumbaHub can tell a tenant the email is taken.
- In-memory rate limiter (use Redis in production); manual key rotation with no expiry.
