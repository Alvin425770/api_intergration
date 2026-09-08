# NyumbaHub — Project Documentation

**Last updated:** August 2026
**Purpose of this document:** onboard a new team quickly, and serve as the single source of truth going into the November 13 competition submission.

---

## 1. What NyumbaHub Is

NyumbaHub is a house-hunting platform for Kenya. The core problem it solves: house hunting is disorganized, and people get scammed when trying to rent — they pay deposits to landlords or agents who ghost them, or the listing turns out not to exist.

**The core idea (unfair advantage):** rent/booking payments go through M-Pesa into an **escrow** system. The landlord doesn't receive funds immediately — money is held until the tenant confirms the property matches what was listed (after a viewing). If it doesn't check out, the tenant is refunded.

**Target users:** people looking for houses to rent (with university students called out specifically as an early-adopter segment) and landlords/property owners listing units.

**Revenue model:** premium placement for landlords listing houses, plus commission on successful rentals.

---

## 2. Tech Stack

- **Frontend:** React (via Vite), plain CSS (no Tailwind, no CSS framework — this is intentional, see Section 5)
- **Routing:** React Router (`react-router-dom`)
- **State/Auth:** React Context (`AuthContext.jsx`) — currently client-side only, no real backend yet
- **Data:** `src/mock-data.js` — hardcoded sample data standing in for a future database
- **Payments:** M-Pesa flow is **simulated** — there is no real Safaricom Daraja API integration yet (see Section 7)

**Not yet decided/built:** backend/database, real authentication, real M-Pesa integration, image hosting.

---

## 3. Getting Started

```bash
git clone <repo-url>
cd nyumbahub
npm install
npm run dev
```

Opens at `http://localhost:5173`.

**Branching model:** work on your own branch (`git checkout -b feature/yourname`), never push directly to `master`. Open a Pull Request into `master` when ready. `master` should always be in a demoable state.

---

## 4. Project Structure

```
nyumbahub/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx / .css
│   │   ├── Footer.jsx / .css
│   │   ├── ListingCard.jsx / .css
│   │   └── SearchBar.jsx / .css
│   ├── pages/
│   │   ├── Home.jsx / .css
│   │   ├── Listings.jsx / .css
│   │   ├── ListingDetail.jsx / .css
│   │   ├── Login.jsx        (uses ../styles/auth.css)
│   │   ├── Dashboard.jsx    (uses ../styles/auth.css)
│   │   └── BookingDetail.jsx / .css
│   ├── context/
│   │   └── AuthContext.jsx  — login/register/logout, current user state
│   ├── styles/
│   │   └── auth.css         — shared styling for Login + Dashboard
│   ├── ProtectedRoute.jsx   — route guard component
│   ├── mock-data.js         — sample users, listings, bookings
│   ├── index.css            — design tokens (colors, fonts) — see Section 5
│   ├── App.jsx              — routes
│   └── main.jsx             — app entry point
```

---

## 5. Design System

The visual direction is called **"Terracotta & Stone" / Editorial Minimalism** — deliberately closer to an architecture/lifestyle magazine than a typical tech startup look. High-trust, grounded, not "bubbly."

**All colors and fonts are defined as CSS variables in `src/index.css`.** Every component should use these variables, never hardcoded hex values or font names, so the whole site stays visually consistent.

```css
--primary: #000101;         /* deep charcoal — primary buttons, footer bg, headings */
--on-primary: #ffffff;
--secondary: #5e5e5b;        /* used for image placeholder backgrounds */
--tertiary: #c86a43;         /* terracotta accent — CTAs, highlights, active states */
--background: #fcf9f5;       /* warm cream — page background */
--surface: #ffffff;          /* card backgrounds */
--on-surface: #1c1c1a;       /* primary text */
--on-surface-variant: #44474a; /* secondary/muted text */
--outline-variant: #c5c6ca;  /* borders */
--error: #ba1a1a;

--font-display: 'Libre Caslon Text', Georgia, serif;   /* all headings */
--font-body: 'Manrope', -apple-system, sans-serif;      /* body text, buttons, labels */
```

**Conventions to keep:**
- Headings use `var(--font-display)`, everything else uses `var(--font-body)`
- Buttons/labels: uppercase, `letter-spacing: 0.05em`, `font-weight: 600`, small (~13px)
- Borders over shadows — avoid heavy `box-shadow`; use thin `1px solid var(--outline-variant)` borders instead. When a shadow is needed, keep it large-blur and very low-opacity (e.g. `0 40px 80px -20px rgba(0,0,0,0.08)`)
- Border-radius: `4px` on buttons/inputs, `8px` on cards/images — never fully rounded/pill-shaped
- Property/listing photos use a `4:5` aspect ratio in cards, `3:2` for hero/wide images
- Responsive breakpoint used throughout: `@media (max-width: 900px)`

