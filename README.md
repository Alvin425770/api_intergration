# NyumbaHub — Project Documentation

**Last updated:** October 2026

**Purpose of this document:** Onboard a new team quickly and serve as the single source of truth going into the November 13 competition submission.

---

## 1. What NyumbaHub Is

NyumbaHub is a house-hunting platform for Kenya. The core problem it solves is that house hunting is disorganized, and people can be scammed when trying to rent: they may pay deposits to landlords or agents who disappear, or discover that a listing does not exist.

**The core idea (unfair advantage):** Rent and booking payments are intended to go through M-Pesa into an **escrow** system. The landlord does not receive funds immediately; money is held until the tenant confirms that the property matches the listing after a viewing. If it does not check out, the tenant is intended to receive a refund. The payment and escrow flow is currently simulated; see Section 7.

**Target users:** People looking for houses to rent (with university students called out specifically as an early-adopter segment) and landlords/property owners listing units.

**Revenue model:** Premium placement for landlords listing houses, plus commission on successful rentals.

---

## 2. Tech Stack

- **Frontend:** React (via Vite), plain CSS (no Tailwind or CSS framework; this is intentional, see Section 5).
- **Routing:** React Router (`react-router-dom`).
- **State/authentication:** React Context (`AuthContext.jsx`). Frontend authentication state is client-side; server-side authentication has not been verified.
- **Frontend sample data:** `src/mock-data.js` contains sample users, listings, and bookings.
- **Backend:** Node.js and Express, with route modules under `server/routes/`.
- **Database:** MySQL, with schema defined in `server/schema.sql`.
- **Payments:** The M-Pesa flow is **simulated**. There is no confirmed real Safaricom Daraja API integration yet (see Section 7).

**Backend update (October 2026):** An initial Node.js/Express backend and MySQL schema exist under `server/`. The API registers routes for students, property listings, and bookings. This does not establish that all frontend features use the API, or that real authentication, real M-Pesa payments, escrow enforcement, or image hosting are implemented.

---

## 3. Getting Started

### Start the frontend

From the project root, install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

The frontend is expected to open at `http://localhost:5173`.

### Start the backend

Open a second terminal at the project root and run:

```bash
cd server
npm install
npm run dev
```

The backend's `dev` script uses Nodemon and starts `server/index.js`. The server uses port `5000` by default, unless `PORT` is set in the environment. You can also run `npm start` from `server/` to start it without Nodemon.

### Configure MySQL

Make sure MySQL is running and configure the database using `server/schema.sql`. Set the connection environment variables expected by `server/db.js` in `server/.env`. Check `server/db.js` for the exact variable names and `server/.env` for the local configuration. Do not commit `.env` files, passwords, or other secrets.

### Branching model

Work on your own branch (for example, `git checkout -b feature/yourname`) rather than pushing directly to the shared main branch. Open a Pull Request when your work is ready. Confirm the target branch with the team before opening the PR.

---

## 4. Project Structure

```text
nyumbahub/
├── server/
│   ├── routes/
│   │   ├── bookings.js
│   │   ├── listings.js
│   │   └── students.js
│   ├── db.js
│   ├── index.js
│   ├── schema.sql
│   ├── package.json
│   └── .env                 # Local environment variables; do not commit secrets
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
│   │   ├── Login.jsx            # Uses ../styles/auth.css
│   │   ├── Dashboard.jsx        # Uses ../styles/auth.css
│   │   └── BookingDetail.jsx / .css
│   ├── context/
│   │   └── AuthContext.jsx      # Login/register/logout and current user state
│   ├── styles/
│   │   └── auth.css             # Shared styling for Login and Dashboard
│   ├── ProtectedRoute.jsx       # Route guard component
│   ├── mock-data.js             # Sample users, listings, and bookings
│   ├── index.css                # Design tokens (colors and fonts); see Section 5
│   ├── App.jsx                  # App routes
│   └── main.jsx                 # App entry point
└── README.md
```

---

## 5. Design System

The visual direction is called **"Terracotta & Stone" / Editorial Minimalism**—deliberately closer to an architecture/lifestyle magazine than a typical tech startup look. The intended feel is high-trust and grounded, not "bubbly."

**Colors and fonts are defined as CSS variables in `src/index.css`.** Components should use these variables rather than hardcoded hex values or font names, so the site stays visually consistent.

```css
:root {
  --primary: #000101;             /* Deep charcoal: primary buttons, footer background, headings */
  --on-primary: #ffffff;
  --secondary: #5e5e5b;           /* Image placeholder backgrounds */
  --tertiary: #c86a43;            /* Terracotta accent: CTAs, highlights, active states */
  --background: #fcf9f5;           /* Warm cream page background */
  --surface: #ffffff;              /* Card backgrounds */
  --on-surface: #1c1c1a;           /* Primary text */
  --on-surface-variant: #44474a;   /* Secondary/muted text */
  --outline-variant: #c5c6ca;      /* Borders */
  --error: #ba1a1a;
  --font-display: 'Libre Caslon Text', Georgia, serif; /* Headings */
  --font-body: 'Manrope', -apple-system, sans-serif;  /* Body text, buttons, labels */
}
```

