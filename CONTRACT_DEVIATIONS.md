# GROUP 10
# Mwanyumba Alvin
# Jeremy Gichohi
# Michael Otunga
# Peacemary Njeri
# Contract Deviations - Week 5

## Change: Added `/bookings/{id}/escrow-status`

**What changed:** Added the `GET /bookings/{id}/escrow-status` endpoint to `openapi.yaml`.

**Why:** This endpoint was documented in `ENDPOINT_LIST.md` (Group 10's endpoint spec) as part of the agreed FundiLink integration, but was missing from the `openapi.yaml` file produced in Week 4. Since the route was already needed for FundiLink to detect the escrow "released" transition as a move-in touchpoint, it was added to the contract this week rather than left undocumented.

**Impact:** No existing endpoints were changed. This is a net-new addition, not a modification of any previously agreed field or type.

## Update: Re-verified against updated contract

After initial implementation and verification, `main` was updated with a revised `openapi.yaml` from a teammate, which changed several response shapes:

- `/listings` and `/bookings` responses are now wrapped in an object (`{listings: [...]}` / `{bookings: [...]}`) instead of returning a bare array
- `reasonCategory` on bookings was renamed to `refundReasonCategory`
- A `listingId` field was added to each booking in the `/bookings` response
- The `/bookings/{id}/escrow-status` response now requires `bookingId` and `updatedAt` in addition to `escrowStatus`
- Error responses (`400`/`404`) now use a `{code, message}` shape instead of a generic `{error}` message

All six GET endpoints were re-implemented and re-verified against the updated contract in Swagger before this PR was finalized. No further deviations were introduced during this update - all changes were made to bring the implementation in line with the contract as it now stands on `main`.

## All other endpoints

No other deviations. All other GET endpoints (`/listings`, `/listings/{id}/landlord-contact`, `/listings/{id}/location`, `/listings/{id}/size`, `/bookings`) were implemented and verified against the original Week 4 contract with no drift - field names, types, and status codes all matched as written.

No deviations in POST endpoints.