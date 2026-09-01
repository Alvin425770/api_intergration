

GROUP 10



|Method|Path|Purpose|Maps to need|
|-|-|-|-|
|GET|/bookings/{id}/escrow-status|Return the current escrow status of a single booking, so FundiLink can detect the moment it transitions to "released"|FundiLink needs to read escrow status (release transition)|
|GET|/bookings?escrowStatus=released\&updatedSince={timestamp}|Return the set of bookings whose escrow released recently, for polling across many tenants at once|FundiLink needs to read escrow status (release transition|
|GET|/listings/{id}/location|Return just the area/city of a listing tied to a released booking (lightweight, cacheable)|FundiLink needs to read listing location|
|GET|/listings/{id}/status|Return current listing status (available / pending / rented)|FundiLink needs to read listing status|
|||||
|POST|/bookings/{id}/fundi-requests|Create a fundi service request when a tenant/landlord confirms "Book Move-in Cleaning" from the post-move-in prompt|NyumbaHub needs to create a fundi service request|



* /listings/{id}/fundi-requests — this doesn't feel like it belongs on listings. The need statement says it's tied to a specific tenant/booking after move-in, not the listing itself. We'd nest this under /bookings/{id}/fundi-requests instead.
* Row 5 (GET /listings/{id}) — this returns the same data as rows 3 and 4 combined.

