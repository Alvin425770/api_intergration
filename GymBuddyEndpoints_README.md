# GymBuddy API — Integration Guide for Group 10 (NyumbaHub)

This document outlines the API contract, base URLs, endpoint schemas, and integration examples for integrating GymBuddy fitness amenities and tenant gym onboarding into the NyumbaHub residential platform.

---

## 1. Service Base URLs & Documentation

* **Live Production Base URL**: `[https://webapp-production-36f4.up.railway.app](https://webapp-production-36f4.up.railway.app)`
* **Local Development Base URL**: `http://localhost:5000`
* **Interactive Swagger UI**: `[https://webapp-production-36f4.up.railway.app/docs/](https://webapp-production-36f4.up.railway.app/docs/)`

---

## 2. API Endpoints Overview

| Method | Route | Description | Auth | Success Status |
| --- | --- | --- | --- | --- |
| `GET` | `/memberships` | Active gym membership tiers, rates, and package perks | None | `200 OK` |
| `GET` | `/trainers` | Certified gym trainers and coaching specializations | None | `200 OK` |
| `GET` | `/testimonials` | Verified tenant/member feedback and progress stories | None | `200 OK` |
| `GET` | `/schedules` | Weekly group fitness and strength class timetable | None | `200 OK` |
| `GET` | `/hours` | Standard facility operating schedule | None | `200 OK` |
| `GET` | `/hours?status=open` | Operating hours with real-time `currently_open` flag | None | `200 OK` |
| `POST` | `/users` | Registers a NyumbaHub tenant into the GymBuddy system | None | `201 Created` |

---

## 3. Endpoint Specifications

### 3.1. Membership Options

Fetch available plans to display on the NyumbaHub tenant amenity portal.

* **Route:** `GET /memberships`
* **Headers:** `Accept: application/json`
* **Response (`200 OK`):**
```json
[
  {
    "tier": "Daily Drop-In",
    "price": "500 KES",
    "details": "Full facility access for 24 hours."
  },
  {
    "tier": "Monthly Standard",
    "price": "5,000 KES",
    "details": "Unlimited access + GymBuddy App."
  },
  {
    "tier": "Student",
    "price": "4,500 KES",
    "details": "All features of Monthly Standard (Valid university ID required.)"
  }
]

```



---

### 3.2. Trainers Directory

Display available personal training personnel for booking or advisory.

* **Route:** `GET /trainers`
* **Response (`200 OK`):**
```json
[
  { "name": "Coach Marcus", "specialty": "Strength & Powerlifting" },
  { "name": "Coach Sarah", "specialty": "HIIT & Conditioning" },
  { "name": "Coach David", "specialty": "Hypertrophy & Aesthetics" }
]

```



---

### 3.3. Testimonials

Display social proof and resident reviews.

* **Route:** `GET /testimonials`
* **Response (`200 OK`):**
```json
[
  {
    "member": "James K.",
    "story": "The GymBuddy app feature is a gamechanger. I don't need to carry a notebook anymore, and I finally hit my 160kg deadlift target thanks to Coach Marcus."
  },
  {
    "member": "Michelle W.",
    "story": "Best facility near Strathmore hands down. The coaches actually know what they're doing, the vibe is unmatched, and it's perfect for training between classes."
  },
  {
    "member": "Anita M.",
    "story": "The Gym's cardio and HIIT sessions completely transformed my lifestyle. Switched from my old gym in South C and I'm never looking back."
  }
]

```



---

### 3.4. Class Schedules

Display weekly timetables for group training sessions.

* **Route:** `GET /schedules`
* **Response (`200 OK`):**
```json
[
  {
    "class": "HIIT & Conditioning",
    "coach": "Sarah",
    "day": "Monday",
    "time": "17:30"
  },
  {
    "class": "Powerlifting Fundamentals",
    "coach": "Marcus",
    "day": "Wednesday",
    "time": "18:00"
  }
]

```



---

### 3.5. Facility Operating Hours

Display facility operating hours with optional open/closed status checking.

* **Route:** `GET /hours`
* **Response (`200 OK`):**
```json
{
  "schedule": {
    "weekdays": "6:00 AM - 8:00 PM",
    "saturday": "7:00 AM - 6:00 PM",
    "sunday": "8:00 AM - 4:00 PM"
  }
}

```


* **Filtered Route:** `GET /hours?status=open`
* **Response (`200 OK`):**
```json
{
  "currently_open": true,
  "schedule": {
    "weekdays": "6:00 AM - 8:00 PM",
    "saturday": "7:00 AM - 6:00 PM",
    "sunday": "8:00 AM - 4:00 PM"
  }
}

```



---

### 3.6. Tenant Registration (`POST /users`)

Register a NyumbaHub tenant directly into the GymBuddy MySQL database when they sign up for facility access.

* **Route:** `POST /users` (or `POST /api/users`)
* **Headers:** `Content-Type: application/json`

#### Request Body Schema

```json
{
  "fullName": "Tenant Full Name",
  "email": "tenant.email@example.com",
  "phone": "0712345678",
  "tier": "Monthly Standard",
  "password": "SecurePassword123!"
}

```

| Field | Type | Required | Validation Constraints |
| --- | --- | --- | --- |
| `fullName` | `string` | **Yes** | Cannot be empty or blank string. |
| `email` | `string` | **Yes** | Must match valid email regex format (`user@domain.ext`). Must be unique. |
| `tier` | `string` | **Yes** | Must match one of the available membership tiers. |
| `password` | `string` | **Yes** | Minimum 6 characters. |
| `phone` | `string` | No | Optional. If supplied, must be a string. |

#### Responses

* **Success (`201 Created`):**
```json
{
  "message": "User created successfully",
  "id": 14
}

```


* **Validation Error (`400 Bad Request`):**
Triggered when fields are missing, invalid, or malformed:
```json
{
  "error": "Missing required fields: fullName, email, tier, and password are required."
}

```


*(or `"Invalid email address format."`, `"Password must be at least 6 characters long."`)*
* **Duplicate Account Conflict (`400 Bad Request`):**
Triggered if the email already exists in the system:
```json
{
  "error": "Email already exists"
}

```
---

## 4. Testing & Verification

1. **Interactive Testing**: Open [https://webapp-production-36f4.up.railway.app/docs/](https://www.google.com/url?sa=E&source=gmail&q=https://webapp-production-36f4.up.railway.app/docs/) in any web browser.
2. Select any endpoint $\rightarrow$ click **Try it out** $\rightarrow$ **Execute**.
3. For `POST /users`, verify that entering a new email gives `201 Created` and resending the exact same payload yields `400 Bad Request` with `"Email already exists"`.