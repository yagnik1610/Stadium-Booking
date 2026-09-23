# 🏟️ Stadium Booking System

A production-grade, full-stack **MERN (MongoDB, Express.js, React, Node.js)** web platform for stadium, arena, and sports turf slot reservations with atomic concurrency locking, Razorpay payment processing, Resend transactional emails, and Cloudinary media management.

---

## 🌟 Executive Overview

Stadium Booking System provides a modern digital infrastructure for sports facilities and athletic enthusiasts. Users can search and filter venues across sports categories and geographic locations, book real-time hourly turf and stadium slots, complete secure payments via Razorpay, and receive verifiable QR digital passes alongside transactional email notifications. Administrators manage stadiums, upload multi-resolution venue photography, track occupancy analytics, handle booking refunds/cancellations, and configure platform settings.

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.21+)
- **Database:** MongoDB (via Mongoose v8.10+) with compound uniqueness indexes and replica-set transaction support
- **Authentication & Security:** JWT (HMAC-SHA256), Bcrypt.js, Helmet, Express-Rate-Limit, Express-Mongo-Sanitize, CORS
- **Payments:** Razorpay API & Webhook Verification (HMAC-SHA256 signature verification)
- **Transactional Emails:** Resend API with `EmailLog` database-level idempotency and automated retry workers
- **Media Storage:** Cloudinary SDK with Multer in-memory streaming and strict MIME validation

### Frontend
- **Framework:** React 18 (Vite 6 build system)
- **Styling:** Tailwind CSS with custom sports aesthetic tokens and responsive grid layouts
- **Routing:** React Router DOM (v7) with role-based route guards (`ProtectedRoute`)
- **Icons & QR Codes:** Lucide React icons, QRCode dynamic canvas rendering

### Quality Assurance & End-to-End Verification
- **E2E Testing:** Playwright (50 automated specs testing User, Admin, and Guest journeys)
- **Backend Testing:** Custom Node.js regression suites (245+ automated verification checks)

---

## ⚡ Core Platform Capabilities

### 1. Atomic Booking Concurrency & SlotLock Architecture
- **Race Condition Prevention:** Bookings enforce a dedicated `SlotLock` MongoDB model with a unique compound index:
  ```javascript
  { stadium: 1, date: 1, timeSlot: 1 } // unique: true
  ```
- **Atomicity:** When a user initiates a booking, an atomic `SlotLock` acquisition is attempted. If two users attempt to book the identical slot concurrently, one succeeds immediately while the second receives an explicit HTTP 409 conflict error.
- **Auto-Expiration:** Stale pending reservations automatically release slot locks after 10 minutes via background sweeper tasks and scheduled reconciliation jobs.

### 2. Hardened Payment Lifecycle (Razorpay)
- **Cryptographic Signatures:** Every payment callback verifies HMAC-SHA256 signatures (`razorpay_order_id|razorpay_payment_id`).
- **Webhook Resilience:** Razorpay webhooks (`order.paid`, `payment.captured`, `payment.failed`) mount raw buffer verification before JSON parsing to guarantee signature integrity.
- **Idempotency:** Payment transitions are idempotent; redundant webhook calls or user browser refreshes do not produce duplicate receipts or double-charge bookings.

### 3. Transactional Email System (Resend)
- **Lifecycle Notifications:** Automated emails for booking confirmation, payment receipts, cancellation alerts, and administrative notices.
- **Delivery Idempotency:** Managed via an `EmailLog` collection that records message IDs, attempt counts, and delivery states (`sent`, `failed`).
- **Fault-Tolerant Retries:** A dedicated operational utility (`retryFailedEmails.js`) processes failed deliveries with exponential backoff.

### 4. Cloud-Native Media Uploads (Cloudinary + Multer)
- **Memory Storage:** Uploads process in-memory buffers directly to Cloudinary without writing temporary files to the server disk.
- **Security Validation:** Strict MIME whitelist (`image/jpeg`, `image/png`, `image/webp`) and maximum file size restrictions (5MB).
- **Cleanup & Backward Compatibility:** Replacing or deleting venue images safely purges old assets from Cloudinary via public IDs while preserving legacy external image URLs without disruption.

---

## 👥 Features Breakdown

### User Experience
- **Discovery & Search:** Multi-criteria search by sport category, venue name, state, and city.
- **Real-Time Availability:** Visual schedule grid indicating available, locked, and booked time slots.
- **Booking Management:** Detailed reservation view with dynamic QR passes for turnstile check-in.
- **Reviews & Ratings:** Authenticated post-match reviews with 5-star ratings and written feedback.
- **Favorites:** One-click stadium bookmarking stored in user profile.
- **In-App Notifications:** Real-time alert notifications on payment, approval, or cancellation events.

