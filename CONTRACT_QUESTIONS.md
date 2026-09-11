# Nyumbahub- group 10

# CONTRACT_QUESTIONS.md — GymBuddy API Review

1. **POST /users — why does NyumbaHub need to supply a `password`?**
   Our Week 2 interview described this endpoint as NyumbaHub creating a "blank" GymBuddy 
   account for a tenant automatically at lease signing — not the tenant filling out a form. 
   But the contract requires us to send a `password` field. Are we expected to generate one 
   ourselves, or should this field be optional/removed, with GymBuddy instead emailing the 
   tenant a link to set their own password?

2. **POST /users — does `tier` have to exactly match the strings from GET /memberships?**
   The `/users` example shows `tier: "standard"`, but `/memberships` returns tier names like 
   `"Monthly Standard"`. Is there a fixed list of valid values for `tier`, and if so, can it be 
   documented as an enum so we know exactly which strings are accepted when registering a user?

3. **Were /schedules and /hours meant to be in scope for us?**
   Our original Week 2 needs conversation only covered Memberships, Trainers, Testimonials, 
   and Users. This contract also includes /schedules and /hours, which we never discussed. 
   Can you confirm these are intentionally available to us, and if so, what's the intended use 
   case on your end?