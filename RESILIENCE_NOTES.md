# Resilience Notes — Week 11

**Team:** Alvin Bogonko, Michael Otunga, Mark Jeremy Gichohi, Peacemary Njeri

## Part A: "Before" Pictures (Baseline & Unhandled Failures)

### 1. Normal Baseline Measurement

- **Command:** `curl -s -o /dev/null -w "%{time_total} seconds\n" http://localhost:4000/tasks`
- **Result:** `0.013144 seconds` (~13 ms)
- **Observation:** The partner API responds almost instantaneously under normal conditions.

### 2. Slow Mode (`/__mode/slow`)

- **Behavior:** When switched to slow mode, the page hangs and spins for a full **10 seconds** before finally rendering the data.
- **Impact:** Without a timeout, our app waits indefinitely for the partner to answer, which would cause real users to abandon the page.

### 3. Flaky Mode (`/__mode/flaky`)

- **Behavior:** The page fails **2 out of every 3 requests** with a `503 Service Unavailable ("Try again")`.
- **Impact:** Without retry logic, momentary transient errors immediately cause user-facing failures, even though a simple second attempt would have succeeded.

## Part B: Adding a Timeout

### 1. Chosen Timeout Value

- **Timeout:** `1500 ms` (1.5 seconds)

### 2. Rationale (Why 1500 ms?)

- In Part A, we measured the normal baseline response time at **`0.013144 seconds` (~13 ms)**.
- 1500 ms is more than **100x** the baseline response time, giving generous headroom for network fluctuations, minor server load, or latency spikes without false alarms.
- At the same time, 1.5 seconds is well below the point where users lose patience and start refreshing or abandoning the page.

### 3. Verification ("Prove It" Test)

- **Setup:** Flaky partner set to `slow` mode (`http://localhost:4000/__mode/slow`), which adds an artificial 10-second delay.
- **Observed behavior:** Instead of waiting the full 10 seconds, the request aborted after approximately **1.5 seconds**.
- **Client response:** HTTP `502` with `{"message": "Partner data unavailable"}`.
- **Server log output:** `Partner call failed: timeout`.
- **Conclusion:** The `AbortSignal` timeout cut off the hanging connection, so our app is no longer held hostage by a slow partner.

## Part C: Retry Logic

- **Settings:** At most 2 retries, 200 ms then 400 ms between attempts, `Retry-After` honored on a 429 (up to 5 s). 4xx errors and writes (POST/PUT/PATCH/DELETE) are never retried.
- **Worst-case wait:** (2 + 1) x 1500 + 200 + 400 = **5100 ms**. We measured **5.12 s** with the partner in slow mode, which matches.
- **Is 5.1 s acceptable?** Yes, for a read-only memberships list. That wait only happens when the partner hangs. If the partner's server is stopped, the connection is refused at once and the page responds in under a second. If we wanted it faster, lowering the timeout to 1000 ms gives 3 x 1000 + 600 = 3600 ms.
- **Flaky mode proof (`/__mode/flaky`):**

  ```text
  attempt 1 failed, retrying in 200 ms
  attempt 2 failed, retrying in 400 ms
  ```

  The request then succeeded on the 3rd call and returned the memberships.
- **Error mode proof (`/__mode/error`, always 500):**

  ```text
  attempt 1 failed, retrying in 200 ms
  attempt 2 failed, retrying in 400 ms
  Partner returned status: 500
  ```

  Exactly 2 retries, then a clean failure: `{"message":"Partner data unavailable"}`.

## Part D: Graceful Fallback

- **ok mode:** Live memberships data is shown (`"stale": false`) with no banner.
- **slow mode (after a successful load):** Saved memberships data is shown with a yellow banner reading "Showing saved membership data from [time]. The partner is not responding." after about 5 seconds (`"stale": true`).
- **slow mode after a server restart (saved copy cleared):** A friendly "Partner data unavailable" message (HTTP 502) is returned. There is no crash and no endless spinner.
- **Screenshot of the fallback state with the partner stopped:** `fallback-state.jpeg` (NyumbaHub "Partner Amenity: GymBuddy Fitness" screen showing the saved Daily Drop-In and Monthly Standard plans under the "partner is not responding" banner, taken by Michael).

## Part E: Real Partner Drill

> **Note:** Our GymBuddy partner team (Group 9) was not available for a live stop/start window, so we ran the drill against our own stand-in partner (`server/tests/flaky-partner.js` on `http://localhost:4000`) with `PARTNER_URL` pointed at it. From our server's point of view a stopped local partner and a stopped remote one fail the same way (refused connection), so the timeout, retry and fallback code paths are the same. `PARTNER_URL` was restored to the real partner afterwards.

- **Partner team and agreed window:** GymBuddy partner team (Group 9, deployed on Railway). No live window; simulated locally on 3 Nov 2026 with the stand-in partner.
- **Normal:** Live data loaded immediately with `"stale": false`.
- **Partner stopped:** After one successful load, we stopped the stand-in partner and reloaded. The page returned the saved data with `"stale": true`. We also saw that if the partner is stopped *before* any successful load (empty saved copy), the route returns the friendly `502 {"message": "Partner data unavailable"}` instead of crashing.
- **Partner back:** Restarting the stand-in partner and reloading returned live data with `"stale": false` and no banner, with no code changed.
- **Hits per page load on the partner:** At most 3 by design (1 attempt + 2 retries).
- **Calls our own server received from downstream callers:** Not exercised in the simulated drill. Any downstream caller is limited by our Week 9 rate limiter (100 requests per minute per API key).

## Part F: Test Table

| Failure | User saw | Log said |
|---|---|---|
| Partner slow (Part B, before fallback) | HTTP 502 `{"message": "Partner data unavailable"}` after about 1.5 s instead of 10 s | `Partner call failed: timeout` |
| Partner slow (after fallback) | Saved data plus banner, after about 5 s | Two `retrying` lines, then `Partner call failed: timeout` |
| Partner flaky | Live data, no failure visible | `attempt 1 failed, retrying in 200 ms` and `attempt 2 failed, retrying in 400 ms` |
| Partner stopped | Saved data plus banner, or the friendly "unavailable" message if nothing is saved yet | `Partner call failed: ECONNREFUSED` |
| Partner error (always 500) | Saved data plus banner, or the friendly message, after exactly two retries | `attempt 1 failed...`, `attempt 2 failed...`, `Partner returned status: 500` |

## Our Numbers, and Why

- **Timeout:** 1500 ms, chosen because the measured normal response was about 13 ms, so 1500 ms leaves plenty of room while staying below the point where users give up.
- **Retries:** 2, the lab maximum, so one page load makes at most 3 calls to the partner.
- **Delay:** 200 ms, then 400 ms (doubling each attempt), so a struggling partner is not hit in a tight loop.
- **Worst-case wait:** 5100 ms (see Part C).

## What a Real User Would Experience Without This Code

A student opening the gym memberships screen on NyumbaHub while the partner is slow would stare at a spinner for a full 10 seconds before anything appeared. When the partner is flaky, about two out of every three page loads would fail outright with an error, even though a second try would have worked. When the partner is down, the screen would show an error and no prices at all, so the student cannot compare plans. Most people in that situation refresh again and again or leave, and every refresh sends extra requests to a partner that is already struggling. With our timeout, retries and saved copy, the same student sees working membership data (marked as saved) within about 1.5 to 5 seconds instead.

## What We Did Not Build

A circuit breaker is a switch that stops calling a partner that has been failing for a while, and tests it occasionally. Ours still tries every request three times, so when the partner is down every page load can wait the full worst-case time, whereas a circuit breaker would skip the calls and show the saved data straight away.