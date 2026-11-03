# Monitoring Notes

## Predictions (written before collecting any data)

1. **Slowest endpoint: GET /memberships (the partner route).**
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