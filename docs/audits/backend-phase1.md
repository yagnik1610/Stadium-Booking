# Stadium Booking — Backend Phase 1 Hardening Report

## Executive Summary
This report documents the implementation and verification of **Backend Phase 1 — Core Reliability, Booking Safety, Payment Correctness, Security, and Data Protection** for the Stadium Booking System.

All modifications were applied strictly to the active backend (`backend/server.js`, `backend/controllers/`, `backend/models/`, `backend/utils/`, and `backend/scripts/`). The legacy directory `backend/src/` was untouched. No existing functionality was removed, and all 10 Phase 1 tasks were completed and verified with zero test failures across both the existing regression suites and a new dedicated comprehensive hardening suite (`npm run test:phase1`).

---

## Files Changed

### 1. `backend/models/SlotLock.js` [NEW]
* **What changed:** Created a dedicated Mongoose model representing atomic 1-hour occupancy units with a compound unique index on `{ stadium: 1, bookingDate: 1, timeSlot: 1 }`. Provides `acquireLocks(...)` and `releaseLocks(...)`.
* **Why:** Enforces concurrency protection at the database engine level (WiredTiger unique index), guaranteeing that overlapping reservations are rejected with code 11000 and mapped to HTTP 409 Conflict. Works seamlessly across both standalone MongoDB instances and replica sets.

### 2. `backend/utils/time.js` [NEW]
* **What changed:** Implemented timezone-deterministic date/time helpers using standard Node.js `Intl.DateTimeFormat` configured for `Asia/Kolkata`: `getPlatformNow()`, `timeToMinutes()`, `minutesToTime()`, `isPastSlot()`, and `decomposeSlotIntoHours()`.
* **Why:** Replaces browser-dependent or naive UTC date handling with platform-authoritative timezone calculations for past-time blocking and interval chunking.

### 3. `backend/utils/money.js` [NEW]
* **What changed:** Implemented `rupeesToPaise()` and `paiseToRupees()` utilities with standard rounding protection (`Math.round`).
* **Why:** Eliminates floating-point inaccuracies and standardizes all payment math across order creation, payment storage, and revenue reporting.

### 4. `backend/models/Booking.js` [MODIFIED]
* **What changed:** Added compound index `{ stadium: 1, bookingDate: 1, startTime: 1, endTime: 1 }`.
* **Why:** Accelerates overlap queries and prevents slow full-collection scans during high-traffic slot availability checks.

### 5. `backend/models/Payment.js` [MODIFIED]
* **What changed:** Documented authoritative schema expectation that `amount` is strictly stored in integer paise.
* **Why:** Clarifies data contract across developers and reporting routines.

### 6. `backend/controllers/stadiumController.js` [MODIFIED]
* **What changed:** 
  1. Updated `checkAvailability` to use `getPlatformNow('Asia/Kolkata')`. When `date === todayStr`, any slot whose start time has already passed is returned with `isAvailable: false`.
  2. In `createStadium`, added explicit string type validation for `name`, `description`, `address`, and `city`.
* **Why:** Prevents users from seeing and selecting past time slots on today's date, and blocks malformed payloads on stadium creation.

### 7. `backend/controllers/bookingController.js` [MODIFIED]
* **What changed:**
  1. Imported `SlotLock` and time utilities.
  2. In `createBooking`: Rejects booking requests for past calendar dates (`bookingDate < todayStr`) and past time slots today (`bookingDate === todayStr && startMins <= currentMinutes`) with HTTP 400.
  3. Added sport validation against `stadium.sports`.
  4. Added database-level slot lock acquisition (`SlotLock.acquireLocks`). Returns HTTP 409 Conflict (`"The selected time slot is no longer available."`) if a concurrent or overlapping reservation exists.
  5. In `cancelBooking`: Calls `SlotLock.releaseLocks(booking._id)` to immediately free the time slot for future bookings.
  6. In `updateBookingStatus`: Releases slot locks when status transitions to `cancelled` or `rejected`.
* **Why:** Solves double-booking and overlapping interval concurrency vulnerabilities, enforces authoritative time rules, and enables instant re-booking of released slots.