**Conventions to keep:**

- Headings use `var(--font-display)`; other text uses `var(--font-body)`.
- Buttons and labels use uppercase text, `letter-spacing: 0.05em`, `font-weight: 600`, and a small font size (about `13px`).
- Prefer borders over shadows. Use thin `1px solid var(--outline-variant)` borders; when a shadow is needed, keep it large-blur and low-opacity (for example, `0 40px 80px -20px rgba(0,0,0,0.08)`).
- Use a `4px` border radius on buttons/inputs and `8px` on cards/images; avoid fully rounded or pill-shaped styling.
- Property/listing photos use a `4:5` aspect ratio in cards and `3:2` for hero/wide images.
- The responsive breakpoint used throughout is `@media (max-width: 900px)`.

**Important: Do not install Tailwind CSS.** Tailwind utility classes were contributed early in the project, but Tailwind was not configured, so those classes did not work as intended. The styling has been rewritten in plain CSS. Keep it that way unless the team deliberately plans and completes a wider styling migration.

---

## 6. Data Model

The mock data in `src/mock-data.js` follows the frontend shapes below. The backend database schema uses relational tables and fields of its own; do not assume the mock-data objects map directly to API responses without checking the route implementations.

### User

```js
{
  id: "usr_001",
  role: "tenant" | "landlord",
  fullName: "...",
  email: "...",
  phone: "+254...",
  // Tenant only:
  savedListings: ["lst_id", ...],
  // Landlord only:
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
  rentAmount: 45000,       // KES, whole numbers only
  bedrooms: 2,
  bathrooms: 2,
  images: [],              // URLs; do not store raw image data
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
  amount: 1000,             // KES, flat viewing/booking fee
  mpesaTransactionId: "...",
  status: "initiated" | "held" | "released" | "refunded",
}
```

**Conventions:** IDs are strings prefixed by type (`usr_`, `lst_`, `bkg_`). Dates are ISO strings. Money is represented as whole KES, with no decimals.

---

## 7. Feature Status — What's Real vs. Simulated

This section distinguishes what appears to be built from what still needs engineering or verification.

| Feature | Status |
|---|---|
| Homepage (hero, how-it-works, featured listings) | Built, styled, and responsive |
| Browse listings and search/filter | Built and styled; uses mock data |
| Listing detail page | Built and styled |
| Login/register | UI complete, but authentication is client-side only; no confirmed server-side validation. Check `AuthContext.jsx` for exact behavior |
| Protected routes | Frontend route guard exists for `/booking/:id` and `/dashboard`; `/`, `/listings`, and `/login` are public |
| Landlord dashboard — add listing | Previously documented as local React state only. Test whether listing creation now persists through the backend |
| Tenant dashboard | Partially built; "My Bookings" was not confirmed to be connected to persistent booking data |
| Booking and payment flow | Simulated. The M-Pesa "STK Push" is a fake countdown timer, not a confirmed Safaricom Daraja API call. No real money moves through this demo flow |
| Escrow status tracking | UI/state only unless server-side hold/release/refund logic is verified |
| Image uploads | Not confirmed as implemented; listings may use an empty `images` array or placeholder |
| Backend/database | An initial Express API and MySQL schema exist under `server/`. Frontend integration and endpoint behavior still need testing |

**Bottom line for a new team:** The frontend experience is visually developed, and an initial Express/MySQL backend now exists. End-to-end frontend integration, server-side authentication, real M-Pesa integration, server-enforced escrow logic, persistent listing/booking workflows, and image hosting still need to be verified or implemented.

---

## 8. Known Gaps / Priorities Before November 13

Roughly in priority order:

1. **Verify and complete backend integration.** Test the route handlers, configure the database, and connect the relevant frontend screens to the API where needed.
2. **Implement and verify real authentication.** Replace client-only authentication with server-side user accounts, password hashing, and persistent sessions before treating authentication as production-ready.
3. **Verify listing persistence.** Test whether landlord-added listings are saved through the backend and remain after refresh. Connect the UI to the database-backed routes if this is not yet implemented.
4. **Integrate the real M-Pesa Daraja API.** Replace the simulated STK Push. This requires a Safaricom developer account and sandbox testing; allow time for setup and testing.
5. **Add image upload/hosting.** Consider Cloudinary or a similar service so listings can have real photos instead of placeholders.
6. **Verify the "Request to Book" button.** Check whether `ListingDetail.jsx` links to `/booking/:id` for the selected listing; this was previously marked as unconfirmed.
7. **Implement real escrow logic.** Enforce hold/release/refund decisions on the server, not only in UI state.