### Administrator Experience
- **Overview Analytics:** Real-time revenue charts, active bookings, total stadiums, and user counts.
- **Venue Management (CRUD):** Add and edit stadiums, configure pricing per hour, operating hours, amenities, and sports.
- **Media Center:** Direct upload and replacement of stadium cover banners and gallery photos.
- **Booking Oversight:** Filter bookings by status (`pending`, `confirmed`, `cancelled`), approve or reject reservations, and trigger refunds.
- **User & Review Moderation:** Inspect registered profiles, manage account status, and moderate user reviews.
- **Platform Maintenance Mode:** Instant toggle in settings to pause new bookings during scheduled maintenance while preserving read access.

---

## 📁 Repository Structure

```text
stadium-booking/
├── backend/
│   ├── config/                  # Database, Cloudinary, Razorpay, Resend, Env validator
│   ├── controllers/             # Express business logic controllers
│   ├── emails/                  # Transactional HTML email templates
│   ├── middleware/              # Auth, RBAC, error handlers, upload middleware
│   ├── models/                  # Mongoose models (User, Stadium, Booking, SlotLock, etc.)
│   ├── routes/                  # Express API route declarations
│   ├── scripts/                 # Operational, audit, and recovery utilities
│   ├── tests/                   # 8 regression suites (245+ automated checks)
│   ├── utils/                   # Email service, media service, logger, expiry job
│   ├── validators/              # Express-validator request sanitization rules
│   ├── .env.example             # Backend environment template
│   ├── package.json             # Backend dependencies and test scripts
│   └── server.js                # Authoritative server entry point
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI cards, modals, layout, and admin components
│   │   ├── config/              # Centralized fallback images and constants
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── data/                # Location dictionaries (countries, states, cities)
│   │   ├── pages/               # User pages and nested Admin management views
│   │   ├── routes/              # Protected and public route definitions
│   │   ├── services/            # Axios API client with auth interceptors
│   │   ├── App.jsx              # Main React router tree
│   │   └── main.jsx             # React DOM entry point
│   ├── .env.example             # Frontend environment template
│   ├── package.json             # Frontend dependencies and Vite build scripts
│   └── vite.config.js           # Vite configuration
├── e2e/
│   ├── fixtures/                # Valid/invalid media fixtures for E2E tests
│   ├── helpers/                 # Test factories, auth helpers, cleanup scripts
│   └── *.spec.js                # 50 Playwright E2E browser test specifications
├── docs/
│   └── audits/                  # Chronological hardening, audit, and verification reports
├── playwright.config.js         # Playwright test configuration
├── package.json                 # Root orchestrator scripts
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** v7.0 or higher (running locally or MongoDB Atlas)
- **npm:** v9.0 or higher

### 1. Environment Setup

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and configure:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/stadium_booking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Razorpay (Test Credentials)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Resend Email Integration
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=onboarding@resend.dev

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin Initial Seed
ADMIN_EMAIL=admin@stadium.com
ADMIN_PASSWORD=your_secure_password
```

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` (optional for local development, defaults to `http://localhost:5000/api`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Dependency Installation
```bash
# Install root, backend, and frontend dependencies
npm run install-all
```

### 3. Database Initialization & Seeding
```bash
npm run seed
```

### 4. Running the Development Servers
```bash
# Launches both Backend (port 5000) and Frontend (port 5173) concurrently
npm run dev
```
- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Probe:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Verification

### End-to-End Playwright Testing
```bash
# Run all 50 E2E tests across guest, user, and admin workflows
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui
```

### Backend Automated Regression Suites
The backend includes 8 specialized verification suites covering every subsystem:
```bash
# Complete production audit (health, security, middleware, indexes)
npm run test:phase3 --prefix backend

# Cloudinary media upload and validation tests
npm run test:phase2-media --prefix backend

# Resend email and EmailLog idempotency tests
npm run test:phase2-email --prefix backend

# Razorpay payment hardening and signature verification
npm run test:phase2-payment --prefix backend

# Booking concurrency and atomic SlotLock edge-case tests
npm run test:phase1-edge --prefix backend

# Core API hardening tests
npm run test:phase1 --prefix backend

# Final independent audit suite
npm run test:final-audit --prefix backend
```

### Frontend Production Build
```bash
npm run build --prefix frontend
```

---

## 🔒 Security & Best Practices

- **Strict Input Sanitization:** All incoming requests pass through `express-validator` and `express-mongo-sanitize` to defend against SQL/NoSQL injection and XSS.
- **HMAC Signature Guards:** Payment verification computes SHA-256 HMACs using secret keys; raw byte streams are preserved for webhook payload integrity.
- **No Secret Leakage:** Environment variables are validated on startup via `validateEnv.js`. Password hashes utilize 10-round bcrypt salts. Stack traces are suppressed in production mode.
- **Operational Graceful Shutdown:** `SIGTERM` and `SIGINT` signals initiate ordered shutdowns: background sweeper termination, active connection drain, and clean MongoDB closure.

---

## 📄 License
ISC License. Built for production stadium booking and sports management operations.
