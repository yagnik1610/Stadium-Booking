# Stadium Booking — Backend Phase 2B Email System Report

## Executive Summary

Backend Phase 2B successfully introduces a production-ready, highly reliable transactional email system using the official **Resend** Node.js SDK for the Stadium Booking System. The implementation adheres to strict operational boundaries: email delivery is treated purely as a non-blocking secondary side-effect that **never** rolls back or breaks core database transactions (user registration, booking creation, payment verification, cancellations, or contact submissions).

A robust, database-backed idempotency mechanism using MongoDB unique indexes on `EmailLog.idempotencyKey` completely prevents duplicate transactional emails across concurrent client requests and asynchronous webhook events (such as frontend verification + Razorpay `payment.captured` webhooks).

All email templates are crafted using responsive, table-based HTML layouts styled with Stadium Booking's navy/blue branding, complete with accessible plain-text fallbacks. In automated test environments, all email dispatches are intercepted and mocked without hitting external Resend APIs or exposing real customer email addresses. In local development environments without a configured `RESEND_API_KEY`, the application continues to function normally while recording `skipped` email log entries.

All existing in-app MongoDB notifications remain fully functional and intact. All regression suites spanning Phase 1, Phase 1.1, Phase 2A, hardening, and final audit passed with zero errors.

---

## Email Architecture

```
                                  ┌───────────────────────────┐
                                  │   Core Application Flow   │
                                  │ (Controllers/Expiry Job)  │
                                  └─────────────┬─────────────┘
                                                │ (Non-blocking / async)
                                                ▼
                                  ┌───────────────────────────┐
                                  │  utils/emailService.js    │
                                  │  - Validate recipient    │
                                  │  - Prepare templates      │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    models/EmailLog.js     │
                                  │  - DB Atomic Insert       │
                                  │  - idempotencyKey (unique)│
                                  └─────────────┬─────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │ Duplicate key error (E11000)                        │ Fresh key recorded ('queued')
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌───────────────────────────┐
        │  Skip Duplicate Send    │                           │    config/resend.js       │
        │  (Return skipped: true) │                           │  - Check RESEND_API_KEY   │
        └─────────────────────────┘                           └─────────────┬─────────────┘
                                                                            │
                                         ┌──────────────────────────────────┴──────────────────────────────────┐
                                         │ Unconfigured / Dev                                                  │ Configured (or Mock)
                                         ▼                                                                     ▼
                            ┌─────────────────────────┐                                           ┌───────────────────────────┐
                            │ Status: 'skipped'       │                                           │ Dispatch via Resend API   │
                            │ (Dev continues safely)  │                                           │ (or Mock Client in Tests) │
                            └─────────────────────────┘                                           └─────────────┬─────────────┘
                                                                                                                │
                                                                           ┌────────────────────────────────────┴────────────────────────────────────┐
                                                                           │ Success                                                                 │ Failure (Rate limit, network)
                                                                           ▼                                                                         ▼
                                                              ┌─────────────────────────┐                                               ┌─────────────────────────┐
                                                              │ Status: 'sent'          │                                               │ Status: 'failed'        │
                                                              │ providerMessageId saved │                                               │ Error recorded in log   │
                                                              └─────────────────────────┘                                               │ Core transaction SAFE   │
                                                                                                                                        └─────────────────────────┘
```

### 1. Resend Client (`backend/config/resend.js`)
* Initialized lazily using the official `resend` package.
* Avoids instantiating multiple client instances.
* Graceful fallback in development when `RESEND_API_KEY` is absent.
* Includes dependency-injection hook `setMockResendClient` and cross-process mock coordination for automated integration tests, preventing live network calls or real customer dispatch during testing.
* Centralizes system email addresses: sender identity (`EMAIL_FROM`), reply-to address (`EMAIL_REPLY_TO`), and administrator notifications (`ADMIN_NOTIFICATION_EMAIL`).