---

## 9. Design Assets Reference

The original mood/design reference was generated via Google Stitch and exported as a design-token file (colors, type scale, spacing, and component rules). When extending the design with new pages or components, follow Section 5 rather than introducing new colors or fonts without a reason.

---

## 10. Contact / History Note

This project started as a Strathmore University coursework project (Group 9) before being taken forward as a competition submission. Original team: Alvin (lead—architecture, homepage, design system, Git/deployment), MJ (listings/search), Peace (authentication/dashboards), and Mike (booking/payments; later adapted into the final booking flow to match the design system and real listing data).

---

## 11. Backend API and Database (October 2026 Update)

The repository contains an initial backend under `server/`, implemented with Node.js, Express, and MySQL. The endpoints below are based on the current route handlers in `server/routes/`. Their presence in the code does not, by itself, prove that every frontend screen is integrated with them or that they have been tested against a running database.

### Backend entry point

`server/index.js`:

- Creates the Express application.
- Enables CORS and JSON request-body parsing.
- Uses `process.env.PORT` or defaults to port `5000`.
- Mounts the student routes at `/api/students`, listing routes at `/listings`, and booking routes at `/bookings`.
- Provides a root health-check endpoint.

### Base URL and endpoint reference

When running locally with the default port, the base URL is `http://localhost:5000`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Returns the text `API is running`. |
| `GET` | `/api/students` | Returns all students from the `students` table. |
| `POST` | `/api/students` | Creates a student. The JSON body requires `name`, `email`, and `course`. |
| `PUT` | `/api/students/:id` | Updates a student's `name`, `email`, and `course`. |
| `DELETE` | `/api/students/:id` | Deletes the student with the specified ID. |
| `GET` | `/listings?status=available&updatedSince=<timestamp>` | Returns available listings updated since the supplied timestamp. Both query parameters are required, and `status` must be `available`. |
| `GET` | `/listings/:id/landlord-contact` | Returns landlord contact details when the landlord has opted in; otherwise returns `available: false`. |
| `GET` | `/listings/:id/location` | Returns a listing's `area` and `city`. |
| `GET` | `/listings/:id/size` | Returns a listing's bedroom and bathroom counts. |
| `GET` | `/bookings?status=refunded&updatedSince=<timestamp>` | Returns refunded bookings updated since the supplied timestamp. Both query parameters are required, and `status` must be `refunded`. |
| `GET` | `/bookings/:id/escrow-status` | Returns a booking's escrow status and update time. |

The listing and booking routes shown here are read endpoints. The current route files do not define create/update/delete endpoints for listings or bookings. The student routes do define GET, POST, PUT, and DELETE handlers.

To test the health check, start the backend and open `http://localhost:5000/` in a browser. The expected response is:

```text
API is running
```

### MySQL schema

The SQL file is `server/schema.sql`. It identifies the database as `students_db` and defines these tables:

- **`students`** — student ID, name, email, and course.
- **`listings`** — listing status, previous status, area, city, bedroom and bathroom counts, and update time.
- **`bookings`** — linked listing ID, booking status, reason category, escrow status, and update time.
- **`landlords`** — linked listing ID, name, phone, email, and opt-in status.

The schema includes sample records. Import the schema into your local MySQL environment if the database has not already been created. Review `server/db.js` for the required connection settings and use `server/.env` for local configuration. Never commit `.env` files, passwords, or other secrets.

### Calling the API from the frontend

The frontend can call the backend over HTTP using JavaScript's built-in Fetch API. Axios was not found in the dependencies checked for this update, so this README does not claim that the project uses Axios.

Example health-check request:

```js
fetch('http://localhost:5000/')
  .then((response) => response.text())
  .then((message) => console.log(message))
  .catch((error) => console.error('API request failed:', error));
```

This example checks only the root endpoint. It does not prove that every frontend page is connected to the backend. Before integrating a frontend feature, check the relevant route's required parameters and response format.

### Current limitations to verify

Before describing the following as complete, test the running application and relevant route handlers:

- Whether frontend listing and booking screens read and write data through the API.
- Whether the database is configured correctly and the handlers work against it.
- Whether server-side authentication and authorization are implemented. The routes documented above do not show authentication middleware.
- Whether M-Pesa uses Safaricom's real Daraja API.
- Whether escrow release and refund decisions are enforced on the server.
- Whether listing images can be uploaded and stored.

Until these are verified, treat the backend as an initial implementation. The documented booking endpoint reads refunded-booking records and escrow status; it does not itself demonstrate a payment, refund, or escrow-release workflow.
