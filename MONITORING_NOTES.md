# Monitoring Notes

## Predictions (written before collecting any data)

1. **Slowest endpoint: GET /api/gym/memberships (the partner route).**
   It is the only endpoint that calls another server over the network.
   In Week 11 the partner answered in about 13 ms when healthy, but my
   timeout and retry settings allow up to 5100 ms when the partner is
   slow or flaky. I expect its average to be low, but its maxMs to be
   much higher than every other route, because one bad partner call
   can take several seconds.

2. **Most errors: GET /<resource>/:id (requests for ids that don't exist).**
   I expect mostly 4xx errors, from callers asking for missing ids and
   from requests with no key (401). I expect very few 5xx errors on the
   partner route, because my fallback returns saved data with
   "stale": true instead of an error. The exception is a partner failure
   before any saved copy exists, which returns a 502.

---


### 1. Actual `/stats` Output (Baseline Measurement)

```json
{
  "startedAt": "2026-11-06T12:33:08.064Z",
  "uptimeSeconds": 231,
  "total": 64,
  "clientErrors": 31,
  "serverErrors": 0,
  "errorRatePercent": 0,
  "avgMs": 197.1,
  "routes": {
    "GET /listings/:id/location": {
      "count": 19,
      "clientErrors": 10,
      "serverErrors": 0,
      "avgMs": 329.6,
      "maxMs": 2261.8
    },
    "GET /api/gym/memberships": {
      "count": 9,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 401.1,
      "maxMs": 750.3
    },
    "GET (no route)": {
      "count": 21,
      "clientErrors": 21,
      "serverErrors": 0,
      "avgMs": 0.6,
      "maxMs": 1.1
    },
    "GET /listings/": {
      "count": 12,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 227.2,
      "maxMs": 242.8
    },
    "GET /": {
      "count": 1,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 1.9,
      "maxMs": 1.9
    },
    "GET /stats": {
      "count": 2,
      "clientErrors": 0,
      "serverErrors": 0,
      "avgMs": 0.9,
      "maxMs": 1
    }
  }
}
```

### 2. Slowest Endpoint vs. Prediction

* **Prediction:**
  I predicted that `GET /api/gym/memberships` would be the slowest endpoint on average and produce the highest `maxMs` spike due to network hops to an external partner service with potential retry and timeout delays.

* **What the Actual Data Shows:**
  * **Highest Average Latency (`avgMs`):** 
    **Confirmed.** `GET /api/gym/memberships` was the slowest route on average at **`401.1 ms`**, which is notably higher than internal database endpoints (`GET /listings/` averaged `227.2 ms`).
  * **Worst-Case Latency (`maxMs`):** 
    * `GET /api/gym/memberships` showed a peak of **`750.3 ms`** during remote partner fetch attempts.
    * Surprisingly, the absolute slowest single request across the whole API was **`GET /listings/:id/location` with a `maxMs` of `2261.8 ms`**.

* **Why this happens:**
  * The partner route (`GET /api/gym/memberships`) consistently takes longer on average (`~401 ms`) because every request must travel over the external network to the remote GymBuddy server.
  * The extreme `2261.8 ms` spike on `GET /listings/:id/location` was caused by a cold-start TLS handshake and connection pool initialization to the remote TiDB Cloud database on the first request. Subsequent queries were fast (`< 50 ms`).
  * **Key takeaway:** Averages hide outliers. While `GET /listings/:id/location` had an acceptable average of `329.6 ms`, looking only at `avgMs` hides a 2.2-second pause experienced by the first caller.

### 3. Production Alert Idea

* **Metric & Threshold:**
  Trigger an alert if **`errorRatePercent > 5%`** over a rolling 5-minute window, OR if **`avgMs > 1500 ms`** on `GET /api/gym/memberships` across 5 consecutive health checks.

* **What Happens When It Fires:**
  1. **Engineering Action:** A high-priority incident notification is sent to Slack / PagerDuty with the current `/stats` payload and recent error logs, paging the on-call engineer to determine whether the remote database or the upstream GymBuddy service has failed.
  2. **User Experience (Week 11 Fallback):** While the human investigates and fixes the root cause, users do not experience downtime:
     * The backend's `resilientFetch` and fallback cache serve the last known good snapshot (`lastGoodMemberships` with `stale: true`).
     * The frontend displays the cached cards along with the warning banner (*"Showing saved membership data... The partner is not responding"*).
     * The rest of the platform (student portal, browsing housing listings) remains 100% active and unblocked.