### 2. Email Service (`backend/utils/emailService.js`)
* Acts as the single abstraction layer between the application and email delivery; controllers never import or invoke Resend directly.
* Validates recipient format, sanitizes inputs, and rejects malformed addresses before touching the provider.
* Enforces failure isolation: all dispatch methods are wrapped in try/catch blocks and return standardized response objects (`{ success, skipped, reason, error }`), ensuring exceptions never propagate to caller controllers.
* Exposes 11 domain-specific helper methods:
  - `sendWelcomeEmail`
  - `sendBookingCreatedEmail`
  - `sendBookingConfirmedEmail`
  - `sendBookingRejectedEmail`
  - `sendBookingCancelledEmail`
  - `sendBookingExpiredEmail`
  - `sendPaymentSuccessEmail`
  - `sendPaymentFailedEmail`
  - `sendRefundProcessedEmail`
  - `sendAdminNewBookingEmail`
  - `sendAdminContactInquiryEmail`

### 3. Responsive HTML Templates (`backend/emails/`)
* Built with clean, table-based layouts compatible with Gmail, Apple Mail, Outlook, and mobile clients.
* Responsive viewport styling, high-contrast typography (Inter/system-ui), navy header banner (`#0f172a`), stadium brand badge, status indicators, itemized price breakdown tables (base price, GST, platform fee, grand total), and direct action buttons (CTAs).
* Accompanying plain-text fallbacks for accessibility and legacy mail clients.
* Sensitive technical data (passwords, JWT tokens, Mongo internal operator structures, Razorpay secrets) is strictly excluded from all template payloads.

### 4. Email Log & Idempotency (`backend/models/EmailLog.js`)
* Persists every email dispatch attempt with audit fields: `recipient`, `emailType`, `idempotencyKey`, `status` (`queued`, `sent`, `failed`, `skipped`), `subject`, `providerMessageId`, `attemptCount`, `lastError`, and non-sensitive `metadata`.
* Guaranteed duplicate prevention through a compound unique MongoDB index on `idempotencyKey`.

---

## Files Changed

| File | Change | Reason |
| --- | --- | --- |
| `backend/package.json` | Added `resend: ^4.1.2` and `"test:phase2-email"` script | Install official Resend SDK and add test automation runner |
| `backend/.env.example` | Added safe placeholders for `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ADMIN_NOTIFICATION_EMAIL` | Document necessary environment variables without leaking credentials |
| `backend/config/resend.js` | **[NEW]** Central Resend configuration module | Client initialization, fallback handling, sender config, and mock injection |
| `backend/models/EmailLog.js` | **[NEW]** Mongoose schema and model for email audit and idempotency | Track delivery state, audit attempts, and enforce uniqueness at DB level |
| `backend/config/db.js` | Added `EmailLog.verifyAndEnsureIndexes()` call to `connectDB` | Guarantee critical `idempotencyKey` unique index exists on server startup |
| `backend/emails/layout.js` | **[NEW]** Base responsive HTML layout and footer generator | Consistent Stadium Booking branding, responsive shell, and typography |
| `backend/emails/components.js` | **[NEW]** Reusable email components | Badges, summary tables, buttons, and help boxes |
| `backend/emails/welcomeEmail.js` | **[NEW]** Template for user registration | Warm welcome, platform features, dashboard CTA, support info |
| `backend/emails/bookingCreatedEmail.js` | **[NEW]** Template for booking request receipt | Booking reference, venue details, itemized pricing breakdown, pending status note |
| `backend/emails/bookingConfirmedEmail.js` | **[NEW]** Template for booking confirmation | Venue address, scheduled date/time, safety instructions, directions link |
| `backend/emails/bookingRejectedEmail.js` | **[NEW]** Template for administrative rejection | Rejection reason, next steps, alternative venue browsing link |
| `backend/emails/bookingCancelledEmail.js` | **[NEW]** Template for booking cancellation | Cancellation timestamp, refund status notes, support contact |
| `backend/emails/bookingExpiredEmail.js` | **[NEW]** Template for expired unpaid bookings | Payment timeout notice, slot release notification, rebook CTA |
| `backend/emails/paymentSuccessEmail.js` | **[NEW]** Template for successful payments | Razorpay payment reference, itemized GST breakdown, receipt CTA |
| `backend/emails/paymentFailedEmail.js` | **[NEW]** Template for payment failure | Safe error message, retry instructions, booking retention clarification |
| `backend/emails/refundProcessedEmail.js` | **[NEW]** Template for processed refunds | Refund reference, amount refunded, processing timeframe expectations |
| `backend/emails/adminNewBookingEmail.js` | **[NEW]** Template for admin notification on new bookings | Customer details, booked stadium, revenue details, admin link |
| `backend/emails/adminContactEmail.js` | **[NEW]** Template for admin notification on contact inquiries | Sender name, email, mobile, subject, inquiry text, reply-to link |
| `backend/utils/emailService.js` | **[NEW]** Reusable email dispatch service | Centralizes sending logic, error isolation, idempotency check, and template calls |
| `backend/controllers/authController.js` | Integrated `sendWelcomeEmail` in `registerUser` | Asynchronously send welcome email upon successful user registration |
| `backend/controllers/bookingController.js` | Integrated emails for booking lifecycle | Send customer + admin email on create; cancellation email on cancel; status change emails on admin update |
| `backend/controllers/paymentController.js` | Integrated emails for payment lifecycle | Dispatch payment success and booking confirmation on client verify & captured webhook; payment failed and refund processed on webhooks |
| `backend/controllers/contactController.js` | Integrated `sendAdminContactInquiryEmail` in `submitContactMessage` | Alert admin of customer contact submissions asynchronously |
| `backend/utils/paymentExpiryJob.js` | Integrated `sendBookingExpiredEmail` in stale booking cleanup | Notify users when unpaid pending bookings expire after timeout |
| `backend/controllers/adminController.js` | Added `getEmailLogs` endpoint | Allow administrators to review paginated email delivery logs and filter by status |
| `backend/routes/adminRoutes.js` | Mounted `GET /api/admin/email-logs` | Protected with `protect` and `adminOnly` middleware |
| `backend/scripts/retryFailedEmails.js` | **[NEW]** Standalone failed email recovery utility | Safe CLI tool to inspect failed emails and re-send with `--retry` flag |
| `backend/tests/phase2EmailVerification.js` | **[NEW]** Phase 2B test verification suite | Comprehensive automated verification covering all 21 acceptance criteria |