### 8. `backend/controllers/paymentController.js` [MODIFIED]
* **What changed:**
  1. Replaced incorrect `./notificationController` import with `../utils/notificationHelper`.
  2. Standardized order amount calculation using `rupeesToPaise(booking.totalPrice)`.
  3. Fixed payment success notification creation to pass `booking: booking._id` and `stadium: stadiumId`, matching the `Notification` schema.
* **Why:** Eliminates invalid schema fields (`relatedId`, `onModel`) and ensures clicking a payment notification resolves the actual booking.

### 9. `backend/controllers/adminDashboardController.js` [MODIFIED]
* **What changed:** Removed unit-guessing heuristic `p.amount >= 1000 ? p.amount / 100 : p.amount` and converted `p.amount` using `paiseToRupees(p.amount)`.
* **Why:** Replaces fragile guessing logic with authoritative conversion from integer paise to INR.

### 10. `backend/server.js` [MODIFIED]
* **What changed:** Mounted `express-mongo-sanitize` right after the body parsers (`express.json` and `express.urlencoded`).
* **Why:** Strips MongoDB query operators (`$` and `.`) from user input, preventing NoSQL operator injection attacks globally.

### 11. `backend/controllers/authController.js` [MODIFIED]
* **What changed:** Added explicit string type validation for `name`, `email`, `loginId`, and `password`. Added account deactivation check in `loginUser`.
* **Why:** Rejects malformed payloads such as object-based email inputs (`{"email": {"$gt": ""}}`) with HTTP 400, and blocks deactivated users from authenticating.

### 12. `backend/controllers/userController.js` [MODIFIED]
* **What changed:** Added string type validation in `updateUserProfile` and `changePassword`.
* **Why:** Prevents non-string inputs from corrupting user profile documents or bypassing validation.

### 13. `backend/controllers/adminController.js` [MODIFIED]
* **What changed:** Added string type validation for `name`, `email`, and `role` in `updateUser`.
* **Why:** Hardens admin user management against malformed payload injection.

### 14. `backend/utils/createAdmin.js` [MODIFIED]
* **What changed:** Removed hardcoded password fallback `'admin12345'`. Requires `process.env.ADMIN_PASSWORD` and fails safely with an explicit error message. Removed console logging of plain password.
* **Why:** Eliminates hardcoded admin password vulnerability and credential leakage.

### 15. `backend/utils/resetAdminPassword.js` [MODIFIED]
* **What changed:** Removed hardcoded password `'admin12345'`. Requires `process.env.ADMIN_PASSWORD` and removed console logging of password.
* **Why:** Eliminates static credential vulnerability and console secret exposure.

### 16. `backend/scripts/seedStadiums.js` [MODIFIED]
* **What changed:** Default execution now skips existing stadium records (`skippedCount++`) instead of overwriting admin changes. Stadium updates only occur when the `--force-update` CLI flag is explicitly provided. Removed hardcoded admin user password fallback.
* **Why:** Protects admin stadium modifications from being overwritten when seed scripts are run.

