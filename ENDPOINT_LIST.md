GROUP 10

Endpoints NyumbaHub Exposes to FundiLink

Method	Path	Purpose	Maps to need	Direction
GET	/listings?status=available&updatedSince={timestamp}	Return listings that just became "available," tagged with a reason (vacated vs. newly listed), so FundiLink can catch turnovers and new listings in one poll	FundiLink needs to catch units the moment they're vacated (real cleaning/repair work) or newly listed (staging before showings)	FundiLink → NyumbaHub
GET	/listings/{id}/landlord-contact	Return a landlord's contact info for a given listing — only returns data if that landlord has opted in to being contacted by service partners; otherwise returns "not available"	FundiLink needs opted-in landlord contact info to build repeat relationships with multi-unit landlords	FundiLink → NyumbaHub
GET	/bookings?status=refunded&updatedSince={timestamp}	Return bookings that ended in a refund since a given timestamp, along with a general refund reason category	FundiLink needs to spot refunds caused by a property mismatch, since that often means something is actually broken	FundiLink → NyumbaHub
GET	/listings/{id}/location	Return just the area/city of a listing (lightweight, cacheable)	FundiLink needs a listing's area/city to match the tenant or landlord to a nearby fundi	FundiLink → NyumbaHub
GET	/listings/{id}/size	Return bedroom and bathroom counts for a listing, to help scope a job before contact	FundiLink needs bedroom/bathroom counts to roughly scope a job before making contact	FundiLink → NyumbaHub
GET	/bookings/{id}/escrow-status	Return the current escrow status of a single booking, so FundiLink can detect the "released" transition as a lighter-weight move-in touchpoint	FundiLink needs to know when a booking's escrow releases, as a minor move-in cleaning/introduction touchpoint	FundiLink → NyumbaHub
POST	(on FundiLink's API) /fundi-requests	NyumbaHub calls FundiLink's job-creation endpoint when a tenant/landlord confirms a service prompt (e.g. "Book Move-in Cleaning")	NyumbaHub needs to hand off a confirmed service request so the user doesn't re-enter details on FundiLink's app	NyumbaHub → FundiLink
/listings?status=available&updatedSince={timestamp} replaces two need statements (turnover and new listings) with one endpoint, since both surface as the same status transition. The response includes a "reason" field (vacated vs. newly_listed) computed server-side, so FundiLink doesn't need two separate calls to tell them apart.
/listings/{id}/landlord-contact is the one endpoint that returns identity data, and it's built to fail closed — no opt-in flag on the landlord's account means the endpoint returns nothing, not an error that leaks whether the flag exists at all.
/bookings?status=refunded is new. It's deliberately scoped to a reason category (e.g. "property_mismatch") rather than the tenant's original complaint text, so a support conversation never leaks through this channel.
/listings/{id}/location and /listings/{id}/size stay separate, lean endpoints — they're pulled together by FundiLink alongside whichever signal (turnover, new listing, or refund) triggered the lookup, not fetched on their own.
/bookings/{id}/escrow-status is kept, but demoted — it's now framed as a same-day, low-urgency touchpoint rather than the primary trigger it was in the earlier draft.
The fundi-request creation action still lives on FundiLink's API, not ours, since NyumbaHub is the one initiating it. We only need the booking.id and listing.id already in our own model to make that call.