---

## Environment Variables

The following environment variables are supported and documented in `backend/.env.example`:

| Variable Name | Required | Default / Fallback | Description |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Optional in Dev / Required in Prod | `null` | API key from Resend dashboard (`re_...`) |
| `EMAIL_FROM` | Optional | `Stadium Booking <onboarding@resend.dev>` | Verified sender address and display name |
| `EMAIL_REPLY_TO` | Optional | `support@example.com` | Reply-to address for customer correspondence |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | `admin@example.com` | Destination inbox for administrative alerts |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Frontend URL used in email CTAs and links |

---

## Email Events

| Event | Recipient | Email Type | Idempotency Key Format |
| --- | --- | --- | --- |
| User Registration | Registered user | `welcome` | `welcome:<userId>` |
| Booking Created | Booking user | `booking_created` | `booking-created:<bookingId>` |
| Admin Alert: New Booking | Admin notification inbox | `admin_new_booking` | `admin-new-booking:<bookingId>` |
| Booking Confirmed | Booking user | `booking_confirmed` | `booking-confirmed:<bookingId>` |
| Booking Rejected | Booking user | `booking_rejected` | `booking-rejected:<bookingId>` |
| Booking Cancelled | Booking user | `booking_cancelled` | `booking-cancelled:<bookingId>` |
| Booking Expired (Unpaid) | Booking user | `booking_expired` | `booking-expired:<bookingId>` |
| Payment Success | Paying user | `payment_success` | `payment-success:<paymentId>` |
| Payment Failed | Paying user | `payment_failed` | `payment-failed:<paymentId>:<attemptTimestamp>` |
| Refund Processed | Paying user | `refund_processed` | `refund-processed:<paymentId>` |
| Admin Alert: Contact Inquiry | Admin notification inbox | `admin_contact_inquiry` | `admin-contact:<contactId>` |

---

## Email Idempotency

### The Race Condition Problem
During payment processing, two concurrent code paths frequently process the exact same payment:
1. The frontend client sends `POST /api/payments/verify` after the Razorpay modal succeeds.
2. Razorpay delivers an asynchronous `payment.captured` or `order.paid` webhook event to `POST /api/payments/webhook`.

Without database-backed idempotency, both paths would send duplicate emails to the customer ("Payment Successful" and "Booking Confirmed" twice).

