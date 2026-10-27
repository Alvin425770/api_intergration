# SECURITY_AUDIT.md


## 1. Sensitive fields

**What I looked at:** the JSON returned by every GET, POST, PUT and DELETE route.

**How to check [VERIFY]:**
```bash
curl -s -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource> | head -c 1000
curl -s -H "X-API-Key: <your-api-key>" http://localhost:3000/<resource>/1
```
Look for: `password`, `passwordHash`, `token`, `email`, `isAdmin`, `createdBy`, or any internal column the consumer's app does not need.

**What I found:** _[fill in; "nothing wrong" is a valid answer]_

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

**What I found:** _[fill in]_

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

**What I found:** _[fill in]_

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

## Fixes made

| Issue | Fix | File |
|-------|-----|------|
|  | | |

## Remaining risks

- Single access level: any valid key can read and write all records.
- In-memory rate limiter (see above).
- Keys have no expiry; rotation is manual.
