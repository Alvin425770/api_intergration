# Resilience Notes — Week 11

**Team:** Alvin Bogonko, Michael Otunga, Mark Jeremy Gichohi, Peacemary Njeri

## Part A: "Before" Pictures (Baseline & Unhandled Failures)

### 1. Normal Baseline Measurement
* **Command:** `curl -s -o /dev/null -w "%{time_total} seconds\n" http://localhost:4000/tasks`
* **Result:** `0.013144 seconds` (~13 ms)
* **Observation:** The partner API responds almost instantaneously under normal conditions.

### 2. Slow Mode (`/__mode/slow`)
* **Behavior:** When switched to slow mode, the page hangs and spins for a full **10 seconds** before finally rendering the tasks.
* **Impact:** Without a timeout, our app waits indefinitely for the partner to answer, which would cause real users to abandon the page.

### 3. Flaky Mode (`/__mode/flaky`)
* **Behavior:** The page fails **2 out of every 3 requests** with a `503 Service Unavailable ("Try again")`.
* **Impact:** Without retry logic, momentary transient errors immediately cause user-facing failures, even though a simple second attempt would have succeeded.

## Part B: Adding a Timeout

### 1. Chosen Timeout Value
* **Timeout:** `1500 ms` (1.5 seconds)

### 2. Rationale (Why 1500 ms?)
* In Part A, we measured the normal baseline response time at **`0.013144 seconds` (~13 ms)**.
* 1500 ms is more than **100x** the baseline response time, providing generous headroom for temporary network fluctuations, minor server load, or latency spikes without triggering false alarms.
* At the same time, 1.5 seconds is well below the threshold where users lose patience and start repeatedly refreshing or abandoning the page.

### 3. Verification ("Prove It" Test)
* **Setup:** Flaky partner set to `slow` mode (`http://localhost:4000/__mode/slow`), which introduces an artificial 10-second delay.
* **Observed Behavior:** Instead of hanging and waiting for the full 10 seconds, the request aborted after approximately **1.5 seconds**.
* **Client Response:** Received HTTP `502` with `{"message": "Partner data unavailable"}`.
* **Server Log Output:** Logged `Partner call failed: timeout`.
* **Conclusion:** The AbortSignal timeout successfully severed the hanging connection and protected our application from being held hostage by a slow partner.

## Part C: Retry Logic
* **Settings:** at most 2 retries, 200 ms then 400 ms between attempts, `Retry-After` honored on a 429 (up to 5 s). 4xx errors and writes (POST/PUT/PATCH/DELETE) are never retried.
* **Worst-case wait:** (2 + 1) x 1500 + 200 + 400 = **5100 ms**. <Is more than five seconds acceptable for our feature? Decision and reason: Peacemary / Alvin>
* **Flaky mode proof:** <page succeeded; paste the two "retrying" lines per load>
* **Error mode proof (always 500):** <exactly two retries, then failure; paste terminal lines>

## Part D: Graceful Fallback
* **ok mode:** <live data, no banner>
* **slow mode (after a successful load):** <saved data plus banner after about 5 seconds>
* **slow mode after a server restart (saved copy cleared):** <friendly "unavailable" message, no crash>
* **Screenshot of the fallback state with the partner stopped:** <file name>

## Part E: Real Partner Drill
* **Partner team and agreed window:** <team, time>
* **Normal:** <live data>
* **Partner stopped:** <saved data plus banner, time it took>
* **Partner back:** <live data again, banner gone, no code changed>
* **Hits per page load seen in their terminal:** <at most 3>
* **Calls our own server received from our downstream partner:** <not a flood, within our Week 9 rate limit>

## Part F: Test Table
| Failure | User saw | Log said |
|---|---|---|
| Partner slow (Part B, before fallback) | HTTP 502 `{"message": "Partner data unavailable"}` after about 1.5 s instead of 10 s | `Partner call failed: timeout` |
| Partner slow (after fallback) | <saved data plus banner, after about 5 s> | <timeout lines, retries> |
| Partner flaky | <live data, no failure visible> | <two retrying lines per load> |
| Partner stopped | <saved data plus banner, or friendly message> | <e.g. `ECONNREFUSED`> |
| <one more of our choice, e.g. always 500> | <...> | <exactly two retries, then failure> |

## Our Numbers, and Why
* **Timeout:** 1500 ms, chosen because the measured normal response was about 13 ms, so 1500 ms leaves plenty of room while staying below the point where users give up.
* **Retries:** 2, the lab maximum, so one page load makes at most 3 calls to the partner.
* **Delay:** 200 ms, then 400 ms (doubling each attempt), so a struggling partner is not hit in a tight loop.
* **Worst-case wait:** 5100 ms (see Part C).

## What a Real User Would Experience Without This Code
<4 to 6 sentences, specific to our feature. Name the screen, how long the user waits, and what they do next.>

## What We Did Not Build
A circuit breaker is a switch that stops calling a partner that has been failing for a while, and tests it occasionally. Ours still tries every request three times, so when the partner is down every page load can wait the full worst-case time, whereas a circuit breaker would skip the calls and show the saved data straight away.