### The Solution: Database Unique Index
1. Before any call to the Resend API or mock provider, `emailService.sendTransactionalEmail` attempts an atomic insert into the `email_logs` collection:
   ```javascript
   emailLog = await EmailLog.create({
     user,
     booking,
     payment,
     recipient: cleanRecipient,
     emailType,
     idempotencyKey,
     subject,
     status: 'queued',
     metadata
   });
   ```
2. The `email_logs` collection enforces a unique compound index on `idempotencyKey`:
   ```javascript
   emailLogSchema.index({ idempotencyKey: 1 }, { unique: true });
   ```
3. If an email with the same idempotency key is already queued, sent, or completed, MongoDB immediately throws error code `11000` (duplicate key constraint).
4. `sendTransactionalEmail` catches `err.code === 11000` and immediately logs:
   ```text
   [EMAIL_SKIPPED_DUPLICATE] [payment-success:6ab...] Email already queued or sent.
   ```
   and returns `{ success: true, skipped: true, reason: 'DUPLICATE_IDEMPOTENCY_KEY' }`.
5. The provider is **never** invoked a second time. This guarantees at the database level that exactly one email is delivered, eliminating race conditions.

---

## Failure Handling

### Core Isolation Principle
Transactional emails are secondary communication channels. Core business operations (bookings, payments, refunds, status changes) **must never fail** due to email provider issues.

1. **Provider Outage / Timeout:** If Resend returns an HTTP 500, 429 (rate limit), or network socket timeout, `sendTransactionalEmail` updates the corresponding `EmailLog` document to `status: 'failed'` and stores the sanitized error message in `lastError`.
2. **Controller Safety:** Controllers trigger email sends with fire-and-forget asynchronous promises or `.catch(() => {})` handlers. If an email fails, the HTTP response returned to the client (e.g. `201 Created`, `200 OK`) is never altered or delayed.
3. **Audit and Recovery:** All failed emails remain recorded in MongoDB with `status: 'failed'`. The system administrator can inspect these records via `GET /api/admin/email-logs?status=failed` and re-attempt delivery using `backend/scripts/retryFailedEmails.js --retry`.

---

## Security

1. **Secret & Key Protection:**
   - `RESEND_API_KEY`, `JWT_SECRET`, and `RAZORPAY_KEY_SECRET` are never exposed in email bodies, email headers, error logs, or client API responses.
   - Verified by automated Test 21 across all `EmailLog` database records.
2. **Email Header Injection Prevention:**
   - Recipient addresses are strictly validated against standard RFC regex patterns and normalized (`trim().toLowerCase()`).
   - Untrusted request arrays or newline-injected strings are rejected immediately with `INVALID_RECIPIENT` before dispatch.
3. **Authoritative Data Sources:**
   - All email content (names, stadium prices, GST breakdowns, total amounts, booking references) is populated strictly from verified MongoDB models and server-side payment computations—never from client request parameters.
4. **Account vs. Nominee Emails:**
   - Transactional emails are directed exclusively to the primary authenticated user's verified account email. Nominee information (`bookingPerson.name`) is displayed within the body text for identification purposes, but private account notifications are not broadcast to third parties.

---

## Database Changes

### EmailLog Collection (`email_logs`)
New collection created to store transactional email audit records.

