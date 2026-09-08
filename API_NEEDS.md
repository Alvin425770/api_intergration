Group 10

PART B

1. "What data or actions from our app would actually be useful to you?"

The most useful data points from FundiLink are active local fundi listings (filtered by category and location) and worker verification status. Knowing which verified fundis (e.g., plumbers, electricians, cleaners) are available in a specific neighborhood allows us to show relevant maintenance services to tenants right after move-in or directly on a landlord's property management view.

2. "Would you ever need to create or change data in our system, or only read it?"

Primarily Read, with a potential for limited Create actions. We would read your available fundi categories, rates, and nearby worker profiles to display them within NyumbaHub. The only time we'd create data in FundiLink is if a tenant or landlord clicks a button on our interface to automatically post a job request (like 'Book Move-in Cleaning') to your platform on their behalf. We would never need to update or delete existing fundi accounts or job postings in FundiLink.

3. "How often would you need this — once per page load? Real-time? Once a day?"

On-demand / per page load. We would query your API on demand whenever a tenant views their post-move-in dashboard or when a landlord opens a property maintenance view to fetch the latest nearby available fundis. For automated job creation, it would be an instant, event-driven request triggered only when the user confirms the action.

4. "Is there anything about our app you assumed you could access that actually isn't there?

We initially assumed you might have a built-in rating, review, or trust score system attached to individual fundi profiles, as well as an established backend API with real-time availability tracking. Since FundiLink is currently operating on mock data and a frontend prototype—and still planning its verification/rating framework—we realize we cannot fetch live, verified ratings yet and will need to account for mock data until your backend API endpoints are built.

PART C

Q1. "What resources or data does your app manage that we might use?"

We manage a premium gym facility's entire database. The most useful data for your house-hunting platform would be our Memberships (pricing and tier benefits), our list of Trainers (including their headshots and specialties), and our Success Stories (testimonials). We also have a Users resource that handles account registration.

Q2. "What can we actually do with it - just read, or also create/update/delete?"

For the gym amenities (Memberships, Trainers, Testimonials), you will have strictly read-only access. You cannot update our pricing or delete our coaches. However, for the Users resource, we will grant you create access. This means you can programmatically create a GymBuddy account for a tenant when they sign a lease through your platform. You will not be able to delete or update users.

Q3. "Is there anything sensitive or restricted we shouldn't expect access to?"

Yes, absolutely. You will not have any access to our existing members' personal data, passwords, or workout logs. You also won't have access to the internal schedules of our trainers or the barbell calculator logic, as that doesn't really fit a real-estate use case. Your access will be strictly scoped to public marketing data and creating new, blank user accounts.

Q4. "How up-to-date is the data likely to be when we fetch it?"

Our membership pricing and trainer lists rarely change—maybe once a month—so that data will be very stable and you can cache it on your end so your property pages load faster. However, when you hit our endpoint to register a new tenant (Create User), that will be processed in real-time so the tenant instantly receives their welcome email from us.

PART D 

Needs Statements
1. FundiLink needs to know when a listing's status flips from "rented" back to "available" — a turnover — because that's the moment a unit reliably needs cleaning and repair before the next tenant moves in.
2. FundiLink needs to know when a brand-new listing goes live, in order to offer staging, touch-up painting, or deep cleaning before the landlord's first showing
3. FundiLink needs read access to a landlord's contact information, but only for landlords who have explicitly opted in to being contacted by service partners. Landlords who own multiple units are repeat customers for the same turnover job, which is worth more to FundiLink than a one-off tenant lead
4. FundiLink needs to read bookings that end in a refund, along with a general refund reason category, because a refund tied to "property didn't match the listing" often points to something genuinely broken that needs fixing before the unit can be re-rented.
5. FundiLink needs the location (area, city) and size (bedrooms, bathrooms) of a listing tied to any of the above signals, in order to match the right nearby fundi and roughly scope the job before making contact.
6. FundiLink needs the location (area, city) and size (bedrooms, bathrooms) of a listing tied to any of the above signals, in order to match the right nearby fundi and roughly scope the job before making contact.
7. NyumbaHub needs to send FundiLink a fundi service request the moment a tenant or landlord confirms a service prompt (e.g. "Book Move-in Cleaning") in our app, so FundiLink can open a job without anyone re-entering details on FundiLink's own app.

PART E

Sanity Check Against Week 1 Audit

All three statements map directly to resources already in NyumbaHub's data model

PART F

The most surprising part of the interviews was how much both sides had assumed capabilities that turned out not to exist yet — not because either team was careless, but because "this seems like it should be there" is an easy trap once you're deep in your own app. FundiLink assumed NyumbaHub (and by extension their own fundi profiles) would already have a built-in rating or trust-score system they could plug into, and had to walk that back once it became clear FundiLink is still on mock data with no verification framework built. On the upstream side, GymBuddy's answer was more precise than we expected: rather than a blanket "read-only, trust us," they scoped exactly what we'd get — strictly read access to Memberships, Trainers, and Testimonials, but a narrow, one-directional Create permission limited to registering a blank new user account, with explicit call-outs of what's off-limits (trainer schedules, the barbell calculator logic — "doesn't fit a real estate use case"). That specificity was the useful surprise: we walked in expecting a vague yes/no on access, and got an actual permissions boundary instead, which is exactly the kind of detail this exercise is meant to surface before anyone writes an endpoint.