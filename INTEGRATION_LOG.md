# GROUP 10
# Mwanyumba Alvin
# Jeremy Gichohi
# Michael Otunga
# Peacemary Njeri
# Integration Log — Week 10

**Upstream Partner:** GymBuddy  
**Partner Live Base URL:** `https://webapp-production-36f4.up.railway.app`  
**Contract Reference:** `openapi.yaml` / Partner README  

---

## Debugging and Verification Log

| # | What broke (symptom) / What was tested | Root cause | Fix / Outcome | Whose code, and who fixed it |
|---|---|---|---|---|
| 1 | Baseline verification: Terminal `curl` to `GET /memberships` | Contract shape and connectivity check outside app code before writing implementation | Succeeded (HTTP 200). Verified response schema matched README contract: `tier` (string), `price` (string), and `details` (string). Confirmed endpoints require no API key. | Upstream (GymBuddy) / Verified by NyumbaHub |
| 2 | Intentional negative test: `curl` to non-existent endpoint `GET /nonexistent` | Testing error handling and status codes on partner API | Partner returned 404 Not Found as expected. Verified partner router handles invalid routes cleanly. | Upstream (GymBuddy) / Verified by NyumbaHub |
| 3 | Browser returned `HTTP ERROR 404` when loading `http://localhost:5173/` after creating the `GymPerks` UI | Vite dev server requires `index.html` at the repository root. `index.html` was missing from root and located inside `src/` | Moved `index.html` to the project root (`./index.html`). Vite successfully resolved the entry point and rendered the app. | NyumbaHub frontend setup / Fixed by NyumbaHub |
| 4 | End-to-end integration: Server proxy route `GET /api/gym/memberships` and `<GymPerks />` component | Fetching partner data through Express backend proxy to avoid CORS and display amenity tiers | Backend successfully queried `https://webapp-production-36f4.up.railway.app/memberships`, mapped contract fields, and React frontend rendered 3 cards: Daily Drop-In (500 KES), Monthly Standard (5,000 KES), and Student (4,500 KES). | NyumbaHub fullstack integration / Verified end-to-end |
| 5 | Graceful failure resilience test: Simulated upstream partner outage by pointing `PARTNER_URL` to unreachable hostname | Verified app resilience when upstream API is down (Part D requirement) | Express server caught `ENOTFOUND`, logged descriptive error code, and returned HTTP 502 with `{ message: 'Partner data unavailable' }`. React UI displayed a friendly warning banner without blank screen or crash, and core NyumbaHub routes remained active. Re-pointing to live URL restored amenity cards immediately without code changes. | NyumbaHub resilience handling / Verified by NyumbaHub |
| 6 | Downstream Consumer Support (Part E): Consumer reported our API was not working | Consumer could not reach/consume the NyumbaHub endpoints | Investigated the issue on our provider side, resolved the problem, and tested the live endpoint across 4 separate machines online to confirm full accessibility and correct response data. Informed the consumer that the fix was live and working; currently awaiting their follow-up confirmation as they haven't sent updated feedback since. | Both sides / Resolved & verified by NyumbaHub team |
---
## Part F — Demo Rehearsal Checklist
The live demonstration was rehearsed and verified in three distinct steps:
1. **Live Partner Data**: NyumbaHub home page displays active GymBuddy membership plans fetched dynamically through the Express backend proxy.
2. **Upstream Failure (Resilience)**: With the partner simulated as down, the NyumbaHub home page remains fully responsive, displays the friendly notice banner, and prevents any unhandled application crashes.
3. **Partner Recovery**: Once the partner connection is restored, the application immediately recovers and displays the live cards without requiring code changes.

---

## Week 13 — Versioning and Deprecation

| # | Symptom / What was tested | Root cause | Change / Outcome | Whose code, and who fixed it |
|---|---|---|---|---|
| 7 | NyumbaHub needed to change the listings list wrapper without breaking existing consumers | The old `{ listings }` wrapper was inconsistent with other list APIs and did not leave room for paging | Added `/v2/listings` with `{ data, count }`, retained `/v1/listings` and `/listings`, restored legacy detail subroutes, and added matching deprecation headers. The live before/after diff was empty. | NyumbaHub provider code / Fixed and verified by NyumbaHub |
| 8 | A GymBuddy deprecation notice announced a `{ data, count }` wrapper and `price` to `rate` rename | Intentional upstream breaking-change exercise | Tested both URLs with the configured key before editing the integration. v1 returned 200; the expected v2 URL returned 404. We intentionally kept the consumer on v1 for the demonstration and do not claim a completed v2 migration. Nothing broke silently because the notice warned us first. | Upstream GymBuddy contract / Verified by NyumbaHub; consumer remains on v1 by decision |
| 9 | Existing clients still needed listing location, size, and landlord-contact routes after versioning | The first v1/v2 mount replaced the original listings router | Re-mounted the unchanged legacy handlers beside the versioned list handlers and added regression tests for both `/listings` and `/v1/listings` subroutes. | NyumbaHub routing code / Fixed by NyumbaHub |
| 10 | Full local demonstration rehearsal on 13 November | Initial live checks exposed a missing local team-key role and an idle TiDB `ECONNRESET`; mocked tests had not exposed either | Configured a separate local team key and added a one-time retry for read-only transient database failures. Final result: all 49 tests passed, all 13 planned curl flows returned HTTP 200, GymBuddy v1 returned live data with `stale: false`, the v1 diff was empty, and the browser homepage/login/listings/search/details flows worked without console errors. | NyumbaHub configuration, database access, and frontend / Fixed and verified by NyumbaHub |