**⚠️ Important — do not install Tailwind CSS.** Early in the project, code was contributed using Tailwind utility classes, which silently did nothing since Tailwind was never configured in this project. All such code has been rewritten in plain CSS matching the system above. Keep it that way — adding Tailwind at this point would require a full rebuild of every component's styling to avoid conflicts with the existing plain CSS.

---

## 6. Data Model

All mock data in `src/mock-data.js` follows this shape. If real backend/database work begins, these are the shapes the API should return.

### User
```js
{
  id: "usr_001",
  role: "tenant" | "landlord",
  fullName: "...",
  email: "...",
  phone: "+254...",
  // tenant only:
  savedListings: ["lst_id", ...],
  // landlord only:
  verified: false,
  listingIds: ["lst_id", ...],
}
```

### Listing
```js
{
  id: "lst_014",
  landlordId: "usr_009",
  title: "...",
  description: "...",
  location: { area: "...", city: "...", lat: 0, lng: 0 },
  rentAmount: 45000,        // KES, whole numbers only
  bedrooms: 2,
  bathrooms: 2,
  images: [],                // URLs — never store raw image data
  amenities: [],
  status: "available" | "pending" | "rented",
  isVerified: false,
}
```

### Booking
```js
{
  id: "bkg_101",
  listingId: "lst_014",
  tenantId: "usr_001",
  landlordId: "usr_009",
  amount: 1000,               // KES, flat viewing/booking fee
  mpesaTransactionId: "...",
  status: "initiated" | "held" | "released" | "refunded",
}
```

**Conventions:** IDs are strings prefixed by type (`usr_`, `lst_`, `bkg_`). Dates are ISO strings. Money is whole KES, no decimals.

---

## 7. Feature Status — What's Real vs. Simulated

This is the most important section for understanding what's demo-ready vs. what needs real engineering before competition day.

| Feature | Status |
|---|---|
| Homepage (hero, how-it-works, featured listings) | ✅ Built, styled, responsive |
| Browse listings + search/filter | ✅ Built, styled, responsive. Uses mock data |
| Listing detail page | ✅ Built, styled |
| Login / Register | ⚠️ UI complete, but **auth is client-side only** — no real backend validation, likely accepts any input. Check `AuthContext.jsx` for exact current logic |
| Protected routes | ✅ Working — `/booking/:id` and `/dashboard` require login; `/`, `/listings`, `/login` are public |
| Landlord dashboard — add listing | ⚠️ Works, but **only in local React state** — refreshing the page loses any listing added. No backend persistence |
| Tenant dashboard | ⚠️ Partially built — "My Bookings" section not yet connected to real booking data |
| Booking & payment flow | ⚠️ **Fully simulated.** The M-Pesa "STK Push" is a fake countdown timer, not a real Safaricom Daraja API call. No real money moves. Validates form input properly, but the payment itself is fiction |
| Escrow status tracking | ⚠️ UI/state only — there's no real backend enforcing fund holding or release logic |
| Image uploads | ❌ Not built — listings currently reference an empty `images: []` array or a solid-color placeholder div |
| Backend / database | ❌ Does not exist. Everything currently lives in `mock-data.js` and browser memory |

**Bottom line for a new team:** the frontend experience is close to demo-ready and visually polished. The entire backend — real auth, real database, real M-Pesa integration, real escrow logic — does not exist yet. This is the primary work remaining before competition day.

---

## 8. Known Gaps / Priorities Before November 13

Roughly in priority order:

1. **Real backend + database.** Needs a decision: Node/Express + a database (MySQL/Postgres/MongoDB), or a BaaS like Firebase/Supabase for speed. This unblocks everything else below.
2. **Real authentication** — replace `AuthContext.jsx`'s current logic with real user accounts, password hashing, and persistent sessions.
3. **Persist listings** — landlord-added listings currently vanish on refresh; need to actually save to a database.
4. **Real M-Pesa Daraja API integration** — replace the simulated STK push. Requires a Safaricom developer account and sandbox testing; this took real lead time even in the original sprint plan, budget time accordingly.
5. **Image upload/hosting** — likely Cloudinary or similar, so listings can have real photos instead of placeholders.
6. **Wire "Request to Book" button** on `ListingDetail.jsx` to actually link to `/booking/:id` for that specific listing (last known status: unconfirmed whether this was completed — verify).
7. **Real escrow logic** — server-side enforcement of the hold/release/refund flow, not just UI state.

---

## 9. Design Assets Reference

If continuing the visual direction, the original mood/design reference was generated via Google Stitch and exported as a design token file (colors, type scale, spacing, component rules). If the new team wants to extend the design (new pages, new components), stay consistent with Section 5 above rather than introducing new colors/fonts freehand.

---

## 10. Contact / History Note

This project started as a Strathmore University coursework project (Group 9) before being taken forward as a competition submission. Original team: Alvin (lead — architecture, homepage, design system, Git/deployment), MJ (listings/search), Peace (auth/dashboards), Mike (booking/payments — later adapted into the final booking flow to match the design system and real listing data).
