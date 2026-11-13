# Deprecation Notice: GymBuddy API v1

**To:** Group 10 (NyumbaHub)  
**From:** Enoch Mwambua (GymBuddy / Evolve Fitness Lang'ata)  
**Date:** November 11, 2026  

## Summary
v1 of `GET /memberships` is deprecated. v2 is live now. v1 will stop working on November 13, 2026. Please migrate your integration before then.

## What is changing
1. The membership array is now wrapped in a data object: `[...]` becomes `{ "data": [...], "count": N }`.
2. The field `"price"` is renamed to `"rate"`.
3. Nothing else changes: authorization keys, query filters (`?status=open`), and `/users` POST routes remain identical.

## Why
Wrapping the membership array inside a `{ data, count }` structure enables us to support dynamic pagination, localized currency conversions, and promotional discounts in upcoming releases without introducing further breaking changes.

## Before and After
* **v1 GET /memberships:**
  ```json
  [
    { "tier": "Monthly Standard", "price": "5,000 KES", "details": "Unlimited access + GymBuddy App." }
  ]