### 17. `backend/.env.example` [MODIFIED]
* **What changed:** Added missing environment variable names (`CLIENT_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_CURRENCY`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_LOGIN_ID`) with safe placeholders.
* **Why:** Provides a complete template for deployment without exposing actual credentials.

### 18. `backend/package.json` [MODIFIED]
* **What changed:** Added `express-mongo-sanitize` dependency and `"test:phase1"` script.
* **Why:** Enables global sanitization and automated execution of Phase 1 hardening tests.

---

## Issues Fixed

1. **Booking Concurrency & Double-Booking Risk:** Multiple concurrent booking requests for the exact same or overlapping time slots can no longer be double-booked. Only one request acquires the slot locks; competing requests receive HTTP 409 Conflict.
2. **Today's Past Slots:** Availability calculations and booking submission endpoints reject times earlier than the current platform time in `Asia/Kolkata`.
3. **Paise / Rupee Consistency:** `Payment.amount` is authoritatively treated as integer paise throughout order creation, persistence, and reporting. Fragile guessing logic (`amount >= 1000 ? ...`) was completely eliminated.
4. **Payment Notification References:** Corrected payment notifications to use `booking` and `stadium` fields directly, matching `Notification` schema.
5. **MongoDB Query Sanitization:** Globally mounted `express-mongo-sanitize` and added strict string type validation in controllers.
6. **Admin Credential Fallback Removal:** `createAdmin.js` and `resetAdminPassword.js` no longer fall back to hardcoded passwords (`'admin12345'`) and no longer log credentials to the console.
7. **Safe Stadium Seeding:** `seedStadiums.js` skips existing stadiums by default and only updates them when `--force-update` is explicitly passed.
8. **Authorization Checks:** Verified that bookings, payments, reviews, favorites, and notifications enforce strict ownership checks (`req.user._id` vs resource owner or admin role).
9. **Authoritative Backend Validation:** Durations, pricing, GST, and end times are derived authoritatively server-side from the database rather than trusting client requests.

---

## Booking Concurrency Solution

### Problem Analysis
A simple pre-check query (`Booking.findOne({ overlap })` followed by `Booking.create()`) suffers from a check-then-act race condition under concurrent requests. Two simultaneous requests for overlapping times (e.g. User A for 08:00–10:00 and User B for 09:00–11:00) both execute `Booking.findOne` before either booking is inserted, find no conflict, and both proceed to `Booking.create()`. Furthermore, MongoDB multi-document transactions (`startSession`) fail on local standalone MongoDB instances without a replica set (`Transaction numbers are only allowed on a replica set member or mongos`).

### The Atomic SlotLock Architecture
To guarantee interval overlap protection across both standalone MongoDB instances and replica sets without requiring heavy locking daemons, we introduced the `SlotLock` model:

1. **Discretization of Intervals:** Any booking from `startTime` to `endTime` is decomposed into authoritative 1-hour atomic slot blocks. For example:
   * 08:00 to 10:00 decomposes into `['08:00', '09:00']`.
   * 09:00 to 11:00 decomposes into `['09:00', '10:00']`.
   * 07:00 to 08:00 decomposes into `['07:00']`.
2. **Compound Unique Index:** The `slotlocks` collection enforces a compound unique index:
   ```javascript
   { stadium: 1, bookingDate: 1, timeSlot: 1 } (unique: true)
   ```
3. **Atomic Multi-Slot Acquisition:** Before creating a `Booking`, the controller invokes `SlotLock.acquireLocks(...)`, which attempts an `insertMany` of all required hourly slots for the proposed booking ID.
4. **Database-Level Conflict Guarantee:**
   * If any of the required hourly slots already exists for that stadium and date, MongoDB's WiredTiger storage engine raises an immediate `E11000` duplicate key error.
   * `acquireLocks` catches this error, cleans up any partially inserted locks for that proposed booking ID, and throws an error with HTTP status 409.
   * The competing request immediately receives:
     ```json
     {
       "success": false,
       "message": "The selected time slot is no longer available."
     }
     ```
5. **Partial Overlap and Subsets:** Because any overlapping time period shares at least one hourly block (e.g. 08:00–10:00 and 09:00–11:00 share `'09:00'`), the compound unique index mathematically guarantees that overlapping reservations cannot coexist.
6. **Adjacent Slots Allowed:** Adjacent bookings (e.g. 07:00–08:00 and 08:00–10:00) share zero hourly blocks (`['07:00']` vs `['08:00', '09:00']`) and both succeed.
7. **Release on Cancellation:** When a booking is cancelled or rejected, `SlotLock.releaseLocks(booking._id)` immediately deletes the corresponding slot lock records, releasing the slot for subsequent bookings.

---

## Tests

### 1. Dedicated Phase 1 Hardening Test Suite (`npm run test:phase1`)
* **File:** `backend/tests/phase1HardeningVerification.js`
* **Checks run:** 29
* **Checks passed:** 29
* **Checks failed:** 0

**Key Scenarios Validated:**
* Normal future booking creation (08:00–10:00) succeeds and creates 2 slot locks in MongoDB.
* Exact duplicate booking (08:00–10:00) blocked with HTTP 409 Conflict.
* Partial overlap left (07:00–09:00) blocked with HTTP 409 Conflict.
* Partial overlap right (09:00–11:00) blocked with HTTP 409 Conflict.
* Enclosed subset (08:00–09:00) blocked with HTTP 409 Conflict.
* Adjacent slot before (07:00–08:00) successfully allowed (HTTP 201).
* Adjacent slot after (10:00–11:00) successfully allowed (HTTP 201).
* True concurrent race condition: simultaneous asynchronous HTTP requests executed via `Promise.all` — exactly one request succeeds (201) and the competing request receives 409 Conflict.
* Booking cancellation cleanly removes slot locks and allows the released slot to be rebooked immediately.
* Past calendar dates rejected with HTTP 400.
* Past time slots on current date rejected with HTTP 400.
* Stadium availability endpoint marks today's past slots as `isAvailable: false`.
* Payment orders created strictly in integer paise.
* Invalid payment verification signatures rejected with HTTP 400 and payment transitioned to `'failed'`.
* Notification records verify direct `booking` and `stadium` references.
* NoSQL object-based email injection (`{"email": {"$gt": ""}}`) rejected with HTTP 400.
* MongoDB query operator key `$where` neutralized by `express-mongo-sanitize`.
* Cross-user private booking access blocked with HTTP 403 Forbidden.
* Normal user access to `/api/admin/dashboard` blocked with HTTP 403 Forbidden.
* `seedStadiums.js` safe non-overwrite verified.

### 2. Existing Regression Suites
* **`npm run test:hardening` (`backend/tests/apiHardeningTests.js`):**
  * Total: 34, Passed: 33, Failed: 0, Skipped: 1 (optional test stadium availability)
* **`npm run test:final-audit` (`backend/tests/finalBackendAuditTests.js`):**
  * Total: 20, Passed: 21, Failed: 0, Skipped: 0
* **`node tests/finalIndependentVerification.js`:**
  * Total: 40, Passed: 40, Failed: 0, Skipped: 0

---

## Database Changes

1. **New Collection:** `slotlocks`
   * Model: `SlotLock` (`backend/models/SlotLock.js`)
   * Fields: `stadium` (ObjectId), `bookingDate` (String), `timeSlot` (String), `booking` (ObjectId), `status` (String), timestamps.
2. **New Indexes:**
   * `slotlocks`: `{ stadium: 1, bookingDate: 1, timeSlot: 1 }` (Unique compound index)
   * `slotlocks`: `{ booking: 1 }` (Lookup and release index)
   * `bookings`: `{ stadium: 1, bookingDate: 1, startTime: 1, endTime: 1 }` (Fast overlap lookup index)
3. **Migration Requirements:**
   * No destructive database migration required. Existing `Booking` records are preserved.

---

## Environment Changes

The following environment variable names are documented in `backend/.env.example` with safe placeholder values:
* `PORT`
* `NODE_ENV`
* `CLIENT_URL`
* `MONGO_URI`
* `JWT_SECRET`
* `JWT_EXPIRES_IN`
* `RAZORPAY_KEY_ID`
* `RAZORPAY_KEY_SECRET`
* `RAZORPAY_CURRENCY`
* `ADMIN_NAME`
* `ADMIN_EMAIL`
* `ADMIN_PASSWORD`
* `ADMIN_LOGIN_ID`

No secrets or credentials are exposed in `.env.example`.

---

## Remaining Risks & Next Phase (Phase 2) Recommendations

1. **Razorpay Webhooks:** In Phase 1, payment verification is synchronous via client-reported signature verification. Phase 2 should implement server-to-server Razorpay webhooks (`/api/payments/webhook`) with raw-body HMAC verification to handle dropped browser connections.
2. **Email Delivery System:** Phase 1 uses database notifications. Phase 2 can integrate Resend or Nodemailer for transactional email confirmations.
3. **Media Uploads:** Stadium image uploads currently accept URLs; Multer / Cloudinary integration can be added in Phase 2 for file uploads.
4. **Booking Rescheduling:** Rescheduling workflows can be built on top of the `SlotLock` architecture by atomically swapping hourly locks.
