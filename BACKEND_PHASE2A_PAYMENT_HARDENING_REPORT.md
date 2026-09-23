# Stadium Booking — Backend Phase 2A Payment Hardening Report

## Executive Summary
This report documents the implementation and validation of **Backend Phase 2A — Razorpay Payment Reliability & Production Hardening** for the Stadium Booking System. 

The primary objective of Phase 2A was to harden the payment lifecycle against duplicate payment orders, duplicate callbacks, duplicate webhook events, browser drop-offs, forged payloads, cross-booking attacks, race conditions, and stale pending reservations. The active backend (`backend/server.js`) remains the authoritative source of truth. The legacy directory (`backend/src/`) was not used or modified, and out-of-scope features (email, Resend, Nodemailer, Cloudinary, Multer, rescheduling, frontend redesign) were not introduced.

All 30 Phase 2A automated tests passed, and all 5 previous regression test suites continue to pass with zero regressions.

---

## Existing Payment Architecture
Prior to Phase 2A, payment processing had the following characteristics:
* Order creation generated a new Razorpay order on every call to `/api/payments/create-order` without checking for existing active orders.
* Verification `/api/payments/verify` lacked idempotency and returned an error if called more than once for an already verified payment.
* Razorpay Webhooks were not implemented, meaning that if a user closed their browser or lost network connectivity after paying on Razorpay checkout, the booking remained stuck in `pending` and unconfirmed.
* No partial unique indexes existed on `payments` to prevent a booking from having multiple records marked `paid`.
* Unpaid pending bookings retained `SlotLock` records indefinitely without an automatic expiration mechanism.

---

## Files Changed

### 1. `backend/models/PaymentWebhookEvent.js` [NEW]
* **Change:** Created a dedicated Mongoose model for Razorpay webhook event deduplication and auditing with fields `eventId`, `eventType`, `razorpayPaymentId`, `razorpayOrderId`, `processed`, `processedAt`, `payloadHash`, `status`, `error`, and a unique compound index on `eventId`. Includes `verifyAndEnsureIndexes()`.
* **Reason:** Guarantees database-level webhook idempotency. Duplicate deliveries from Razorpay are recognized via code 11000 and acknowledged (HTTP 200) without repeating side effects.

### 2. `backend/models/Payment.js`
* **Change:**
  * Added state machine validator `canTransitionTo(newStatus)`.
  * Added partial unique index `{ booking: 1 }` with `{ unique: true, partialFilterExpression: { status: 'paid' } }`.
  * Added standard lookup index on `razorpayPaymentId` and index on `createdAt`.
  * Added static method `verifyAndEnsureIndexes()`.
* **Reason:** Enforces monotonic state transitions, prevents duplicate paid payments for the same booking at the database engine level, and enables startup index verification.

### 3. `backend/controllers/paymentController.js`
* **Change:**
  * `createOrder`: Added check for already-paid bookings (HTTP 409 Conflict), added active order reuse within the validity window (15 mins), and ensured strict ownership checks.
  * `verifyPayment`: Added idempotency check (`alreadyProcessed: true` on repeat calls), cross-booking validation, timing-safe HMAC signature verification, and notification deduplication.
  * `handleWebhook`: Implemented raw-body webhook handler supporting HMAC-SHA256 signature verification, event deduplication via `PaymentWebhookEvent`, and handlers for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, and `refund.failed`.
* **Reason:** Ensures reliable, idempotent order creation, verification, and webhook handling.

### 4. `backend/server.js`
* **Change:**
  * Mounted `POST /api/payments/webhook` with `express.raw({ type: 'application/json', limit: '100kb' })` before global `express.json()`.
  * Added invocation of `cleanupStalePendingBookings()` on startup and scheduled periodic sweeper via `startExpiryJob(5)`.
* **Reason:** Preserves raw Buffer for webhook HMAC signature calculation without breaking global JSON body parsing, and initiates background cleanup of stale pending bookings.

### 5. `backend/config/db.js`
* **Change:** Added startup verification of critical indexes for `Payment` (`booking_single_paid_unique`) and `PaymentWebhookEvent` (`eventId_1`), adopting a fail-fast policy (`process.exit(1)`) if index checks fail.
* **Reason:** Guarantees that payment idempotency and concurrency protection indexes exist in production before serving traffic.