```javascript
{
  user: { type: ObjectId, ref: 'User' },
  booking: { type: ObjectId, ref: 'Booking' },
  payment: { type: ObjectId, ref: 'Payment' },
  recipient: { type: String, required: true, lowercase: true, trim: true },
  emailType: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'sent', 'failed', 'skipped'],
    default: 'queued'
  },
  provider: { type: String, default: 'resend' },
  providerMessageId: { type: String },
  idempotencyKey: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  attemptCount: { type: Number, default: 1 },
  lastError: { type: String },
  sentAt: { type: Date },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

### Indexes Enforced
1. `{ idempotencyKey: 1 }` (unique: true)
2. `{ recipient: 1, emailType: 1 }`
3. `{ status: 1 }`
4. `{ booking: 1 }`
5. `{ payment: 1 }`
6. `{ createdAt: -1 }`

---

## Tests

### Phase 2B Email Verification Suite (`npm run test:phase2-email`)
* **Total Checks:** 21
* **Passed:** 21
* **Failed:** 0

Detailed Test Breakdown:
- **Category 1: Email Service Core Behavior**
  - Test 1: Configured email sends through service and records message ID — `PASS`
  - Test 2: Invalid recipient address safely rejected without provider dispatch — `PASS`
  - Test 3: Provider failure isolated gracefully and logged as status: failed — `PASS`
- **Category 2: User Registration Email**
  - Test 4: Successful user registration triggers welcome email — `PASS`
  - Test 5: Duplicate execution blocked by idempotency key (zero duplicate welcome emails) — `PASS`
  - Test 6: User registration remains completely successful (201) when email provider fails — `PASS`
- **Category 3: Booking Transactional Emails**
  - Test 7: Booking creation triggers both customer booking-created and admin notification emails — `PASS`
  - Test 8: Booking cancellation dispatches cancellation email — `PASS`
  - Test 9: Admin booking rejection dispatches booking-rejected email with reason — `PASS`
  - Test 10: Booking confirmed dispatches booking-confirmed email — `PASS`
  - Test 11: Duplicate confirmation path (admin / payment / webhook) produces exactly ONE confirmation email — `PASS`
  - Test 12: Booking expiration due to payment timeout dispatches booking-expired email — `PASS`
- **Category 4: Payment Transactional Emails**
  - Test 13: Client payment verification dispatches payment-success receipt email — `PASS`
  - Test 14: Webhook arrival after client verify does NOT send duplicate payment email — `PASS`
  - Test 15: Payment failure dispatches payment-failed email without cancelling booking — `PASS`
  - Test 16: Refund event dispatches refund-processed email — `PASS`
- **Category 5: Contact Inquiry Email**
  - Test 17: Public contact inquiry saves to DB and triggers admin notification email — `PASS`
- **Category 6: Admin Log Viewer & Retry Utility**
  - Test 18: Admin endpoint `GET /api/admin/email-logs` returns paginated audit records — `PASS`
  - Test 19: Non-admin user blocked from `/api/admin/email-logs` with 403 Forbidden — `PASS`
  - Test 20: Email retry utility executes cleanly in dry-run mode — `PASS`
- **Category 7: Security & Sensitive Data Leak Prevention**
  - Test 21: Zero secrets, passwords, JWTs, or payment keys leaked in EmailLog database records — `PASS`

---

### Full System Regression Suites

| Test Suite | Command | Total | Passed | Failed | Skipped | Status |
| --- | --- | --- | --- | --- | --- | --- |
| **Phase 2B Email** | `npm run test:phase2-email` | 21 | 21 | 0 | 0 | **PASS** |
| **Phase 2A Payment** | `npm run test:phase2-payment` | 30 | 30 | 0 | 0 | **PASS** |
| **Phase 1.1 Edge-Cases** | `npm run test:phase1-edge` | 25 | 25 | 0 | 0 | **PASS** |
| **Phase 1 Hardening** | `npm run test:phase1` | 29 | 29 | 0 | 0 | **PASS** |
| **API Hardening** | `npm run test:hardening` | 34 | 33 | 0 | 1 | **PASS** |
| **Final Backend Audit** | `npm run test:final-audit` | 21 | 21 | 0 | 0 | **PASS** |
| **Independent Verification** | `node tests/finalIndependentVerification.js` | 40 | 40 | 0 | 0 | **PASS** |

---

## Remaining Risks

1. **Domain Verification Requirement in Production:**
   - In production, Resend requires a custom sending domain (e.g. `mail.stadiumbooking.com`) with SPF, DKIM, and DMARC DNS records configured. When using default test domains (`onboarding@resend.dev`), Resend restricts sending only to the email address of the account owner. Once a custom domain is verified in the Resend dashboard, `EMAIL_FROM` must be updated to match the verified domain.
2. **Resend Inbound Delivery Webhooks (Phase 2B.1):**
   - As planned, Resend incoming delivery status webhooks (`email.delivered`, `email.bounced`, `email.complained`) were intentionally deferred to prevent scope creep. Outbound delivery and idempotency are fully operational. Inbound delivery webhooks can be introduced in Phase 2B.1 without impacting any existing contracts.

---

## Phase 2C Readiness

All requirements for Phase 2B have been implemented, tested, and verified against all active backend components.

READY FOR PHASE 2C
