# SECURITY_AUDIT.md


## 1. Sensitive fields

**What I looked at:** the JSON returned by every GET, POST, PUT and DELETE route.

**How to check [VERIFY]:**
```bash
curl -s -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource> | head -c 1000
curl -s -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/1
```
Look for: `password`, `passwordHash`, `token`, `email`, `isAdmin`, `createdBy`, or any internal column the consumer's app does not need.

**What I found:** 

**Fix (if needed):** stop returning raw database rows. Build each response from an explicit field list:
```js
// Before: leaks the whole row
res.json(row);
// After: only what openapi.yaml promises
res.json({ id: row.id, name: row.name });
```

---

## 2. Other people's data

**What I looked at:** whether changing an ID in the URL returns a record the caller should not see.

**How to check [VERIFY]:**
```bash
curl -i -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/1
curl -i -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/2
curl -i -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/999999
```
Also confirm that every route that takes an ID uses a **parameterized query** (`WHERE id = ?` with the value passed separately), never string concatenation.

**What I found:** 

**Note:** this API has one access level, so any valid key may read any record. That is acceptable this week and matches the 401-only design. If records ever belong to individual users, a 403 check will be needed.

---

## 3. Error messages

**What I looked at:** responses to bad input, missing records, malformed JSON and database failures.

**How to check [VERIFY]:**
```bash
curl -i -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/abc
curl -i -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/999999
curl -i -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" -d '{bad json' http://localhost:3000/<resource>
curl -i http://localhost:3000/does-not-exist
```
Look for: stack traces, file paths (`/home/...`), SQL text, table or column names, the database host.

**What I found:** 

**Fix (if needed):** add a final error handler that logs details server-side only:
```js
app.use((err, req, res, next) => {
  console.error(err);                       // full detail stays in server logs
  res.status(500).json({ message: 'Internal server error' });
});
```

---

## 4. Write endpoints and extra fields

**What I looked at:** whether a caller can send fields the API never offered (such as `id`, `isAdmin`, `createdAt`) and have them saved.

**How to check [VERIFY]:**
```bash
curl -i -X POST -H "X-API-Key: <your-api-key>" -H "Content-Type: application/json" \
  -d '{"title":"test","id":9999,"isAdmin":true}' http://localhost:3000/<resource>
curl -s -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/9999
```
If record 9999 exists, or `isAdmin` was stored, the endpoint is vulnerable.

**What I found:** 

**Fix (if needed):** pick fields explicitly instead of spreading `req.body`:
```js
const { title, description } = req.body;    // allow-list
```
Also validate types and lengths, and return 400 for bad input.

---

## 5. Keys in the wrong place

**What I looked at:** the `.env` file, and where keys could end up (git, logs, README).

**Checked from the `.env` file:**

| Item | Result |
|------|--------|
| API keys stored in environment, not source code | Yes (`API_KEYS`) |
| One key per consumer | Yes: 2 distinct keys (ring partner and own team) |
| Key strength | Good: 48 hex characters each (24 random bytes, matches the handout's generator) |
| Partner URL uses HTTPS | Yes |
| Database credentials in `.env` | Yes: host, user, password, name, port. Must never be committed. |

**Still to check [VERIFY]:**
```bash
git status                                   # .env must NOT be listed
cat .gitignore | grep -n "\.env"             # must contain .env (and not .env.example)
git log --all --oneline -- .env              # must print nothing
git log -p --all -S"API_KEYS" | head         # no real key values in history
grep -rn "X-API-Key" README.md openapi.yaml  # placeholders only, e.g. <your-api-key>
grep -rn "console.log" . --include=*.js --exclude-dir=node_modules   # nothing prints a key or DB password
```

**What I found:** 

**Recommended hygiene:**
- Commit `.env.example` with placeholders only (`API_KEYS=key1,key2`, `DB_PASSWORD=changeme`).
- Because the real `.env` has been shared outside the repo (including in uploads for this assignment), **rotate the database password and both API keys** before the final submission, and send the ring partner their new key privately.
- If `git log -- .env` ever shows a commit, treat every value in it as leaked, rotate it, and tell the ring partner. Deleting the file does not remove it from history.
- `.env` values are wrapped in quotes. Some loaders keep the quotes as part of the value, so confirm the loaded key length at startup (print the count, never the keys).

---

## Authentication and rate limiting (supporting evidence)

| Test | Expected | Actual [VERIFY] |
|------|----------|--------|
| No key: `curl -i http://localhost:3000/<resource>` | 401 | |
| Wrong key: `-H "X-API-Key: wrong"` | 401 | |
| Valid key | 200 | |
| 5 requests with limit set to 3 | `200 200 200 429 429` | |
| 429 has `Retry-After` header and JSON body | Yes | |

**Rate limit threshold:** 100 requests per minute per key.
**Why:** a normal client app (a page load plus a few actions) makes well under 100 calls a minute, so real users never hit it, while a runaway loop or scraper is cut off within seconds. The limit is counted per key, so one misbehaving consumer cannot block the other.
**Known limit:** the limiter is in memory, so it resets on restart and does not work across multiple server copies. A shared store such as Redis would be used in production.

---

## Issues found

| # | Issue | Severity | Where found |
|---|-------|----------|-------------|
| 1 | The real `.env` (database host, user, password, name, port, and both API keys) was shared outside the repo while preparing this assignment, so those secrets should be treated as exposed | High | Check 5 |
| 2 | `.env` values are wrapped in double quotes; some loaders keep the quotes as part of the value, which can cause every request to return 401 or make keys fail to match | Low | Check 5 |
| 3 | Database credentials and API keys live in the same file, so one accidental commit leaks both | Medium | Check 5 |
| 4 | Single access level: any valid key can read and write every record, and a leaked key gives full access | Medium | Check 2 |
| 5 | Rate limiter is in memory: it resets on restart and does not work across multiple server copies | Low | Rate limiting |
| 6 | API keys have no expiry; rotation is manual | Low | Check 5 |
| 7 | Route-level results (checks 1 to 4): see the [VERIFY] sections above. Add any issue found by `audit_check.sh` here | n/a | Checks 1 to 4 |

## Fixes made

Tick each box once it is done, so this file only claims what is true.

| # | Fix | Done |
|---|-----|------|
| 1 | Rotated the database password and generated two new API keys (`node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`), then sent the ring partner their new key privately | [ ] |
| 2 | Confirmed `.env` is listed in `.gitignore` and does not appear in `git status` or `git log --all -- .env` | [ ] |
| 3 | Added `.env.example` with placeholder values only (`API_KEYS=key1,key2`, `DB_PASSWORD=changeme`) | [ ] |
| 4 | Removed the quotes around `.env` values, or confirmed at startup that the loaded key count is correct (count printed, never the keys) | [ ] |
| 5 | Replaced raw database rows with explicit field lists in responses (only if check 1 found extra fields) | [ ] |
| 6 | Added a final error handler that returns a generic 500 and logs details server-side only (only if check 3 found leaks) | [ ] |
| 7 | Allow-listed accepted fields on POST/PUT instead of using `req.body` directly (only if check 4 found a problem) | [ ] |
| 8 | Added tests: no key returns 401, valid key returns 200; full suite passes | [ ] |

## Remaining risks

- Single access level: any valid key can read and write all records.
- In-memory rate limiter (see above).
- Keys have no expiry; rotation is manual.