### 6. `backend/utils/paymentLogger.js` [NEW]
* **Change:** Created structured payment audit logger that records actions (`PAYMENT_ORDER_CREATED`, `PAYMENT_VERIFIED`, `PAYMENT_WEBHOOK_CAPTURED`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`, `PAYMENT_WEBHOOK_DUPLICATE`) while masking secrets.
* **Reason:** Fulfills audit logging requirements without sensitive data exfiltration.

### 7. `backend/utils/paymentExpiryJob.js` [NEW]
* **Change:** Implemented atomic background sweeper that identifies unpaid pending bookings older than `PAYMENT_PENDING_TIMEOUT_MINUTES` (default 15m), marks them `cancelled`, releases `SlotLock` records, and marks pending payment attempts as `cancelled`.
* **Reason:** Frees locked stadium slots when users abandon checkout.

### 8. `backend/scripts/reconcilePayments.js` [NEW]
* **Change:** Created administrative script that audits discrepancies between `Payment` and `Booking` documents in dry-run mode, with an optional `--repair-safe` flag for verified corrections.
* **Reason:** Provides production visibility and safe reconciliation for financial and booking status consistency.

### 9. `backend/.env.example`
* **Change:** Added placeholder environment variables `RAZORPAY_WEBHOOK_SECRET` and `PAYMENT_PENDING_TIMEOUT_MINUTES`.
* **Reason:** Documents required environment variables without leaking secrets.

### 10. `backend/package.json`
* **Change:** Added `"test:phase2-payment": "node tests/phase2PaymentVerification.js"`.
* **Reason:** Exposes standard npm command for running the Phase 2A test suite.

### 11. `backend/tests/phase2PaymentVerification.js` [NEW]
* **Change:** Created 30-check automated test suite covering all payment lifecycle edge cases.
* **Reason:** Authoritative validation of Phase 2A payment hardening.

---

## Razorpay Order Idempotency
When a user requests `POST /api/payments/create-order`:
1. **Already-Paid Guard:** If `booking.paymentStatus === 'paid'`, the backend returns `409 Conflict` (`{ success: false, message: 'This booking has already been paid.' }`).
2. **Usable Order Reuse:** The backend checks for an existing `Payment` document associated with the booking having status `'created'` or `'pending'` created within the pending timeout window (15 minutes). If found, it reuses and returns that payment order (`{ success: true, reused: true, payment: ... }`) rather than creating redundant orders in Razorpay.
3. **Database Partial Unique Index:** MongoDB WiredTiger enforces `{ booking: 1 }` with `{ unique: true, partialFilterExpression: { status: 'paid' } }`, guaranteeing that even if multiple orders were initiated, at most one can ever transition to `'paid'`.

---

## Client Verification Idempotency
When a client calls `POST /api/payments/verify`:
1. **Repeated Call Detection:** The handler checks `payment.status`. If already `'paid'` with the same `razorpay_payment_id`, it immediately returns:
   ```json
   {
     "success": true,
     "alreadyProcessed": true,
     "message": "Payment was already verified.",
     "payment": { ... },
     "booking": { ... }
   }
   ```
2. **No Side-Effect Duplication:** In repeat verification calls, no new notifications are created, and no timestamps or audit logs are overwritten.
3. **Different Payment ID Conflict:** If the payment was already paid under a different payment ID, it returns `409 Conflict`.

---

## Webhook Architecture
* **Route:** `POST /api/payments/webhook`
* **Raw Body Handling:** Mounted directly in `server.js` before global `express.json()` using `express.raw({ type: 'application/json', limit: '100kb' })`. The raw buffer is passed untouched to the signature validator.
* **Signature Verification:** Calculated via `crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex')`. Verified using `crypto.timingSafeEqual(expectedBuf, receivedBuf)` to eliminate timing side-channel attacks.
* **Webhook Secret:** Configured via `RAZORPAY_WEBHOOK_SECRET` with a safe development fallback in non-production environments.
* **Supported Events:**
  * `payment.captured` & `order.paid`: Updates `Payment.status = 'paid'`, `Booking.paymentStatus = 'paid'`, `Booking.status = 'confirmed'`.
  * `payment.failed`: Updates `Payment.status = 'failed'`, preserves `Booking.status = 'pending'`, and retains `SlotLock` records.
  * `refund.processed`: Transitions `Payment.status = 'refunded'`, `Booking.paymentStatus = 'refunded'`.
  * `refund.failed`: Logs failure details.
  * *Unknown Events:* Returns `200 OK` with `{ status: 'ignored' }`.

---

## Webhook Idempotency
Every incoming webhook is tracked in the `paymentwebhookevents` collection:
1. **Event Key Extraction:** Uses `req.headers['x-razorpay-event-id'] || event.id || payloadHash`.
2. **Atomic Lock via Unique Index:** Before processing, attempts `PaymentWebhookEvent.create(...)` which enforces `unique: true` on `eventId`.
3. **Duplicate Handling:** If duplicate key error `E11000` occurs, the handler logs `PAYMENT_WEBHOOK_DUPLICATE` and returns `200 OK` with `{ success: true, alreadyProcessed: true }` so Razorpay ceases retry attempts, while running zero side effects.

---

## Payment State Machine

### Transitions Diagram
```text
  [created]
    ├──> [pending]
    ├──> [paid] ────────> [refunded] (Terminal)
    ├──> [failed] ──> [pending] (Retry on new attempt)
    └──> [cancelled] (Terminal)

  [pending]
    ├──> [paid] ────────> [refunded] (Terminal)
    ├──> [failed]
    └──> [cancelled] (Terminal)
```

### Transition Matrix
| Current State | Allowed Next States | Monotonic Rules |
|---|---|---|
| `created` | `pending`, `paid`, `failed`, `cancelled` | Initial payment intent |
| `pending` | `paid`, `failed`, `cancelled` | Awaiting gateway callback or signature |
| `paid` | `refunded` | **Cannot** be downgraded to `failed`, `pending`, or `cancelled` |
| `failed` | `pending`, `cancelled` | May transition back to `pending` upon user retry |
| `cancelled` | *(none)* | Terminal state |
| `refunded` | *(none)* | Terminal state; cannot transition to `paid` |

---

## Booking ↔ Payment State Matrix

| Booking Status | Booking PaymentStatus | Payment Status | Notes |
|---|---|---|---|
| `pending` | `pending` | `created` / `pending` | Initial state; slot is locked, checkout in flight |
| `pending` | `pending` | `failed` | Payment failed at gateway; slot remains locked for user retry |
| `confirmed` | `paid` | `paid` | Standard confirmed booking; slot remains locked |
| `completed` | `paid` | `paid` | Event has occurred; historical occupancy preserved |
| `cancelled` | `pending` / `failed` | `cancelled` | Stale booking cancelled by expiry job; slots released |
| `cancelled` | `refunded` | `refunded` | Cancelled booking with processed refund |

---

## Browser-Closed Recovery
If a user pays on Razorpay and immediately closes their browser or loses internet connection before `/api/payments/verify` can be called:
1. Razorpay server sends a signed `payment.captured` event to `POST /api/payments/webhook`.
2. The server verifies the HMAC signature over the raw buffer.
3. The event is deduplicated via `PaymentWebhookEvent`.
4. The server matches the `Payment` document by `razorpayOrderId` or `razorpayPaymentId`.
5. The `Payment` status is set to `'paid'`.
6. The associated `Booking` is retrieved, its `paymentStatus` is set to `'paid'`, and its `status` transitions from `'pending'` to `'confirmed'`.
7. An in-app confirmation notification is generated for the user.
8. When the user later logs in or re-opens their browser, the booking is already confirmed and available in their dashboard.

---

## Pending Booking Expiration
* **Configuration:** `PAYMENT_PENDING_TIMEOUT_MINUTES` (default: 15 minutes).
* **Target Criteria:** Bookings with `status === 'pending'`, `paymentStatus === 'pending'`, and `createdAt < Date.now() - timeoutMs`.
* **Actions Taken:**
  * Uses `Booking.findOneAndUpdate({ status: 'pending', paymentStatus: 'pending' })` for atomic safety.
  * Booking status set to `'cancelled'` with note `'Booking expired due to payment window timeout'`.
  * `SlotLock.releaseLocks(bookingId)` is executed, immediately freeing the stadium slot for other athletes.
  * Associated pending `Payment` records are marked `'cancelled'`.
* **Protection:** Confirmed, completed, and paid bookings are strictly excluded from the query filter and are never expired.

---

## Refund Handling
* **Status Support:** Full state machine support for `paid -> refunded`.
* **Webhook Processing:** Incoming `refund.processed` webhook events verify the payment record, set `Payment.status = 'refunded'`, and set `Booking.paymentStatus = 'refunded'`.
* **Idempotency:** Repeat refund webhooks return `200 OK` with `alreadyProcessed: true`.

---

## Security
* **Signature Verification:** Uses timing-safe string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks on both `/verify` and `/webhook`.
* **Ownership Validation:** `createOrder` and `verifyPayment` enforce that `payment.user` matches `req.user._id` unless the user has role `'admin'`.
* **Amount Validation:** Order amounts are derived entirely on the server using `rupeesToPaise(booking.totalPrice)`. Client-supplied amounts are ignored.
* **Cross-Booking Protection:** Payment verification checks that the `razorpay_order_id` belongs to the booking ID provided in the request.
* **Secret Protection:** Secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are never logged or returned in responses.

---

## Database Changes
* **New Model:** `PaymentWebhookEvent` (`paymentwebhookevents` collection)
  * Index: `{ eventId: 1 }` (unique: true)
  * Index: `{ createdAt: -1 }`
* **Updated Model:** `Payment` (`payments` collection)
  * Index: `{ booking: 1 }` (unique: true, partialFilterExpression: `{ status: 'paid' }`, name: `booking_single_paid_unique`)
  * Index: `{ razorpayPaymentId: 1 }` (standard lookup)
  * Index: `{ createdAt: -1 }`
* **Startup Verification:** `connectDB()` validates critical indexes on server boot and halts (`process.exit(1)`) if index verification fails.

---

## Environment Variables
* `RAZORPAY_WEBHOOK_SECRET`
* `PAYMENT_PENDING_TIMEOUT_MINUTES`

*(No secrets exposed. Documented in `.env.example`.)*

---

## Tests

### Phase 2A Payment Suite (`npm run test:phase2-payment`)
* **Tests run:** 30
* **Passed:** 30
* **Failed:** 0

### Phase 1.1 Edge-Case Suite (`npm run test:phase1-edge`)
* **Tests run:** 25
* **Passed:** 25
* **Failed:** 0

### Phase 1 Hardening Suite (`npm run test:phase1`)
* **Tests run:** 29
* **Passed:** 29
* **Failed:** 0

### API Hardening Suite (`npm run test:hardening`)
* **Tests run:** 34
* **Passed:** 33
* **Failed:** 0
* **Skipped:** 1 *(optional stadium search check)*

### Final Backend Audit Suite (`npm run test:final-audit`)
* **Tests run:** 21
* **Passed:** 21
* **Failed:** 0

### Independent Frontend-Backend Verification (`node tests/finalIndependentVerification.js`)
* **Tests run:** 40
* **Passed:** 40
* **Failed:** 0

---

## Remaining Risks
1. **Multi-Instance Scheduler Coordination:** The payment expiry job currently uses a lightweight in-process interval (`setInterval` with unref). If the backend is scaled horizontally across multiple instances in Phase 3/production, a distributed job coordinator (e.g. BullMQ with Redis or Agenda with MongoDB) should be used to prevent redundant sweep executions across server instances.
2. **Simultaneous External Webhooks Under Network Partition:** If Razorpay sends webhooks for `payment.captured` and `payment.failed` during severe network re-ordering, the monotonic state machine ensures that `paid` is never overwritten by `failed`. However, if `failed` arrives and the user retries immediately before `captured` arrives, the partial unique index ensures only one payment can be marked `paid`.

---

## Phase 2B Readiness

```text
READY FOR PHASE 2B
```
