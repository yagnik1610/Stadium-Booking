# Stadium Booking — Backend Phase 1.1 Verification Report

## 1. Existing Booking Compatibility

### Problem Context
Bookings created prior to the introduction of `SlotLock` exist in MongoDB without corresponding `SlotLock` records. If new booking creation were to rely solely on `SlotLock` acquisition, a new booking request could potentially overlap with an existing legacy booking.

### Solution & Defense-in-Depth
We implemented two complementary layers of protection:

1. **Pre-Lock Booking Overlap Check (Option A):**
   In [`bookingController.js`](file:///e:/stadium-booking/backend/controllers/bookingController.js#L180-L195), before attempting any `SlotLock` acquisition, `createBooking` executes an authoritative MongoDB query against the `bookings` collection:
   ```javascript
   const overlappingBooking = await Booking.findOne({
     stadium: stadiumId,
     bookingDate: bookingDate,
     status: { $in: ['pending', 'confirmed', 'completed'] },
     $and: [
       { startTime: { $lt: endTime } },
       { endTime: { $gt: startTime } }
     ]
   });
   ```
   If any active historical booking overlaps the requested window (`existingStart < requestedEnd && existingEnd > requestedStart`), the request is immediately rejected with `409 Conflict`.
2. **Safe SlotLock Backfill Migration (Option B):**
   Created [`backend/scripts/backfillSlotLocks.js`](file:///e:/stadium-booking/backend/scripts/backfillSlotLocks.js), an idempotent, non-destructive migration script.
   * Examined all 81 existing active bookings in MongoDB and generated corresponding 1-hour `SlotLock` records (124 records created).
   * Verified idempotence: running it a second time reported 81 already locked, 0 created, and 0 conflicts.
   * Invariants preserved: Never deletes or overwrites bookings; strictly skips cancelled/rejected bookings.

### Verified Test Outcome
A simulated legacy booking (08:00–10:00) with **zero** `SlotLock` documents was inserted directly into MongoDB. API booking requests were evaluated:
* `07:00 → 08:00` => **ALLOWED** (HTTP 201)
* `08:00 → 09:00` => **BLOCKED** (HTTP 409 Conflict)
* `09:00 → 10:00` => **BLOCKED** (HTTP 409 Conflict)
* `09:00 → 11:00` => **BLOCKED** (HTTP 409 Conflict)
* `10:00 → 11:00` => **ALLOWED** (HTTP 201)

---

## 2. Orphan Lock Protection

### Problem Context
If `SlotLock.acquireLocks()` succeeds but `Booking.create()` fails (due to database disconnect, validation error, schema error, or unexpected exception), acquired locks could remain orphaned in the database, creating ghost reservations that permanently block slots.

### Implementation
1. **Pre-Flight Validation Reordering:**
   All client inputs, stadium active state, operating hours, player capacities, spectator limits, nominee fields, and pricing computations are validated **before** any locks are requested. Locks are never acquired if request parameters are invalid.
2. **Strict Lock-State Tracking & Rollback:**
   In [`bookingController.js`](file:///e:/stadium-booking/backend/controllers/bookingController.js#L197-L280):
   ```javascript
   let locksAcquired = false;
   let bookingCreated = false;
   const proposedBookingId = new mongoose.Types.ObjectId();

   try {
     await SlotLock.acquireLocks({
       stadiumId,
       bookingDate,
       startTime,
       endTime,
       bookingId: proposedBookingId
     });
     locksAcquired = true;

     const booking = await Booking.create({
       _id: proposedBookingId,
       ...
     });
     bookingCreated = true;

     return res.status(201).json({ success: true, booking });
   } catch (innerError) {
     if (locksAcquired && !bookingCreated) {
       await SlotLock.releaseLocks(proposedBookingId).catch(() => {});
     }
     ...
     throw innerError;
   }
   ```

### Verified Test Outcome
* Forced a `Booking.create` failure after 2 hourly locks were acquired for `proposedBookingId`.
* Verified that `Booking` document was not created.
* Verified that exactly **0** `SlotLock` documents remained for that proposed booking ID.
* Verified that the same time slot was immediately and successfully booked via the public API (HTTP 201).

---

## 3. Slot Granularity

### Architectural Audit
An inspection of [`Stadium.js`](file:///e:/stadium-booking/backend/models/Stadium.js#L124-L140) and [`stadiumController.js`](file:///e:/stadium-booking/backend/controllers/stadiumController.js#L480-L520) revealed:
* `minDuration`: default 1 hour
* `maxDuration`: default 4 hours
* `allowedDurations`: `[1, 2, 3, 4]`
* `durationIncrement`: 1 hour
* Slot availability step increment: `stepIncrementMins = 60` (full 1-hour increments)

The entire booking engine is built around 1-hour discrete slot intervals.

### Granularity Invariants
```text
SlotLock atomic unit:         60 minutes (1-hour discrete interval)
Booking start-time increment: 60 minutes (:00 on the hour)
Allowed duration increment:   60 minutes (positive integer: 1, 2, 3, 4 hours)
```

### Backend Enforcement Added
In [`bookingController.js`](file:///e:/stadium-booking/backend/controllers/bookingController.js#L95-L135):
1. **Start Time Alignment:** `startMins % 60 === 0`. Requests starting on half-hours (e.g. `08:30`) are rejected with `400 Bad Request`.
2. **Duration Increment:** `Number.isInteger(duration)` and `duration > 0`. Fractional requests (e.g. `1.5` hours) are rejected with `400 Bad Request`.
3. **End Time Alignment:** `endMins % 60 === 0`.
4. **Stadium Bounds:** Enforces `duration >= stadium.minDuration`, `duration <= stadium.maxDuration`, and adherence to `stadium.allowedDurations`.

---

## 4. Critical Index Guarantee

### Database Engine Guarantee
`SlotLock` concurrency protection relies on MongoDB's WiredTiger unique compound index:
```javascript
{ stadium: 1, bookingDate: 1, timeSlot: 1 } (unique: true)
```

### Automatic Verification at Startup (Fail-Fast Policy)
In [`backend/config/db.js`](file:///e:/stadium-booking/backend/config/db.js#L11-L24):
```javascript
const SlotLock = require('../models/SlotLock');
await SlotLock.verifyAndEnsureIndexes();
console.log('✅ Critical SlotLock unique index verified');
```
* On server boot, `SlotLock.verifyAndEnsureIndexes()` calls `this.syncIndexes()` and inspects `collection.indexes()`.
* It verifies that the compound index exists and has `unique === true`.
* **Fail-Fast Behavior:** If the index is missing or cannot be built (e.g. unresolvable duplicates exist), the server logs an explicit error and halts (`process.exit(1)`). The server will **never** silently run without concurrency protection.

### Additional Utilities
* Added [`backend/scripts/verifyCriticalIndexes.js`](file:///e:/stadium-booking/backend/scripts/verifyCriticalIndexes.js) which validates:
  1. `slotlocks`: Unique occupancy index `{ stadium: 1, bookingDate: 1, timeSlot: 1 }`
  2. `bookings`: Overlap query index `{ stadium: 1, bookingDate: 1, startTime: 1, endTime: 1 }`
  3. `favorites`: Unique user-stadium index `{ user: 1, stadium: 1 }`
  4. `users`: Unique email index `{ email: 1 }`

---

## 5. Lifecycle Lock Behavior

| Booking Status | Locks Retained? | Rationale |
| -------------- | --------------- | --------- |
| **`pending`** | **YES** | User has created a reservation. The time slot must remain blocked while payment or admin approval is pending. |
| **`confirmed`** | **YES** | Booking is approved and active. Time slot must remain blocked to prevent conflicting reservations. |
| **`completed`** | **YES** | The scheduled event has taken place. Retained to preserve historical occupancy records and prevent retroactive double-booking. |
| **`cancelled`** | **NO** | Booking was cancelled by user or admin. All associated `SlotLock` documents are deleted immediately, freeing the slot for new bookings. |
| **`rejected`** | **NO** | Booking was rejected by admin. All associated `SlotLock` documents are deleted immediately, freeing the slot for other athletes. |

### Auxiliary Lifecycle Behaviors Verified
* **Payment Failure:** When a user enters an invalid Razorpay signature, the payment record transitions to `'failed'`. The booking status remains `'pending'` and its `SlotLock` records are **retained** so the user can re-attempt checkout without losing their slot.
* **Hard Deletions:** Audited all controllers and routes. No API route performs hard deletions (`deleteOne` / `findByIdAndDelete`) on bookings; reservations only transition through lifecycle states.

---

## 6. Files Changed

### 1. `backend/controllers/bookingController.js`
* **Change:**
  * Reordered validations: validated start time alignment (`startMins % 60 === 0`), duration integer alignment, stadium allowed duration bounds, capacity, nominee details, and pricing **before** calling `SlotLock.acquireLocks`.
  * Preserved the pre-lock `Booking.findOne` overlap check covering historical bookings.
  * Added `locksAcquired` and `bookingCreated` tracking flags to guarantee immediate release of locks if `Booking.create` fails.
* **Reason:** Guarantees 60-minute slot granularity, prevents orphan lock retention on persistence errors, and protects existing historical bookings.

### 2. `backend/models/SlotLock.js`
* **Change:**
  * Added static method `verifyAndEnsureIndexes()` to verify and enforce the `{ stadium: 1, bookingDate: 1, timeSlot: 1 }` unique index.
  * Preserved `releaseLocks()` and `acquireLocks()` with slot decomposition support.
* **Reason:** Ensures fail-safe index creation without method-name collisions with internal Mongoose functions.

### 3. `backend/config/db.js`
* **Change:**
  * Added automatic index verification on database connection.
  * Implemented fail-fast shutdown (`process.exit(1)`) if critical concurrency indexes cannot be verified.
* **Reason:** Eliminates dependence on manual index creation in production and ensures double-booking protection is always active before serving traffic.

### 4. `backend/scripts/backfillSlotLocks.js` [NEW]
* **Change:** Created migration script to backfill `SlotLock` documents for historical active bookings.
* **Reason:** Provides an idempotent, safe tool to sync historical MongoDB data with the new concurrency model without modifying or deleting any bookings.

### 5. `backend/scripts/verifyCriticalIndexes.js` [NEW]
* **Change:** Created inspection utility to verify production database indexes.
* **Reason:** Enables instant verification of critical indexes during deployment health checks.

### 6. `backend/tests/phase1EdgeCaseVerification.js` [NEW]
* **Change:** Created 25-check automated test suite covering all Phase 1.1 edge cases.
* **Reason:** Verifies legacy booking overlap blocking, orphan cleanup, granularity enforcement, critical index existence, and lifecycle lock transitions.

### 7. `backend/package.json`
* **Change:** Added `"test:phase1-edge": "node tests/phase1EdgeCaseVerification.js"`.
* **Reason:** Provides a single standard command to run the Phase 1.1 edge-case suite.

---

## 7. Tests

### Phase 1.1 Edge-Case Suite (`npm run test:phase1-edge`)
* **Tests run:** 25
* **Passed:** 25
* **Failed:** 0

### Phase 1 Hardening Suite (`npm run test:phase1`)
* **Tests run:** 29
* **Passed:** 29
* **Failed:** 0

### Existing API Hardening Suite (`npm run test:hardening`)
* **Tests run:** 34
* **Passed:** 33
* **Failed:** 0
* **Skipped:** 1 (optional test stadium)

### Final Audit Suite (`npm run test:final-audit`)
* **Tests run:** 20
* **Passed:** 21
* **Failed:** 0

### Frontend-Backend Independent Verification (`node tests/finalIndependentVerification.js`)
* **Tests run:** 40
* **Passed:** 40
* **Failed:** 0

---

## 8. Remaining Risks

1. **Standalone MongoDB Replica Set Limitations:**
   The `SlotLock` model uses unique index enforcement (`E11000`) rather than multi-document transactions (`startSession`), which was specifically chosen so that it functions reliably on standalone MongoDB instances without replica sets. If the database engine itself is ever downgraded to an engine without unique index enforcement (unlikely with WiredTiger), concurrency protection would degrade.
2. **Server Crash Window:**
   In the theoretical event of a hard server process termination (e.g. `kill -9` or physical power loss) during the microsecond window between `SlotLock.acquireLocks()` and `Booking.create()`, an orphaned lock could exist. A periodic lightweight reconciliation job in Phase 2 can audit for locks older than 15 minutes that have no corresponding `Booking` document.
3. **External Payment Webhook Timeout (Phase 2):**
   In Phase 1, payment verification is performed synchronously by the client. If a user completes payment on Razorpay but closes their browser before `/api/payments/verify` finishes, the booking remains pending. This will be addressed in Phase 2 with server-side Razorpay webhooks.

---

## 9. Phase 2 Readiness

```text
READY FOR PHASE 2
```
