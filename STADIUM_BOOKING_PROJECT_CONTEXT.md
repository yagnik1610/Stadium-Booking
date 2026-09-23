# STADIUM BOOKING SYSTEM — COMPLETE MASTER PROJECT CONTEXT & ARCHITECTURAL SPECIFICATION

> **Document Type:** Master Architectural Knowledge Base & ChatGPT Handoff Specification  
> **Target Audience:** Developers, Technical Leads, and AI Systems (ChatGPT, Claude, Antigravity)  
> **Repository Root:** `stadium-booking/`  
> **Source Verification Date:** September 2026  
> **Status:** Fully Audited & Cross-Referenced from Source Code  

---

# 1. PROJECT OVERVIEW

### Project Name
**Stadium Booking System** (internally branded in legacy templates as *StadiumX* and in business operations as *Stadium Booking Operations* / *SBS*).

### Main Purpose
A high-performance, full-stack **MERN (MongoDB, Express.js, React, Node.js)** sports facility management and hourly slot reservation platform. The system facilitates discovery, dynamic availability checking, time-slot reservation, nominee booking, payment recording, and review management for multi-sport arenas, cricket stadiums, football turfs, tennis courts, and sports complexes.

### What Problem the Application Solves
- **Eliminates Manual & Double Bookings:** Replaces phone-call or WhatsApp turf scheduling with real-time algorithmic slot reservation, preventing overlapping bookings.
- **Dynamic Capacity & Audience Controls:** Enforces player capacity limits, spectator ticket quotas, and venue safety compliance per sport.
- **Multi-Duration & Sport-Specific Rules:** Accommodates variable match durations (e.g. 1h football vs. 2h+ cricket) with tailored rules, required player equipment, and duration increments.
- **Dual-Pane Administration:** Provides stadium administrators with a dedicated control panel to monitor revenue, manage venues, approve/reject bookings, configure pricing/GST, view audit logs, and broadcast announcements without interfering with customer workspaces.

### Target Users
1. **Public Guests:** Discover active sports venues, filter by country/state/city/sport, inspect amenities, hourly pricing, safety protocols, and real-time slot availability.
2. **Athletes & Teams (Registered Users):** Reserve venues for themselves or nominees, pick available start times and durations, track reservation lifecycles, pay via Razorpay gateway, download digital tax receipts, save favorites, and write reviews.
3. **Venue Managers & Super Admins:** Oversee multi-city venues, manage sport rules, adjust tax/cancellation policies, review revenue metrics, execute booking status transitions, deactivate stadiums, and inspect immutable system activity logs.

### Main Use Cases
- Booking an illuminated turf slot for 1–4 hours on an upcoming date.
- Booking on behalf of a friend or team captain (`bookingFor: 'someone_else'`).
- Validating real-time availability dynamically based on venue operating hours and active reservations.
- Online payment capture and cryptographic signature verification with Razorpay.
- Admin management of sports rules, safety terms, business settings, and platform metrics.

### Current Development Stage
**Late-Stage MVP / Pre-Production Hardened.**  
The core user and administrative lifecycles, database models, REST APIs, dynamic booking modal, role-based route guards, and Razorpay payment integration are fully functional. Secondary features like automated SMTP/Resend email dispatch, multipart image file upload (Multer/Cloudinary), and automated server-side Razorpay webhook listeners are architected via mock or direct URL fallbacks and await production infrastructure hookup.

### Major Implemented Features
- Full JWT authentication with bcrypt password hashing, login identifier flexibility (Email or Admin Login ID), and protected routes.
- Dual frontend workspaces: Isolated Public/User workspace (`/`, `/stadiums`, `/dashboard/*`) and isolated Admin workspace (`/admin/*`).
- 5-step dynamic booking modal with interactive sport selection, calendar date picking, duration-first slot calculation, player count validation, and terms consent.
- Real-time slot availability generation engine calculating non-overlapping windows within stadium operating hours.
- Complete Admin Portal: Dashboard analytics, users table with role toggles, stadium form (creation/editing/soft deletion), sports management, booking approval/rejection lifecycle, revenue ledger, and audit log inspection.
- Razorpay order creation and HMAC-SHA256 signature verification.
- In-app notification center with read/unread tracking and admin broadcast capabilities.
- Favorites system with database-level compound unique indexing.
- Verified review system linked exclusively to completed bookings.

### Major Incomplete / Planned Features
- **File/Image Upload Service:** Current venue and user images rely on external HTTPS URLs (e.g., Unsplash CDN). No local Multer storage or Cloudinary SDK is integrated.
- **Outbound Email Transport:** No Nodemailer or Resend client exists in backend dependencies. Notifications are in-app and saved in MongoDB.
- **Webhook Listener for Razorpay:** Payments are verified synchronously via client-submitted payment signatures; an asynchronous webhook listener for missed callbacks is not yet mounted.

---

# 2. COMPLETE TECHNOLOGY STACK

## Frontend
- **Framework:** React 18 (`react` `^18.3.1`, `react-dom` `^18.3.1`)
- **Language:** JavaScript (ES6+ / JSX)
- **Build Tool:** Vite 6 (`vite` `^6.1.0`, `@vitejs/plugin-react` `^4.3.4`)
- **CSS Solution:** Tailwind CSS (`tailwindcss` `^3.4.17`, `postcss` `^8.5.2`, `autoprefixer` `^10.4.20`)
- **UI & Helper Libraries:** `clsx` (`^2.1.1`), `tailwind-merge` (`^3.0.1`), `canvas-confetti` (`^1.9.4`), `qrcode` (`^1.5.4`)
- **Icons:** `lucide-react` (`^0.475.0`)
- **Routing:** React Router v7 (`react-router-dom` `^7.1.5`)
- **State Management:** React Context API (`AuthContext.jsx` for auth state, `ToastContext.jsx` for alert banners)
- **HTTP / API Client:** Axios (`axios` `^1.7.9`) with centralized request token injection and error unwrapping interceptors
- **Authentication Handling:** Client JWT persistence in `localStorage` under key `stadium_token`; Bearer token header injection
- **Form Handling & Validation:** Controlled React component state with inline regex checking and international phone number validation
- **Date/Time Handling:** Native JavaScript `Date` and custom minute arithmetic utilities
- **Maps / Location:** Structured country, state, and city dictionaries (`locationData.js`, `indiaLocations.js`) with external Google Maps navigation links (No Google Maps JavaScript SDK dependency)
- **Payment Library:** Client-side Razorpay Checkout script dynamically injected via `https://checkout.razorpay.com/v1/checkout.js`

## Backend
- **Runtime:** Node.js (CommonJS modules)
- **Framework:** Express.js (`express` `^4.21.2`)
- **Language:** JavaScript (Node.js runtime)
- **Authentication:** JSON Web Tokens (`jsonwebtoken` `^9.0.2`), `bcryptjs` (`^2.4.3`) for 10-round salted password hashing
- **Authorization:** Role-Based Access Control (`role: 'user' | 'admin'`) enforced via `protect` (`authMiddleware.js`) and `admin` (`adminMiddleware.js`)
- **API Architecture:** RESTful JSON API organized under `/api/*`
- **Validation:** Manual backend sanitization with regex format checks; `express-validator` (`^7.2.1`) installed as a dependency
- **File Uploads:** Not integrated (no Multer / Cloudinary); image URLs stored as strings
- **Email Service:** None installed (No Nodemailer, SendGrid, or Resend in backend)
- **Logging:** `morgan` (`^1.10.0`) in `dev` mode; custom database audit logging via `auditLogger.js` (`AuditLog` model)
- **Error Handling:** Centralized Express error handler (`errorMiddleware.js`) handling Mongoose `CastError`, duplicate key `E11000`, `ValidationError`, and JSON syntax errors
- **Security Middleware:** `helmet` (`^8.0.0`), `cors` (`^2.8.5`), strict body parser limits (`10kb`)
- **Rate Limiting:** `express-rate-limit` (`^7.5.0`) configured on authentication routes (`100/15m` for login, `50/15m` for register)
- **Payment Processing:** Official Razorpay Node SDK (`razorpay` `^2.9.8`) with server-side HMAC-SHA256 signature verification

## Database
- **Database Engine:** MongoDB (Compatible with local MongoDB and MongoDB Atlas)
- **ODM:** Mongoose (`mongoose` `^8.10.0`)
- **Collections / Models:**
  1. `users` (`User.js`)
  2. `stadiums` (`Stadium.js`)
  3. `bookings` (`Booking.js`)
  4. `payments` (`Payment.js`)
  5. `reviews` (`Review.js`)
  6. `favorites` (`Favorite.js`)
  7. `notifications` (`Notification.js`)
  8. `sports` (`Sport.js`)
  9. `settings` (`Setting.js`)
  10. `auditlogs` (`AuditLog.js`)
  11. `contactmessages` (`ContactMessage.js`)
- **Relationships:** Referenced ObjectIds (`ref`) with Mongoose `.populate()`, supported by compound unique and indexing constraints.

## Deployment / Infrastructure
- **Server Entry:** `backend/server.js` (listening on `PORT` or fallback `5000`)
- **Client Entry:** `frontend/src/main.jsx` built with `vite build` to `frontend/dist`
- **Root Orchestrator:** `concurrently` (`^9.1.2`) running frontend and backend simultaneously via `npm run dev`
- **CORS Config:** Configured for `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, and `process.env.CLIENT_URL`

---

# 3. PROJECT FOLDER STRUCTURE

```text
stadium-booking/
├── package.json                         # Root runner scripts (concurrently dev runner)
├── package-lock.json                    # Root lockfile
├── README.md                            # High-level overview & legacy quickstart guide
├── ADMIN_DASHBOARD_IMPLEMENTATION_REPORT.md  # Audit & implementation report for Admin features
├── ADMIN_DIAGNOSTIC_AUDIT.md            # Deep diagnostic log of admin features & models
├── ADMIN_IMPLEMENTATION_REPORT.md       # Implementation notes for admin panel endpoints
├── ADMIN_PHASE1_REPAIR_REPORT.md        # Security & RBAC remediation report
├── FINAL_CONNECTION_VERIFICATION_REPORT.md # Verification of frontend-backend API contracts
├── FRONTEND_BACKEND_INTEGRATION_REPORT.md  # Route mapping & payload verification document
│
├── backend/                             # Express.js REST API Server
│   ├── .env                             # Active environment configuration (DO NOT COMMIT)
│   ├── .env.example                     # Environment template showing required variable names
│   ├── .gitignore                       # Git ignore rules for backend
│   ├── package.json                     # Backend dependencies & test scripts
│   ├── package-lock.json                # Backend dependency lockfile
│   ├── server.js                        # Primary backend entry point & Express route mounting
│   ├── API_DOCUMENTATION.md             # Developer documentation of API endpoints
│   ├── data_store.json                  # Static reference archive from early prototype (unused in runtime)
│   ├── config/
│   │   ├── db.js                        # Mongoose MongoDB connection initializer
│   │   └── razorpay.js                  # Razorpay instance factory & key validation
│   ├── controllers/                     # Business logic controllers
│   │   ├── adminController.js           # Admin users, logs, settings, and broadcast logic
│   │   ├── adminDashboardController.js  # Dashboard aggregations, analytics, and reports
│   │   ├── authController.js            # User registration, login, and JWT generation
│   │   ├── bookingController.js         # Booking CRUD, overlap prevention, and status workflows
│   │   ├── contactController.js         # Public contact message submission
│   │   ├── favoriteController.js        # User favorites toggle and checking
│   │   ├── notificationController.js    # User in-app notifications management
│   │   ├── paymentController.js         # Razorpay order generation and HMAC signature check
│   │   ├── reviewController.js          # Completed booking reviews and ratings
│   │   ├── sportController.js           # Sport catalog management and auto-seeding
│   │   ├── stadiumController.js         # Stadium CRUD, filtering search, and slot availability engine
│   │   └── userController.js            # User profile management and password change
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT verification and req.user attachment
│   │   ├── adminMiddleware.js           # Admin role authorization guard
│   │   └── errorMiddleware.js           # Global error handler and 404 router
│   ├── models/                          # Mongoose Schemas & Models
│   │   ├── AuditLog.js                  # Administrative action audit trail
│   │   ├── Booking.js                   # Slot bookings, nominee info, pricing, and status
│   │   ├── ContactMessage.js            # Customer contact form submissions
│   │   ├── Favorite.js                  # User bookmarked stadiums (compound unique indexed)
│   │   ├── Notification.js              # User in-app alert notifications
│   │   ├── Payment.js                   # Razorpay transaction orders and verified signatures
│   │   ├── Review.js                    # Verified booking reviews (compound unique indexed)
│   │   ├── Setting.js                   # Global operations and business settings
│   │   ├── Sport.js                     # Sports configuration catalog
│   │   ├── Stadium.js                   # Stadium venue details, operating hours, and capacities
│   │   └── User.js                      # User schema with bcrypt hooks and role definitions
│   ├── routes/                          # Express REST API Route Declarations
│   │   ├── adminDashboardRoutes.js      # /api/admin/dashboard, /analytics, /reports
│   │   ├── adminRoutes.js               # /api/admin/users, /activity, /settings, /broadcast
│   │   ├── authRoutes.js                # /api/auth/register, /login, /profile
│   │   ├── bookingRoutes.js             # /api/bookings, /my, /admin/all, /:id/cancel, /:id/status
│   │   ├── contactRoutes.js             # /api/contact
│   │   ├── favoriteRoutes.js            # /api/favorites, /my, /check/:stadiumId
│   │   ├── notificationRoutes.js        # /api/notifications, /my, /unread-count, /read-all
│   │   ├── paymentRoutes.js             # /api/payments/create-order, /verify, /my, /admin/all
│   │   ├── reviewRoutes.js              # /api/reviews, /stadium/:id, /eligible-bookings, /my
│   │   ├── sportRoutes.js               # /api/sports, /:id
│   │   ├── stadiumRoutes.js             # /api/stadiums, /search, /admin/all, /:id/availability
│   │   └── userRoutes.js                # /api/users/profile, /change-password
│   ├── scripts/
│   │   ├── migrateLegacyData.js         # Migration utility for older schema versions
│   │   └── seedStadiums.js              # Comprehensive venue seeder for Indian & international venues
│   ├── tests/                           # Exhaustive API and integration test suites (23 files)
│   │   ├── finalIndependentVerification.js # Master end-to-end integration test runner
│   │   └── ...                          # Domain-specific test files
│   ├── utils/
│   │   ├── auditLogger.js               # Helper to write to AuditLog collection
│   │   ├── configureAdminAccount.js     # Script to provision/update an admin account
│   │   ├── createAdmin.js               # Standalone admin account creation script
│   │   ├── fixIndex.js                  # Index maintenance script
│   │   ├── notificationHelper.js        # Safe non-blocking notification dispatcher
│   │   └── resetAdminPassword.js        # Script to reset admin password
│   └── src/                             # LEGACY/DRAFT CODEBASE (Do NOT use in active runtime)
│       ├── config/, controllers/, middleware/, models/, routes/, server.js
│
└── frontend/                            # React + Vite Client Application
    ├── .env                             # Frontend environment configuration (VITE_API_BASE_URL)
    ├── index.html                       # HTML document root with Inter/Poppins font imports
    ├── package.json                     # Frontend dependencies & Vite scripts
    ├── package-lock.json                # Frontend lockfile
    ├── postcss.config.js                # PostCSS config for Tailwind
    ├── tailwind.config.js               # Tailwind custom color palette & theme extensions
    ├── vite.config.js                   # Vite React plugin & bundler configuration
    ├── public/                          # Static assets and favicon
    └── src/
        ├── App.jsx                      # Client router, layout nesting, and protected route wiring
        ├── main.jsx                     # React DOM root entry
        ├── index.css                    # Tailwind directives and custom scrollbar styles
        ├── components/
        │   ├── Navbar.jsx               # Public responsive navigation header
        │   ├── Footer.jsx               # Public footer with sitemap links
        │   ├── StadiumCard.jsx          # Reusable stadium card with badges and pricing
        │   ├── admin/                   # Admin Panel Component Shell
        │   │   ├── AdminHeader.jsx      # Admin top bar with user profile dropdown & search
        │   │   ├── AdminLayout.jsx      # Layout container wrapping AdminSidebar & AdminHeader
        │   │   ├── AdminPagination.jsx  # Reusable data table pagination bar
        │   │   ├── AdminSidebar.jsx     # Nav links for 16 admin modules
        │   │   ├── ConfirmDialog.jsx    # Action confirmation modal
        │   │   └── StatusBadge.jsx      # Colored pill badge for booking/payment statuses
        │   ├── booking/
        │   │   └── DynamicBookingModal.jsx # 5-step booking wizard with dynamic slots
        │   ├── common/
        │   │   └── Button.jsx           # Generic button component
        │   ├── layout/
        │   │   ├── AuthenticatedLayout.jsx # Wrapper for user dashboard with UserSidebar
        │   │   ├── PublicLayout.jsx     # Wrapper with public Navbar and Footer
        │   │   ├── UserNavbar.jsx       # Authenticated top navigation with notifications badge
        │   │   └── UserSidebar.jsx      # User dashboard left navigation drawer
        │   ├── payment/
        │   │   └── ReceiptModal.jsx     # Printable & scannable digital booking tax receipt
        │   ├── review/
        │   │   └── ReviewModal.jsx      # Star rating and review submission dialog
        │   └── ui/                      # Shared atomic UI components
        │       ├── Badge.jsx, Button.jsx, Card.jsx, EmptyState.jsx, ErrorState.jsx, SectionHeading.jsx, Skeleton.jsx
        ├── config/
        │   └── images.js                # Curated high-resolution Unsplash photo links
        ├── constants/
        │   └── images.js                # Re-export of images configuration
        ├── context/
        │   ├── AuthContext.jsx          # Authentication state, login, register, token handling
        │   └── ToastContext.jsx         # Toast notifications system
        ├── data/
        │   ├── indiaLocations.js        # Detailed dictionary of 24 Indian states and cities
        │   └── locationData.js          # Multi-country international calling codes and cities
        ├── pages/                       # User & Public Page Views
        │   ├── About.jsx                # Company information and platform pillars
        │   ├── BookingDetail.jsx        # Single booking view, payment trigger, pass, review trigger
        │   ├── Contact.jsx              # Customer support inquiry submission form
        │   ├── Dashboard.jsx            # User hub (today's games, upcoming slots, metrics)
        │   ├── Favorites.jsx            # Bookmarked stadium grid
        │   ├── Home.jsx                 # Public landing page with hero, search, features, CTA
        │   ├── Login.jsx                # Email/Password sign-in with role-aware redirection
        │   ├── MyBookings.jsx           # Filterable table of user's past and upcoming bookings
        │   ├── Notifications.jsx        # In-app notifications feed with mark-as-read
        │   ├── Payments.jsx             # Payment transaction history and receipt access
        │   ├── Profile.jsx              # User personal info and mobile/location update
        │   ├── Register.jsx             # Multi-step customer registration form
        │   ├── Reviews.jsx              # Reviews authored by the logged-in user
        │   ├── Settings.jsx             # User password change and preference toggles
        │   ├── StadiumDetail.jsx        # Full stadium specs, sports, safety rules, reviews, booking modal
        │   ├── Stadiums.jsx             # Public search, country/city/sport filterable venue grid
        │   └── admin/                   # Administrative Management Views (20 files)
        │       ├── AdminActivityLog.jsx   # System audit log table
        │       ├── AdminAnalytics.jsx     # Revenue & booking analytical charts
        │       ├── AdminAvailability.jsx  # Visual slot availability calendar
        │       ├── AdminBookingDetail.jsx # Deep inspection and status override for a booking
        │       ├── AdminBookings.jsx      # Filterable bookings ledger with quick approvals
        │       ├── AdminNotifications.jsx # Broadcast alert creation to all or specific users
        │       ├── AdminOverview.jsx      # Admin master dashboard with KPI cards and charts
        │       ├── AdminPayments.jsx      # Financial ledger of all Razorpay transactions
        │       ├── AdminProfile.jsx       # Admin profile view
        │       ├── AdminReports.jsx       # Exportable operational and financial summaries
        │       ├── AdminReviews.jsx       # Moderation table of customer reviews
        │       ├── AdminSafetyRules.jsx   # Global safety rules editor
        │       ├── AdminSettings.jsx      # Platform configuration (GST, business info, policies)
        │       ├── AdminSports.jsx        # Sport configuration catalog and rule management
        │       ├── AdminStadiumDetail.jsx # Read-only deep inspect view of a venue
        │       ├── AdminStadiumForm.jsx   # Venue creation and modification form
        │       ├── AdminStadiums.jsx      # Venue inventory table with deactivation toggles
        │       ├── AdminTerms.jsx         # Terms & Conditions editor
        │       ├── AdminUserDetail.jsx    # Customer profile with booking/spend history
        │       └── AdminUsers.jsx         # User directory with role and active status management
        ├── routes/
        │   └── ProtectedRoute.jsx       # Role-based route protectors (ProtectedRoute & AdminRoute)
        └── services/
            └── api.js                   # Central Axios client with interceptors and grouped API modules
```

---

# 4. FRONTEND ARCHITECTURE

### Page & Component Table

| Page / Component | File Path | Purpose | API Endpoint(s) Used | Auth Required? | Role |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Home** | `src/pages/Home.jsx` | Landing page, hero, sport discovery, featured venues | `GET /api/stadiums` | No | Public |
| **About** | `src/pages/About.jsx` | About the platform and operations | None | No | Public |
| **Contact** | `src/pages/Contact.jsx` | Support contact form | `POST /api/contact` | No | Public |
| **Login** | `src/pages/Login.jsx` | Email/Password login | `POST /api/auth/login` | No | Public |
| **Register** | `src/pages/Register.jsx` | User account creation | `POST /api/auth/register` | No | Public |
| **Stadiums** | `src/pages/Stadiums.jsx` | Filterable venue catalog (Country, City, Sport, Search) | `GET /api/stadiums`, `GET /api/favorites/my` | Adaptive (Layout adapts) | Public / User |
| **StadiumDetail** | `src/pages/StadiumDetail.jsx` | Venue specs, amenities, safety, reviews, launch modal | `GET /api/stadiums/:id`, `GET /api/reviews/stadium/:id`, `GET /api/favorites/check/:id` | Adaptive | Public / User |
| **Dashboard** | `src/pages/Dashboard.jsx` | User dashboard: today's games, upcoming games, metrics | `GET /api/bookings/my`, `GET /api/favorites/my`, `GET /api/notifications/unread-count` | Yes | User |
| **MyBookings** | `src/pages/MyBookings.jsx` | User booking history with status filtering | `GET /api/bookings/my`, `PUT /api/bookings/:id/cancel` | Yes | User |
| **BookingDetail** | `src/pages/BookingDetail.jsx` | Single booking summary, Razorpay checkout, receipt | `GET /api/bookings/:id`, `POST /api/payments/create-order`, `POST /api/payments/verify`, `PUT /api/bookings/:id/cancel` | Yes | User / Admin |
| **Payments** | `src/pages/Payments.jsx` | User payment receipts ledger | `GET /api/payments/my` | Yes | User |
| **Reviews** | `src/pages/Reviews.jsx` | User authored reviews and ratings | `GET /api/reviews/my`, `PUT /api/reviews/:id`, `DELETE /api/reviews/:id` | Yes | User |
| **Notifications** | `src/pages/Notifications.jsx` | In-app alerts feed with mark read/delete | `GET /api/notifications/my`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id` | Yes | User |
| **Favorites** | `src/pages/Favorites.jsx` | User bookmarked stadium cards | `GET /api/favorites/my`, `DELETE /api/favorites/:stadiumId` | Yes | User |
| **Profile** | `src/pages/Profile.jsx` | View & update user profile details | `GET /api/users/profile`, `PUT /api/users/profile` | Yes | User |
| **Settings** | `src/pages/Settings.jsx` | Change user account password | `PUT /api/users/change-password` | Yes | User |
| **AdminOverview** | `src/pages/admin/AdminOverview.jsx` | Admin KPI cards, charts, pending actions, quick buttons | `GET /api/admin/dashboard`, `GET /api/admin/analytics`, `PUT /api/bookings/:id/status` | Yes | Admin |
| **AdminUsers** | `src/pages/admin/AdminUsers.jsx` | User table, role toggle, status toggle | `GET /api/admin/users`, `PUT /api/admin/users/:id/status` | Yes | Admin |
| **AdminUserDetail** | `src/pages/admin/AdminUserDetail.jsx` | Deep inspect customer booking & spend metrics | `GET /api/admin/users/:id`, `GET /api/admin/users/:id/stats` | Yes | Admin |
| **AdminStadiums** | `src/pages/admin/AdminStadiums.jsx` | All active & inactive venues with deactivation action | `GET /api/stadiums/admin/all`, `DELETE /api/stadiums/:id` | Yes | Admin |
| **AdminStadiumForm**| `src/pages/admin/AdminStadiumForm.jsx` | Create or edit stadium fields, dimensions, rules | `GET /api/stadiums/:id`, `POST /api/stadiums`, `PUT /api/stadiums/:id` | Yes | Admin |
| **AdminStadiumDetail**| `src/pages/admin/AdminStadiumDetail.jsx`| Read-only admin stadium inspection | `GET /api/stadiums/:id` | Yes | Admin |
| **AdminSports** | `src/pages/admin/AdminSports.jsx` | Sport rules, minimum players, durations | `GET /api/sports`, `POST /api/sports`, `PUT /api/sports/:id`, `DELETE /api/sports/:id` | Yes | Admin |
| **AdminBookings** | `src/pages/admin/AdminBookings.jsx` | Master booking ledger with approve/cancel/reject actions | `GET /api/bookings/admin/all`, `PUT /api/bookings/:id/status` | Yes | Admin |
| **AdminBookingDetail**| `src/pages/admin/AdminBookingDetail.jsx`| Detailed inspection & status update for a booking | `GET /api/bookings/:id`, `PUT /api/bookings/:id/status` | Yes | Admin |
| **AdminAvailability**| `src/pages/admin/AdminAvailability.jsx`| Matrix/calendar of slot availability across stadiums | `GET /api/stadiums/admin/all`, `GET /api/stadiums/:id/availability` | Yes | Admin |
| **AdminPayments** | `src/pages/admin/AdminPayments.jsx` | Master financial ledger of all platform payments | `GET /api/payments/admin/all` | Yes | Admin |
| **AdminReviews** | `src/pages/admin/AdminReviews.jsx` | Master review list with delete/moderation action | `GET /api/reviews/admin/all`, `DELETE /api/reviews/:id` | Yes | Admin |
| **AdminNotifications**| `src/pages/admin/AdminNotifications.jsx`| Broadcast notifications to users or specific roles | `POST /api/admin/notifications/broadcast` | Yes | Admin |
| **AdminSafetyRules**| `src/pages/admin/AdminSafetyRules.jsx` | Configure platform-wide safety guidelines | `GET /api/admin/settings`, `PUT /api/admin/settings` | Yes | Admin |
| **AdminTerms** | `src/pages/admin/AdminTerms.jsx` | Configure platform Terms & Conditions | `GET /api/admin/settings`, `PUT /api/admin/settings` | Yes | Admin |
| **AdminAnalytics** | `src/pages/admin/AdminAnalytics.jsx` | Deep charts: revenue, bookings by sport, utilization | `GET /api/admin/analytics` | Yes | Admin |
| **AdminReports** | `src/pages/admin/AdminReports.jsx` | Exportable report generation and summaries | `GET /api/admin/reports` | Yes | Admin |
| **AdminProfile** | `src/pages/admin/AdminProfile.jsx` | View and edit admin credentials | `GET /api/users/profile`, `PUT /api/users/profile` | Yes | Admin |
| **AdminSettings** | `src/pages/admin/AdminSettings.jsx` | Operating currency, GST rates, business address | `GET /api/admin/settings`, `PUT /api/admin/settings` | Yes | Admin |
| **AdminActivityLog**| `src/pages/admin/AdminActivityLog.jsx` | Audit trail of all administrative actions | `GET /api/admin/activity` | Yes | Admin |
| **DynamicBookingModal**| `src/components/booking/DynamicBookingModal.jsx`| 5-step interactive booking wizard | `GET /api/stadiums/:id/availability`, `POST /api/bookings` | Yes | User |
| **ReceiptModal** | `src/components/payment/ReceiptModal.jsx` | Formatted tax invoice with printable QR pass | Local data from booking / payment | Yes | User / Admin |
| **ReviewModal** | `src/components/review/ReviewModal.jsx` | Star rating & comment submission modal | `POST /api/reviews`, `PUT /api/reviews/:id` | Yes | User |

### Real Application Navigation Flow

```text
                                [ Public Guest ]
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
                 Landing Page                       Discover Venues
                   (Home /)                          (/stadiums)
                       │                                 │
                       │                        ┌────────┴────────┐
                       ▼                        ▼                 ▼
                 View Details             Filter Location    Filter Sport
              (/stadiums/:id)             (Country/City)    (Cricket, etc.)
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      Inspect Amenities    Click "Book Venue"
      & Operating Hours          │
                                 ▼
                     [ Prompt Login / Register ]
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
      User Login                                 User Register
       (/login)                                   (/register)
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                     [ Authenticated State ]
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  Role: 'admin'             Role: 'user'             Adaptive View
        │                        │                        │
        ▼                        ▼                        ▼
  Admin Dashboard          User Dashboard          Launch 5-Step Modal
     (/admin)               (/dashboard)          (DynamicBookingModal)
        │                        │                        │
        ├─ Stadiums              ├─ My Bookings           ├─ Step 1: Sport, Date, Duration
        ├─ Bookings Ledger       ├─ Wallet / Payments     ├─ Step 2: Available Time Slot
        ├─ Sports Catalog        ├─ Reviews               ├─ Step 3: Booking Person Details
        ├─ Analytics & Reports   ├─ Favorites             ├─ Step 4: Game Specifications
        ├─ System Settings       └─ Profile               └─ Step 5: Terms & Consent
        └─ Audit Logs                                             │
                                                                  ▼
                                                          Booking Created
                                                          (Status: pending)
                                                                  │
                                                                  ▼
                                                          Booking Details
                                                      (/dashboard/bookings/:id)
                                                                  │
                                                                  ▼
                                                          Click "Pay Now"
                                                       (Razorpay Checkout)
                                                                  │
                                                                  ▼
                                                         Signature Verified
                                                        (Status: confirmed)
                                                                  │
                                                                  ▼
                                                         Digital Tax Receipt
                                                            (ReceiptModal)
```

---

# 5. USER FEATURES

| User Feature | Implementation Status | Code Evidence & Verification Details |
| :--- | :---: | :--- |
| **User Registration** | ✅ Fully Implemented | `Register.jsx`, `authController.js` (`POST /api/auth/register`). Validates password min length 6, email regex, international phone number format. |
| **User Login** | ✅ Fully Implemented | `Login.jsx`, `authController.js` (`POST /api/auth/login`). Accepts either email or `loginId`. Returns JWT and user object. |
| **User Logout** | ✅ Fully Implemented | `AuthContext.jsx`. Clears `stadium_token` from `localStorage` and resets React user state to `null`. |
| **Profile View & Edit** | ✅ Fully Implemented | `Profile.jsx`, `userController.js` (`GET / PUT /api/users/profile`). Updates name, mobile, age, gender, country, state, city. |
| **Profile Image / Avatar** | ⚠️ Partially Implemented | Visual avatars are dynamically rendered based on user initials or Unsplash fallbacks. File upload endpoint does not exist. |
| **Browse Stadiums** | ✅ Fully Implemented | `Stadiums.jsx`, `stadiumController.js` (`GET /api/stadiums`). Lists all active stadiums sorted newest first. |
| **Venue Search (Text)** | ✅ Fully Implemented | Backend supports `GET /api/stadiums/search?q=...`; Frontend provides instant search across name, city, location. |
| **Filter by Country** | ✅ Fully Implemented | `Stadiums.jsx` provides country dropdown derived dynamically from database records. Backend supports `country` query parameter. |
| **Filter by State & City** | ✅ Fully Implemented | Dependent dropdowns in `Stadiums.jsx` powered by `indiaLocations.js` and `locationData.js`. Backend regex filter in search API. |
| **Filter by Sport** | ✅ Fully Implemented | Derived from active stadium tags in `Stadiums.jsx` and filtered in backend via `sports: { $regex: sport, $options: 'i' }`. |
| **Stadium Detail View** | ✅ Fully Implemented | `StadiumDetail.jsx` renders venue overview, photos, specifications, pricing, amenities, safety rules, and reviews. |
| **Gallery & Amenities** | ✅ Fully Implemented | Renders primary image, thumbnail gallery, and pill badges for facilities (Floodlights, Locker Rooms, Parking, etc.). |
| **Dynamic Hourly Pricing** | ✅ Fully Implemented | Computes base price (`duration * pricePerHour`) and GST (`gstRate%`) authoritatively on both client and backend. |
| **Real-time Slot Engine** | ✅ Fully Implemented | `DynamicBookingModal.jsx` queries `GET /api/stadiums/:id/availability?date=...&duration=...&sport=...`. |
| **Date Selection** | ✅ Fully Implemented | HTML5 date picker constrained to `min={todayStr}` to prevent past date reservations. |
| **Time-slot Selection** | ✅ Fully Implemented | Displays clickable green available pills vs red booked pills calculated from non-overlapping time boundaries. |
| **Booking Submission** | ✅ Fully Implemented | `bookingController.js` (`POST /api/bookings`). Validates inputs, creates booking with reference `STB-YYYYMMDD-XXXXXX`. |
| **Booking for Nominee** | ✅ Fully Implemented | Supports `bookingFor: 'someone_else'` with distinct nominee name, mobile, email, age, and gender. |
| **Game Specifications** | ✅ Fully Implemented | Collects match type (Practice/Tournament), team name, captain name, player count, and equipment rental add-on. |
| **Booking Confirmation** | ✅ Fully Implemented | Detailed confirmation screen on `/dashboard/bookings/:id?new=true` with status badge and payment call-to-action. |
| **Booking History** | ✅ Fully Implemented | `MyBookings.jsx` with tabbed filtering (`All`, `Upcoming`, `Completed`, `Cancelled`) and date search. |
| **Cancel Booking** | ✅ Fully Implemented | `bookingController.js` (`PUT /api/bookings/:id/cancel`). Users can cancel their pending/confirmed bookings. |
| **Reschedule Booking** | ❌ Not Implemented | Rescheduling requires canceling and booking a new slot. No dedicated reschedule endpoint exists. |
| **Favorites / Bookmarks** | ✅ Fully Implemented | Heart toggle on cards and detail pages calling `POST /api/favorites` and `DELETE /api/favorites/:id`. Listed on `/favorites`. |
| **Reviews & Ratings** | ✅ Fully Implemented | 1–5 star rating with comments. Enforced strictly: only users with `completed` bookings can review a venue. |
| **In-App Notifications** | ✅ Fully Implemented | Bell icon with unread count badge in navbar; interactive feed on `/notifications` with mark-read and delete. |
| **Email Confirmation** | ❌ Not Implemented | No email dispatch library (Nodemailer/Resend) configured in backend. |
| **WhatsApp Integration** | ❌ Not Implemented | No WhatsApp Business API or Twilio integration in codebase. |
| **Maps & Navigation** | ⚠️ Partially Implemented | Generates direct external `https://www.google.com/maps/search/?api=1&query=...` link using venue address. No embedded map SDK. |
| **Contact Form** | ✅ Fully Implemented | `Contact.jsx` submitting inquiries to MongoDB `contactmessages` collection via `POST /api/contact`. |
| **Online Payments** | ✅ Fully Implemented | Razorpay Checkout SDK integration with order creation, signature verification, and printable tax receipts. |

---

# 6. ADMIN PANEL

### Admin Authentication & Security
- **Admin Access URL:** `/admin`
- **Authentication Method:** Shared `/api/auth/login` accepting administrator email or `loginId` with password.
- **Route Guard:** `AdminRoute` (`src/routes/ProtectedRoute.jsx`) validates `user.role === 'admin'`. Unauthorized guests are redirected to `/login`, while normal users attempting to access `/admin` are redirected to `/dashboard`.
- **Backend Authorization:** `adminMiddleware.js` (`admin`) runs after `authMiddleware.js` (`protect`) and rejects non-admin requests with `403 Forbidden`.

### Admin Features Status Table

| Admin Feature | Status | Frontend File | Backend / API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Admin Overview** | ✅ Fully Implemented | `AdminOverview.jsx` | `GET /api/admin/dashboard`, `GET /api/admin/analytics` | Displays 6 KPI cards, pending action badges, and sport charts. |
| **Dashboard Statistics** | ✅ Fully Implemented | `AdminOverview.jsx` | `GET /api/admin/dashboard` | Parallel aggregation of total users, revenue, stadiums, bookings, and unread notifications. |
| **User Directory** | ✅ Fully Implemented | `AdminUsers.jsx` | `GET /api/admin/users`, `PUT /api/admin/users/:id/status` | Search, role filter, active/inactive toggle, user inspection. |
| **User Details & History** | ✅ Fully Implemented | `AdminUserDetail.jsx` | `GET /api/admin/users/:id`, `GET /api/admin/users/:id/stats` | Shows complete lifetime spend, bookings, payments, and reviews. |
| **Stadium Management** | ✅ Fully Implemented | `AdminStadiums.jsx` | `GET /stadiums/admin/all`, `DELETE /api/stadiums/:id` | Lists all stadiums including deactivated; soft deactivates venues. |
| **Stadium Creation & Edit** | ✅ Fully Implemented | `AdminStadiumForm.jsx` | `POST /api/stadiums`, `PUT /api/stadiums/:id` | Full form for venue specs, opening hours, capacity, and dimensions. |
| **Sport Catalog Management**| ✅ Fully Implemented | `AdminSports.jsx` | `GET /api/sports`, `POST /api/sports`, `PUT /:id`, `DELETE /:id` | Manages rules, duration increments, and player bounds per sport. |
| **Booking Approval / Status**| ✅ Fully Implemented | `AdminBookings.jsx`, `AdminBookingDetail.jsx` | `GET /api/bookings/admin/all`, `PUT /api/bookings/:id/status` | Approve pending bookings, reject with reason, or mark completed. |
| **Availability Matrix** | ✅ Fully Implemented | `AdminAvailability.jsx` | `GET /api/stadiums/:id/availability` | Visual time-slot calendar showing booked vs available hours. |
| **Payment Ledger** | ✅ Fully Implemented | `AdminPayments.jsx` | `GET /api/payments/admin/all` | Transaction logs with Razorpay payment IDs, order IDs, and status. |
| **Review Moderation** | ✅ Fully Implemented | `AdminReviews.jsx` | `GET /api/reviews/admin/all`, `DELETE /api/reviews/:id` | View customer ratings and delete offensive reviews. |
| **Broadcast Alerts** | ✅ Fully Implemented | `AdminNotifications.jsx` | `POST /api/admin/notifications/broadcast` | Push notifications to all users or specific roles. |
| **Safety Guidelines Editor** | ✅ Fully Implemented | `AdminSafetyRules.jsx` | `GET /api/admin/settings`, `PUT /api/admin/settings` | Updates system safety rules in MongoDB `settings` collection. |
| **Terms & Conditions Editor**| ✅ Fully Implemented | `AdminTerms.jsx` | `GET /api/admin/settings`, `PUT /api/admin/settings` | Updates system terms and conditions. |
| **Analytics Engine** | ✅ Fully Implemented | `AdminAnalytics.jsx` | `GET /api/admin/analytics` | Aggregates revenue, bookings by sport, and venue performance. |
| **Reports Engine** | ✅ Fully Implemented | `AdminReports.jsx` | `GET /api/admin/reports` | Formatted financial and operational summary generation. |
| **System Settings** | ✅ Fully Implemented | `AdminSettings.jsx` | `GET /api/admin/settings`, `PUT /api/admin/settings` | Configures GST rate, platform name, contact email, and cutoff hours. |
| **Audit Logs** | ✅ Fully Implemented | `AdminActivityLog.jsx` | `GET /api/admin/activity` | Immutable audit log of administrative actions with IP tracking. |
| **Ground / Pitch Multi-slot**| ⚠️ Partially Implemented | Shared in Stadium model | `Stadium.dimensions`, `Stadium.facilities` | Each venue acts as a single ground entity with slot capacity. |

### Admin Workflow
1. Admin logs in with administrative credentials at `/login`.
2. Automatically redirected by `Login.jsx` and `ProtectedRoute.jsx` to `/admin`.
3. `AdminOverview` loads current metrics and flags items requiring attention (pending bookings, failed payments).
4. Admin navigates via `AdminSidebar`:
   - To approve a reservation: Goes to **Bookings**, clicks on a pending item, and clicks **Approve** (transitions status to `confirmed` and notifies the user).
   - To add a venue: Goes to **Stadiums** -> **Add New Stadium**, completes `AdminStadiumForm`, and saves.
   - To adjust tax or platform policies: Goes to **Settings**, updates the GST percentage or cancellation cutoff window, and saves directly to MongoDB.

---

# 7. USER ROLES AND AUTHORIZATION

### Supported Roles
1. **Guest:** Unauthenticated visitor.
2. **User:** Authenticated customer / athlete.
3. **Admin:** System administrator with complete operational and management access.

### Role Storage & Token Mechanism
- Role is stored as an enum on the User schema: `role: { type: String, enum: ['user', 'admin'], default: 'user' }`.
- Upon successful login (`POST /api/auth/login`), the backend signs a JWT:
  ```javascript
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  ```
- **Storage Location:** Client stores the JWT string in `localStorage.getItem('stadium_token')`.
- **Token Injection:** Axios request interceptor attaches the token as `Authorization: Bearer <token>` to all HTTP requests.
- **Middleware Guard:** `protect` in `authMiddleware.js` decodes the token, fetches the user from MongoDB (excluding password), verifies `isActive === true`, and attaches the document to `req.user`.

### Authorization Matrix

| Action / Resource | Guest | User | Admin |
| :--- | :---: | :---: | :---: |
| Browse / Search Active Stadiums | ✅ | ✅ | ✅ |
| Check Slot Availability | ✅ | ✅ | ✅ |
| Submit Contact Message | ✅ | ✅ | ✅ |
| Register Account | ✅ | ❌ (Redirects) | ❌ (Redirects) |
| Create Booking | ❌ (Prompts Login) | ✅ | ✅ |
| View Own Bookings | ❌ | ✅ | ✅ |
| Cancel Own Booking | ❌ | ✅ | ✅ |
| Make Payment (Razorpay) | ❌ | ✅ | ✅ |
| Add / Remove Favorite | ❌ | ✅ | ✅ |
| Write Review (Completed Booking) | ❌ | ✅ | ✅ |
| View In-App Notifications | ❌ | ✅ | ✅ |
| Update Profile & Password | ❌ | ✅ | ✅ |
| Access Admin Dashboard (`/admin/*`) | ❌ (Redirects Login) | ❌ (Redirects Dashboard) | ✅ |
| Approve / Reject Bookings | ❌ | ❌ | ✅ |
| Create / Edit / Delete Stadiums | ❌ | ❌ | ✅ |
| View All System Payments | ❌ | ❌ | ✅ |
| Modify User Roles & Status | ❌ | ❌ | ✅ |
| Broadcast Notifications | ❌ | ❌ | ✅ |
| Update Global System Settings | ❌ | ❌ | ✅ |
| View Administrative Audit Logs | ❌ | ❌ | ✅ |

---

# 8. DATABASE COMPLETE ANALYSIS

```text
                               +-------------------+
                               |       User        |
                               +-------------------+
                               | _id               |
                               | name, email       |
                               | password (bcrypt) |
                               | role, isActive    |
                               +---------+---------+
                                         | 1
                  ┌──────────────────────┼──────────────────────┐
                  | 1                    | 1                    | 1
                  ▼ *                    ▼ *                    ▼ *
          +---------------+      +---------------+      +---------------+
          |    Booking    |      |   Favorite    |      | Notification  |
          +---------------+      +---------------+      +---------------+
          | _id           |      | _id           |      | _id           |
          | user (FK)     |      | user (FK)     |      | user (FK)     |
          | stadium (FK)  |      | stadium (FK)  |      | booking (FK)  |
          | bookingDate   |      +-------+-------+      | stadium (FK)  |
          | startTime     |              |              +---------------+
          | endTime       |              |
          | totalPrice    |              |
          | status        |              |
          +-------+-------+              |
                  | 1                    |
         ┌────────┴────────┐             |
         ▼ 1               ▼ *           |
+-----------------+ +-------------+      |
|     Payment     | |   Review    |      |
+-----------------+ +-------------+      |
| _id             | | _id         |      |
| user (FK)       | | user (FK)   |      |
| booking (FK)    | | booking(FK) |      |
| razorpayOrderId | | stadium(FK) |      |
| amount          | | rating      |      |
| status          | | comment     |      |
+-----------------+ +------+------+      |
                           |             |
                           ▼ *           ▼ *
                   +-------------------------------+
                   |            Stadium            |
                   +-------------------------------+
                   | _id                           |
                   | name, description, address    |
                   | city, state, country          |
                   | sports [String]               |
                   | pricePerHour, gstRate         |
                   | openingTime, closingTime      |
                   | isActive                      |
                   | createdBy (FK -> User)        |
                   +-------------------------------+
```

### Models & Schema Specifications

#### 1. User (`backend/models/User.js`)
- **Purpose:** Stores user credentials, demographic profile, contact data, and RBAC role.
- **Fields:**
  - `name`: String, required, trim
  - `email`: String, required, unique, trim, lowercase, regex validated
  - `loginId`: String, trim, sparse index (allows alternate admin login)
  - `password`: String, required, minlength 6, `select: false` (excluded by default)
  - `mobile`: String, trim
  - `age`: Number, min 5, max 120
  - `gender`: String, enum: `['Male', 'Female', 'Other', 'Prefer not to say']`
  - `country`: String, trim, default `'India'`
  - `state`: String, trim
  - `city`: String, trim
  - `role`: String, enum: `['user', 'admin']`, default `'user'`
  - `isActive`: Boolean, default `true`
  - `timestamps`: `true` (`createdAt`, `updatedAt`)
- **Hooks & Methods:**
  - `pre('save')`: Hashes password with bcrypt (10 rounds) when modified.
  - `matchPassword(enteredPassword)`: Executes `bcrypt.compare`.

#### 2. Stadium (`backend/models/Stadium.js`)
- **Purpose:** Represents athletic venues, turfs, and stadiums with operational constraints.
- **Fields:**
  - `name`: String, required, trim
  - `description`: String, required
  - `location`: String, required (e.g. area name)
  - `address`: String, required (street address)
  - `city`: String, required, trim
  - `state`: String, trim
  - `country`: String, trim, default `'India'`
  - `postalCode`: String, trim
  - `currency`: String, trim, default `'INR'`
  - `sports`: `[String]`, required (custom validator: length > 0)
  - `capacity`: Number, required, min 1
  - `playerCapacity`: Number, min 1
  - `audienceCapacity`: Number, default 0, min 0
  - `audienceAllowed`: Boolean, default `true`
  - `audiencePassRequired`: Boolean, default `false`
  - `audienceRules`: String, trim, default `''`
  - `pricePerHour`: Number, required, min 0
  - `facilities`: `[String]`, default `[]`
  - `image`: String, trim (primary display image URL)
  - `images`: `[String]`, default `[]` (gallery URLs)
  - `contactNumber`: String
  - `openingTime`: String, required (HH:mm format, e.g. `'06:00'`)
  - `closingTime`: String, required (HH:mm format, e.g. `'22:00'`)
  - `isActive`: Boolean, default `true`
  - `minDuration`: Number, default 1, min 1
  - `maxDuration`: Number, default 4, min 1
  - `allowedDurations`: `[Number]`, default `[1, 2, 3, 4]`
  - `durationIncrement`: Number, default 1
  - `dimensions`: Subdocument `{ length: Number, width: Number, unit: { type: String, default: 'm' } }`
  - `parking`: Subdocument `{ available: Boolean, capacity: Number, details: String }`
  - `facilityType`: String, default `'Sports Complex'`
  - `gstRate`: Number, default 0, min 0
  - `sportConfigurations`: Array of sport subdocuments with specific player limits, safety rules, and duration overrides
  - `termsAndConditions`: String (venue rules)
  - `termsVersion`: String, default `'1.0'`
  - `safetyRules`: `[String]`
  - `createdBy`: ObjectId, ref `'User'`, required
  - `timestamps`: `true`

#### 3. Booking (`backend/models/Booking.js`)
- **Purpose:** Manages time slot reservations, nominee information, price breakdowns, and lifecycle statuses.
- **Fields:**
  - `user`: ObjectId, ref `'User'`, required
  - `stadium`: ObjectId, ref `'Stadium'`, required
  - `bookingReference`: String, unique, sparse index (e.g. `STB-20260923-A1B2C3`)
  - `bookingDate`: String, required, regex `/^\d{4}-\d{2}-\d{2}$/`
  - `startTime`: String, required, regex `/^([01]\d|2[0-3]):([0-5]\d)$/`
  - `endTime`: String, required, regex `/^([01]\d|2[0-3]):([0-5]\d)$/`
  - `duration`: Number, required, min 0.1
  - `pricePerHour`: Number, required, min 0
  - `basePrice`: Number, min 0
  - `gstRate`: Number, default 18, min 0
  - `gstAmount`: Number, default 0, min 0
  - `totalPrice`: Number, required, min 0
  - `bookingFor`: String, enum: `['myself', 'someone_else']`, default `'myself'`
  - `bookingPerson`: Subdocument `{ name: String, email: String, mobile: String, age: Number, gender: String }`
  - `gameDetails`: Subdocument `{ matchType, teamName, playerCount, captainName, equipmentRental, playerNames, ageGroup, additionalNotes, audienceCount, audiencePasses }`
  - `status`: String, enum: `['pending', 'confirmed', 'cancelled', 'completed', 'rejected']`, default `'confirmed'` (or `'pending'` when submitted by user)
  - `notes`: String, default `''`
  - `paymentStatus`: String, enum: `['pending', 'paid', 'failed', 'refunded']`, default `'pending'`
  - `paymentId`: ObjectId, ref `'Payment'`
  - `sport`: String, trim, default `''`
  - `customFields`: Map of Mixed types
  - `safetyAcknowledged`: Boolean, default `false`
  - `termsAccepted`: Boolean, default `true`
  - `termsVersion`: String, default `'1.0'`
  - `termsAcceptedAt`: Date, default `Date.now`
  - `rejectionReason`: String, default `''`
  - `timestamps`: `true`
- **Indexes:**
  - `{ user: 1 }`
  - `{ stadium: 1, bookingDate: 1 }`
  - `{ status: 1 }`

#### 4. Payment (`backend/models/Payment.js`)
- **Purpose:** Records Razorpay financial transactions and HMAC signatures.
- **Fields:**
  - `user`: ObjectId, ref `'User'`, required
  - `booking`: ObjectId, ref `'Booking'`, required
  - `razorpayOrderId`: String, required
  - `razorpayPaymentId`: String
  - `razorpaySignature`: String
  - `amount`: Number, required, min 0 (stored in paise)
  - `currency`: String, required, default `'INR'`
  - `status`: String, enum: `['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded']`, default `'created'`
  - `method`: String
  - `failureReason`: String
  - `paidAt`: Date
  - `timestamps`: `true`
- **Indexes:** `{ booking: 1 }`, `{ razorpayOrderId: 1 }`, `{ razorpayPaymentId: 1 }`, `{ user: 1 }`

#### 5. Review (`backend/models/Review.js`)
- **Purpose:** Customer reviews and 1–5 star ratings for venues.
- **Fields:**
  - `user`: ObjectId, ref `'User'`, required
  - `stadium`: ObjectId, ref `'Stadium'`, required
  - `booking`: ObjectId, ref `'Booking'`, required
  - `rating`: Number, required, min 1, max 5
  - `comment`: String, maxlength 500
  - `photo`: String, trim
  - `timestamps`: `true`
- **Compound Index:** `{ user: 1, booking: 1 }` with `{ unique: true }` (strictly prevents multiple reviews for the same booking)

#### 6. Favorite (`backend/models/Favorite.js`)
- **Purpose:** Customer venue bookmarks.
- **Fields:**
  - `user`: ObjectId, ref `'User'`, required
  - `stadium`: ObjectId, ref `'Stadium'`, required
  - `timestamps`: `true`
- **Compound Index:** `{ user: 1, stadium: 1 }` with `{ unique: true }`

#### 7. Notification (`backend/models/Notification.js`)
- **Purpose:** In-app user notifications.
- **Fields:**
  - `user`: ObjectId, ref `'User'`, required
  - `type`: String, enum: `['booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed', 'booking_status_changed', 'system']`
  - `title`: String, required, maxlength 150
  - `message`: String, required, maxlength 500
  - `booking`: ObjectId, ref `'Booking'`, default `null`
  - `stadium`: ObjectId, ref `'Stadium'`, default `null`
  - `isRead`: Boolean, default `false`
  - `readAt`: Date, default `null`
  - `timestamps`: `true`
- **Indexes:** `{ user: 1, createdAt: -1 }`, `{ user: 1, isRead: 1 }`

#### 8. Sport (`backend/models/Sport.js`)
- **Purpose:** Sports catalog with rules, durations, and participant requirements.
- **Fields:**
  - `name`: String, required, unique, trim
  - `description`: String, default `''`
  - `icon`: String, default `'Trophy'`
  - `isActive`: Boolean, default `true`
  - `defaultMinDuration`: Number, default 1
  - `defaultMaxDuration`: Number, default 4
  - `durationIncrement`: Number, default 1
  - `minPlayers`: Number, default 2
  - `maxPlayers`: Number, default 22
  - `teamRequired`: Boolean, default `false`
  - `equipmentRentalAvailable`: Boolean, default `true`
  - `safetyRules`: `[String]`
  - `terms`: String
  - `timestamps`: `true`

#### 9. Setting (`backend/models/Setting.js`)
- **Purpose:** Single document collection storing platform-wide business settings.
- **Fields:**
  - `businessName`: String, default `'Stadium Booking Operations'`
  - `contactEmail`: String, default `'support@stadiumbooking.com'`
  - `contactPhone`: String, default `'+91 9876543210'`
  - `defaultGstRate`: Number, default 18, min 0, max 28
  - `currency`: String, default `'INR'`
  - `timezone`: String, default `'Asia/Kolkata'`
  - `cancellationCutoffHours`: Number, default 24, min 1
  - `maxAdvanceBookingDays`: Number, default 30, min 1
  - `termsVersion`: String, default `'1.0'`
  - `maintenanceMode`: Boolean, default `false`
  - `timestamps`: `true`

#### 10. AuditLog (`backend/models/AuditLog.js`)
- **Purpose:** Immutable audit record of admin activities.
- **Fields:**
  - `admin`: ObjectId, ref `'User'`, required
  - `action`: String, required (e.g. `'SETTINGS_UPDATED'`, `'VENUE_CREATED'`)
  - `entity`: String, required (e.g. `'Setting'`, `'Stadium'`, `'Booking'`)
  - `entityId`: String
  - `details`: String
  - `ipAddress`: String
  - `timestamps`: `true`
- **Indexes:** `{ createdAt: -1 }`, `{ entity: 1, entityId: 1 }`

#### 11. ContactMessage (`backend/models/ContactMessage.js`)
- **Purpose:** Inbound customer support inquiries.
- **Fields:**
  - `name`: String, required
  - `email`: String, required, regex validated
  - `mobile`: String
  - `subject`: String, default `'General Inquiry'`
  - `message`: String, required, maxlength 2000
  - `status`: String, enum: `['unread', 'read', 'archived']`, default `'unread'`
  - `timestamps`: `true`

---

# 9. STADIUM MODEL

The `Stadium` model (`backend/models/Stadium.js`) contains comprehensive fields:
- **Identification & General Info:**
  - `name`: Venue title (e.g. `"Narendra Modi Stadium"`).
  - `description`: Narrative description of facilities and turf.
  - `location`: General area/suburb (e.g. `"Motera, Ahmedabad"`).
  - `address`: Detailed street address.
  - `city`, `state`, `country`, `postalCode`: Hierarchical location fields.
  - `currency`: Default currency (`'INR'`).
- **Sports & Activities:**
  - `sports`: Array of sports supported by the venue (`['Cricket', 'Football', 'Badminton']`).
  - `sportConfigurations`: Detailed overrides per sport (allowed durations, player limits, equipment rentals).
- **Capacities:**
  - `capacity`: Total venue capacity.
  - `playerCapacity`: Maximum active players allowed on the pitch simultaneously.
  - `audienceCapacity`: Spectator seating capacity.
  - `audienceAllowed`: Boolean flag toggling spectator entry.
  - `audiencePassRequired`: Boolean flag controlling ticketing pass requirements.
  - `audienceRules`: Specific text instructions for spectators (e.g., Gate entry details).
- **Operating Schedule & Hourly Rates:**
  - `openingTime`: Daily start time (HH:mm format, e.g. `'06:00'`).
  - `closingTime`: Daily end time (HH:mm format, e.g. `'23:00'`).
  - `pricePerHour`: Authoritative base rate charged per hour.
  - `gstRate`: Applicable tax percentage (defaults to stadium value or platform setting).
- **Duration Boundaries:**
  - `minDuration`: Minimum booking duration allowed (e.g. `1` or `2` hours).
  - `maxDuration`: Maximum booking duration allowed (e.g. `4` hours).
  - `allowedDurations`: Pre-approved duration array (e.g. `[1, 2, 3, 4]`).
  - `durationIncrement`: Interval steps (e.g. `1` hour).
- **Dimensions & Physical Infrastructure:**
  - `dimensions`: `{ length: 105, width: 68, unit: 'm' }`.
  - `parking`: `{ available: true, capacity: 100, details: 'Underground lot' }`.
  - `facilities`: Array of amenity tags (e.g. `['LED Floodlights', 'Locker Rooms', 'Olympic Gym']`).
- **Images:**
  - `image`: Primary display URL.
  - `images`: Array of gallery photo URLs.
- **Safety & Compliance:**
  - `safetyRules`: Array of venue-specific safety instructions.
  - `termsAndConditions`: Legal guidelines.
  - `termsVersion`: Version string (e.g. `'1.0'`).
- **Status & Creator:**
  - `isActive`: Boolean flag controlling public visibility (`true` active, `false` soft-deleted).
  - `createdBy`: ObjectId linking to the admin who created the venue.

---

# 10. BOOKING SYSTEM

### Complete Booking Lifecycle Flow

```text
User selects Venue -> selects Sport -> chooses Date & Duration ->
Frontend calls GET /api/stadiums/:id/availability ->
Slot availability returned -> User selects starting slot ->
User enters nominee & game details -> Consents to terms ->
Frontend submits POST /api/bookings ->
Backend performs atomic validation ->
Checks venue active & operating hours ->
Checks player & audience capacity ->
Checks slot overlap query ->
Computes base price + GST -> Generates bookingReference ->
Creates Booking document (status: 'pending') ->
Creates in-app Notification -> Returns 201 Created ->
User redirected to /dashboard/bookings/:id ->
User clicks "Pay Now" ->
Backend calls Razorpay Orders API -> returns order_id ->
Razorpay modal opens -> User authorizes payment ->
Razorpay returns payment signature ->
Frontend calls POST /api/payments/verify ->
Backend computes HMAC SHA256 -> Marks Payment 'paid' ->
Marks Booking 'confirmed' & 'paid' ->
Tax Receipt generated -> Pass available in wallet.
```

### Detailed Mechanics
1. **Available Dates:** Calendar UI restricts booking to dates on or after current local date (`min={todayStr}`). Backend rejects any date where `bookingDate < todayStr`.
2. **Available Slots:** Dynamically computed based on `openingTime`, `closingTime`, and selected duration.
3. **Price Calculation (Authoritative Server-Side):**
   ```javascript
   const rawBasePrice = duration * stadium.pricePerHour;
   const basePrice = Math.round(rawBasePrice * 100) / 100;
   const gstRate = stadium.gstRate || 0;
   const gstAmount = Math.round(basePrice * (gstRate / 100) * 100) / 100;
   const totalPrice = Math.round((basePrice + gstAmount) * 100) / 100;
   ```
4. **Overlapping Booking Prevention:**
   The backend checks for conflicting bookings using the standard interval intersection condition:
   ```javascript
   const overlappingBooking = await Booking.findOne({
     stadium: stadiumId,
     bookingDate: bookingDate,
     status: { $ne: 'cancelled' },
     $and: [
       { startTime: { $lt: endTime } },
       { endTime: { $gt: startTime } }
     ]
   });
   if (overlappingBooking) {
     return res.status(409).json({ success: false, message: 'Stadium is already booked for the selected time slot' });
   }
   ```
5. **Race Condition Analysis:**
   - The overlap query executes immediately before `Booking.create()`.
   - **Potential Risk:** High-concurrency simultaneous requests for the exact same slot could theoretically pass the query before either record is committed because `Booking.js` does not have a compound unique database index on `{ stadium: 1, bookingDate: 1, startTime: 1 }`.
   - **Remediation Recommendation:** Add a compound unique index or execute booking creation inside a MongoDB session transaction (`withTransaction`).

---

# 11. SLOT / AVAILABILITY SYSTEM

### Dynamic vs. Stored Slots
Slots are **NOT stored as persistent rows in the database**. Storing millions of static slot records for future dates would cause massive table bloat. Instead, slots are generated **dynamically on demand** by the availability engine in `stadiumController.js` (`checkAvailability`).

### Algorithm
1. Reads `openingTime` (e.g. `'06:00'`) and `closingTime` (e.g. `'22:00'`).
2. Converts both strings to integer minutes from midnight (`timeToMinutes`):
   - `openMins = 6 * 60 = 360`
   - `closeMins = 22 * 60 = 1320`
3. Resolves the requested duration in minutes (e.g. `2 hours = 120 minutes`).
4. Queries MongoDB `bookings` collection for the stadium on the requested date with active statuses:
   ```javascript
   Booking.find({
     stadium: stadiumId,
     bookingDate: date,
     status: { $in: ['pending', 'confirmed', 'completed'] }
   });
   ```
5. Loops from `openMins` to `closeMins - slotDurationMins` in increments of 60 minutes (`stepIncrementMins = 60`):
   - For each window `[slotStart, slotEnd]`, checks whether any existing booking satisfies:
     `bStart < slotEnd && bEnd > slotStart`.
   - If overlap is detected, marks `available: false`. Otherwise, marks `available: true`.
6. Formats minutes back to `HH:mm` strings (`minutesToTime`) and returns the slot array.

### Past-Time Handling & Timezones
- In `stadiumController.js`, past dates are rejected: `date < todayStr` returns `400 Bad Request`.
- **Known Issue:** For the current day (`date === todayStr`), the current availability engine generates all operating slots from opening to closing and does not flag slots whose start time has already elapsed earlier in the day. The user could theoretically attempt to book a slot from 08:00 AM at 04:00 PM on today's date. Adding a `currentTimeMins` comparison when `date === todayStr` is recommended.

---

# 12. ALL BACKEND API ENDPOINTS

| Method | Endpoint | Auth Required | Role | Controller Function | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **GET** | `/api/health` | No | Any | Inline `server.js` | Service health status check |
| **GET** | `/api/test` | No | Any | Inline `server.js` | API connectivity test route |
| **POST** | `/api/auth/register` | No | Any | `registerUser` | Register a new user |
| **POST** | `/api/auth/login` | No | Any | `loginUser` | Authenticate user & issue JWT |
| **GET** | `/api/auth/profile` | Yes | Any | `getUserProfile` | Get profile of logged-in user |
| **GET** | `/api/users/profile` | Yes | Any | `getUserProfile` | Get current user's profile |
| **PUT** | `/api/users/profile` | Yes | Any | `updateUserProfile` | Update current user's details |
| **PUT** | `/api/users/change-password` | Yes | Any | `changePassword` | Change user's account password |
| **GET** | `/api/stadiums` | No | Any | `getAllStadiums` | Get all active stadiums |
| **GET** | `/api/stadiums/search` | No | Any | `searchStadiums` | Filter venues by query, location, price |
| **GET** | `/api/stadiums/admin/all` | Yes | Admin | `getAdminAllStadiums` | Get all active & inactive stadiums |
| **POST** | `/api/stadiums` | Yes | Admin | `createStadium` | Create a new stadium venue |
| **GET** | `/api/stadiums/:stadiumId/availability` | No | Any | `checkAvailability` | Get dynamic time slots for a date |
| **GET** | `/api/stadiums/:id` | No | Any | `getStadiumById` | Get single active stadium details |
| **PUT** | `/api/stadiums/:id` | Yes | Admin | `updateStadium` | Update stadium information |
| **DELETE** | `/api/stadiums/:id` | Yes | Admin | `deleteStadium` | Soft delete (deactivate) stadium |
| **GET** | `/api/bookings/my` | Yes | User/Admin | `getMyBookings` | Get logged-in user's bookings |
| **GET** | `/api/bookings/admin/all` | Yes | Admin | `getAllBookings` | Master list of all bookings |
| **POST** | `/api/bookings` | Yes | User/Admin | `createBooking` | Create a new slot booking |
| **GET** | `/api/bookings/:id` | Yes | User/Admin | `getBookingById` | Get single booking by ID |
| **PUT** | `/api/bookings/:id/cancel` | Yes | User/Admin | `cancelBooking` | Cancel a booking |
| **PUT** | `/api/bookings/:id/status` | Yes | Admin | `updateBookingStatus` | Update booking status (confirm/reject) |
| **POST** | `/api/payments/create-order` | Yes | User/Admin | `createOrder` | Create Razorpay order |
| **POST** | `/api/payments/verify` | Yes | User/Admin | `verifyPayment` | Verify HMAC payment signature |
| **GET** | `/api/payments/my` | Yes | User/Admin | `getMyPayments` | Get logged-in user's payments |
| **GET** | `/api/payments/admin/all` | Yes | Admin | `getAdminAllPayments` | Master financial ledger |
| **GET** | `/api/payments/:bookingId` | Yes | User/Admin | `getPaymentByBookingId` | Get payment details by booking ID |
| **GET** | `/api/reviews/stadium/:stadiumId` | No | Any | `getStadiumReviews` | Get all reviews for a stadium |
| **GET** | `/api/reviews/my` | Yes | User/Admin | `getMyReviews` | Get logged-in user's reviews |
| **GET** | `/api/reviews/eligible-bookings/:stadiumId` | Yes | User/Admin | `getEligibleBookingsForReview` | Check if user can review venue |
| **GET** | `/api/reviews/admin/all` | Yes | Admin | `getAllReviews` | Master review list for moderation |
| **POST** | `/api/reviews` | Yes | User/Admin | `createReview` | Submit review for completed booking |
| **GET** | `/api/reviews/:id` | Yes | User/Admin | `getReviewById` | Get single review |
| **PUT** | `/api/reviews/:id` | Yes | User/Admin | `updateReview` | Update user's review |
| **DELETE** | `/api/reviews/:id` | Yes | User/Admin | `deleteReview` | Delete review (User or Admin) |
| **GET** | `/api/favorites/my` | Yes | User/Admin | `getMyFavorites` | Get user's favorited stadiums |
| **GET** | `/api/favorites/check/:stadiumId` | Yes | User/Admin | `checkFavoriteStatus` | Check if stadium is favorited |
| **POST** | `/api/favorites` | Yes | User/Admin | `addFavorite` | Add stadium to favorites |
| **DELETE** | `/api/favorites/:stadiumId` | Yes | User/Admin | `removeFavorite` | Remove stadium from favorites |
| **GET** | `/api/notifications/my` | Yes | User/Admin | `getMyNotifications` | Get user notifications |
| **GET** | `/api/notifications/unread-count` | Yes | User/Admin | `getUnreadCount` | Get count of unread alerts |
| **PUT** | `/api/notifications/read-all` | Yes | User/Admin | `markAllAsRead` | Mark all notifications read |
| **DELETE** | `/api/notifications` | Yes | User/Admin | `deleteAllMyNotifications` | Clear all user notifications |
| **PUT** | `/api/notifications/:id/read` | Yes | User/Admin | `markAsRead` | Mark single notification read |
| **DELETE** | `/api/notifications/:id` | Yes | User/Admin | `deleteNotification` | Delete single notification |
| **POST** | `/api/contact` | No | Any | `submitContactMessage` | Submit customer support message |
| **GET** | `/api/sports` | No | Any | `getSports` | Get sports catalog (auto-seeds) |
| **GET** | `/api/sports/:id` | No | Any | `getSportById` | Get single sport configuration |
| **POST** | `/api/sports` | Yes | Admin | `createSport` | Create new sport configuration |
| **PUT** | `/api/sports/:id` | Yes | Admin | `updateSport` | Update sport configuration |
| **DELETE** | `/api/sports/:id` | Yes | Admin | `deleteSport` | Delete sport configuration |
| **GET** | `/api/admin/dashboard` | Yes | Admin | `getDashboardStats` | KPI metrics, counts, recent items |
| **GET** | `/api/admin/analytics` | Yes | Admin | `getAnalytics` | Operational & revenue charts |
| **GET** | `/api/admin/reports` | Yes | Admin | `getReports` | Formatted reporting summaries |
| **GET** | `/api/admin/users` | Yes | Admin | `getUsers` | User management directory |
| **GET** | `/api/admin/users/:id` | Yes | Admin | `getUserById` | Get user details |
| **PUT** | `/api/admin/users/:id` | Yes | Admin | `updateUser` | Update user info or role |
| **PUT** | `/api/admin/users/:id/status` | Yes | Admin | `updateUserStatus` | Activate / deactivate user account |
| **GET** | `/api/admin/users/:id/stats` | Yes | Admin | `getUserStats` | Detailed user activity & spend |
| **GET** | `/api/admin/stadiums` | Yes | Admin | `getAdminStadiums` | Alias for stadium admin list |
| **GET** | `/api/admin/reviews` | Yes | Admin | `getAdminReviews` | Alias for admin review list |
| **GET** | `/api/admin/payments` | Yes | Admin | `getAdminPayments` | Alias for admin payments list |
| **GET** | `/api/admin/activity` | Yes | Admin | `getActivityLogs` | Administrative action audit log |
| **GET** | `/api/admin/activity-logs` | Yes | Admin | `getActivityLogs` | Alias for audit log endpoint |
| **GET** | `/api/admin/settings` | Yes | Admin | `getSystemSettings` | Get platform global settings |
| **PUT** | `/api/admin/settings` | Yes | Admin | `updateSystemSettings` | Update platform global settings |
| **POST** | `/api/admin/notifications/broadcast` | Yes | Admin | `broadcastNotification` | Send broadcast notification |
| **POST** | `/api/admin/broadcast-notification` | Yes | Admin | `broadcastNotification` | Alias for broadcast alert |

---

# 13. API REQUEST/RESPONSE FLOW

### 1. User Registration
`POST /api/auth/register`  
**Request:**
```json
{
  "name": "Alex Mercer",
  "email": "alex@example.com",
  "password": "Password123",
  "mobile": "+91 9876543210",
  "country": "India",
  "state": "Gujarat",
  "city": "Ahmedabad",
  "age": 25,
  "gender": "Male"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "67b8a1c9e4b0a12345678901",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "role": "user",
    "country": "India",
    "createdAt": "2026-09-23T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. User Login
`POST /api/auth/login`  
**Request:**
```json
{
  "email": "alex@example.com",
  "password": "Password123"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "67b8a1c9e4b0a12345678901",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Slot Availability Check
`GET /api/stadiums/67b8a1c9e4b0a12345678999/availability?date=2026-10-15&duration=2&sport=Football`  
**Response (200 OK):**
```json
{
  "success": true,
  "stadium": {
    "id": "67b8a1c9e4b0a12345678999",
    "name": "The Arena by TransStadia",
    "openingTime": "06:00",
    "closingTime": "22:00",
    "minDuration": 1,
    "maxDuration": 4,
    "allowedDurations": [1, 2, 3, 4],
    "pricePerHour": 4500,
    "gstRate": 18
  },
  "date": "2026-10-15",
  "duration": 2,
  "slots": [
    { "startTime": "06:00", "endTime": "08:00", "available": true, "isAvailable": true },
    { "startTime": "07:00", "endTime": "09:00", "available": false, "isAvailable": false },
    { "startTime": "08:00", "endTime": "10:00", "available": true, "isAvailable": true }
  ]
}
```

### 4. Create Slot Booking
`POST /api/bookings`  
**Request Header:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "stadium": "67b8a1c9e4b0a12345678999",
  "bookingDate": "2026-10-15",
  "startTime": "08:00",
  "duration": 2,
  "sport": "Football",
  "bookingFor": "someone_else",
  "bookingPerson": {
    "name": "Michael Vance",
    "email": "vance@example.com",
    "mobile": "+91 9123456780",
    "age": 28,
    "gender": "Male"
  },
  "gameDetails": {
    "teamName": "Red Devils FC",
    "matchType": "Tournament Match",
    "playerCount": 14,
    "equipmentRental": true
  },
  "safetyAcknowledged": true,
  "termsAccepted": true
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "67b8b2dfe4b0b98765432101",
    "bookingReference": "STB-20261015-8F3A1C",
    "user": "67b8a1c9e4b0a12345678901",
    "stadium": "67b8a1c9e4b0a12345678999",
    "bookingDate": "2026-10-15",
    "startTime": "08:00",
    "endTime": "10:00",
    "duration": 2,
    "pricePerHour": 4500,
    "basePrice": 9000,
    "gstRate": 18,
    "gstAmount": 1620,
    "totalPrice": 10620,
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

### 5. Razorpay Create Order
`POST /api/payments/create-order`  
**Request Body:**
```json
{
  "bookingId": "67b8b2dfe4b0b98765432101"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "payment": {
    "paymentId": "67b8c3a1e4b0c11122233344",
    "bookingId": "67b8b2dfe4b0b98765432101",
    "razorpayOrderId": "order_Qz45MnpL1k8V2x",
    "amount": 1062000,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_YourKeyHere"
  }
}
```

### 6. Verify Payment Signature
`POST /api/payments/verify`  
**Request Body:**
```json
{
  "razorpay_order_id": "order_Qz45MnpL1k8V2x",
  "razorpay_payment_id": "pay_Qz46Rt8u9K3Lm4",
  "razorpay_signature": "4a73e6d2c1b09876f5e4d3c2b1a0f9e8d7c6b5a4..."
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "_id": "67b8c3a1e4b0c11122233344",
    "status": "paid",
    "paidAt": "2026-09-23T00:10:00.000Z"
  },
  "booking": {
    "_id": "67b8b2dfe4b0b98765432101",
    "status": "confirmed",
    "paymentStatus": "paid"
  }
}
```

### 7. Cancel Booking
`PUT /api/bookings/67b8b2dfe4b0b98765432101/cancel`  
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "67b8b2dfe4b0b98765432101",
    "status": "cancelled"
  }
}
```

---

# 14. FRONTEND ↔ BACKEND CONNECTION

- **Base URL Configuration:**  
  Configured in `frontend/src/services/api.js`:
  ```javascript
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  ```
  Set in `frontend/.env` as:
  ```text
  VITE_API_BASE_URL=http://localhost:5000/api
  ```
- **Request Interceptor (Automatic Bearer Token Attachment):**
  ```javascript
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('stadium_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => Promise.reject(error));
  ```
- **Response Interceptor (Data Unwrapping with HTTP Error Preservation):**
  ```javascript
  api.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      const customError = new Error(message);
      customError.status = error.response?.status;
      customError.statusCode = error.response?.status;
      customError.response = error.response;
      return Promise.reject(customError);
    }
  );
  ```
- **API Modularization:** All calls are organized into domain objects (`authAPI`, `userAPI`, `stadiumAPI`, `bookingAPI`, `paymentAPI`, `reviewAPI`, `favoriteAPI`, `notificationAPI`, `sportAPI`, `contactAPI`, `adminAPI`) exported from `api.js`.

---

# 15. ENVIRONMENT VARIABLES

### Backend Environment Variables

| Variable Name | Purpose | Included in `.env.example`? |
| :--- | :--- | :---: |
| `PORT` | HTTP port on which the Express server listens (e.g. 5000) | ✅ Yes |
| `NODE_ENV` | Runtime environment (`development` or `production`) | ✅ Yes |
| `MONGO_URI` | MongoDB connection URI (e.g. `mongodb://127.0.0.1:27017/stadium_booking` or Atlas URI) | ✅ Yes |
| `JWT_SECRET` | Secret key used for signing and verifying JWT authentication tokens | ✅ Yes |
| `JWT_EXPIRES_IN` | Token duration (e.g. `7d` or `24h`) | ✅ Yes |
| `CLIENT_URL` | Frontend origin for CORS whitelist (e.g. `http://localhost:5173`) | ❌ Missing from `.env.example` |
| `RAZORPAY_KEY_ID` | Razorpay public API key for order creation and client SDK initialization | ❌ Missing from `.env.example` |
| `RAZORPAY_KEY_SECRET`| Razorpay private secret key used for HMAC-SHA256 signature verification | ❌ Missing from `.env.example` |
| `RAZORPAY_CURRENCY` | Default payment currency code (default: `'INR'`) | ❌ Missing from `.env.example` |
| `ADMIN_NAME` | Default administrator name used by provisioning seed scripts | ❌ Missing from `.env.example` |
| `ADMIN_EMAIL` | Default administrator email address (fallback: `'admin@stadium.com'`) | ❌ Missing from `.env.example` |
| `ADMIN_PASSWORD` | Default administrator password for initialization scripts | ❌ Missing from `.env.example` |
| `ADMIN_LOGIN_ID` | Alternate administrator alphanumeric login ID | ❌ Missing from `.env.example` |
| `TEST_ADMIN_ID` | Test runner administrator email / login ID override | ❌ Missing from `.env.example` |
| `TEST_ADMIN_PASSWORD`| Test runner administrator password override | ❌ Missing from `.env.example` |

### Frontend Environment Variables

| Variable Name | Purpose |
| :--- | :--- |
| `VITE_API_BASE_URL` | Base URL pointing to the Express backend API (`http://localhost:5000/api`) |

---

# 16. EMAIL SYSTEM

- **Current Status:** ❌ **Not Implemented.**
- **Verification Details:**  
  There is **zero email transport code** in the active backend. No `nodemailer`, `@sendgrid/mail`, or `resend` packages are listed in `backend/package.json`.
- **How Communications Are Handled Currently:**
  1. **User Alerts (Bookings, Cancellations, Approvals, Payments):** Handled via the in-app notification engine (`backend/utils/notificationHelper.js`) and persisted in the MongoDB `notifications` collection.
  2. **Inbound Support Requests:** Handled via `Contact.jsx` submitting to `POST /api/contact`, which saves inquiries in the `contactmessages` collection (`ContactMessage.js`) for admin review.
- **Recommended Implementation for ChatGPT/Future Development:**
  Install `nodemailer` or `resend`, create `backend/utils/emailService.js`, and trigger HTML emails during registration, booking confirmation, and status transitions.

---

# 17. FILE / IMAGE UPLOAD SYSTEM

- **Current Status:** ⚠️ **URL-Based / No Multipart File Upload.**
- **Verification Details:**  
  - No `multer`, `@aws-sdk/client-s3`, or `cloudinary` package is installed.
  - No `multipart/form-data` parsing middleware is mounted in `backend/server.js`.
- **How Images Are Handled:**
  - Stadiums, sports, and user profiles store HTTPS image URL strings in MongoDB (e.g., Unsplash CDN URLs).
  - Admin stadium form (`AdminStadiumForm.jsx`) provides text input fields for image URLs with real-time visual previews.
  - Centralized image presets and fallbacks are curated in `frontend/src/config/images.js`.

---

# 18. SEARCH AND FILTERING

- **Search Capabilities:**
  - Free-text query (`q` parameter): Performs case-insensitive regex matching across `name`, `city`, `state`, `country`, `location`, and `description`.
  - Field-specific filters: `name`, `country`, `state`, `city`, `sport`, `minPrice`, `maxPrice`, `minCapacity`, `maxCapacity`, `facilities`.
  - Sorting parameters: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `capacity_asc`, `capacity_desc`, `newest`, `oldest`.
  - Pagination: Strict `page` and `limit` (max 50) calculations with `total`, `totalPages`, `hasNextPage`, and `hasPrevPage`.
- **Execution Architecture:**
  - **Backend Endpoint:** `GET /api/stadiums/search` performs native MongoDB queries (`Stadium.find(query)`).
  - **Frontend Client-Side Filtering:** On `/stadiums`, the initial active venues are retrieved via `stadiumAPI.getAll()`, and client-side reactive filtering provides instant UI response across country, state, city, and sport dropdowns.

---

# 19. MAP / LOCATION FEATURES

- **Google Maps SDK:** Not installed. No Google Maps API key required.
- **Location Representation:**
  - Standardized geographic fields in database: `location`, `address`, `city`, `state`, `country`, `postalCode`.
  - Dynamic external navigation link generated on Stadium Detail page:
    ```javascript
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${stadium.name} ${stadium.address || ''} ${stadium.city || ''} ${stadium.state || ''}`.trim()
    )}`;
    ```
  - Clicking "View on Map" opens Google Maps in a new browser tab with coordinates or address pin.

---

# 20. UI / DESIGN SYSTEM

- **Color Palette:**
  - **Primary Navy:** `#172554` (text headers, badges, dark layout sections)
  - **Primary Royal Blue:** `#2563EB` (primary action buttons, active tabs, highlights)
  - **Subtle Blue Tint:** `#F0F7FF` / `#EFF6FF` (page backgrounds, alert containers)
  - **Surface Slate:** `#F8FAFC`, `#F1F5F9`, `#E2E8F0` (cards, borders, subtle separators)
  - **Status Emerald:** `#10B981` / `#ECFDF5` (confirmed, paid, available)
  - **Status Rose/Amber:** `#EF4444` / `#F59E0B` (cancelled, rejected, booked, pending)
- **Typography:** Google Fonts (`Inter` and `Poppins` imported in `index.html`).
- **Design Paradigm:** Clean, high-contrast athletic aesthetic. Cards feature rounded corners (`rounded-2xl`), subtle borders (`border-slate-200`), and soft drop shadows (`shadow-xs` / `shadow-md`).
- **Micro-Animations:** Smooth tab transitions, hover scale effects (`hover:shadow-md transition-all`), and confetti explosions (`canvas-confetti`) upon payment confirmation.
- **Modal System:** Backdrop blur overlays (`bg-slate-900/60 backdrop-blur-xs`) for `DynamicBookingModal`, `ReceiptModal`, `ReviewModal`, and `ConfirmDialog`.

---

# 21. ERROR HANDLING

### Backend
- Central error middleware (`errorMiddleware.js`):
  - Catches invalid MongoDB ObjectIds (`CastError`) -> returns `400 Bad Request`.
  - Catches duplicate key collisions (`E11000`) -> returns `409 Conflict`.
  - Catches Mongoose schema validation failures (`ValidationError`) -> returns `400 Bad Request` with joined error messages.
  - Catches malformed JSON payloads -> returns `400 Bad Request` (`"Invalid JSON payload"`).
  - Catches unknown routes -> returns `404 Not Found`.

### Frontend
- Centralized Axios interceptor (`api.js`):
  - Formats rejected promises into standard Error objects while preserving HTTP status codes (`error.status`, `error.statusCode`, `error.response`).
- Contextual Notifications (`ToastContext.jsx`):
  - Toast banner alerts for `success`, `error`, `warning`, `info`.
- Dedicated UI States:
  - `ErrorState.jsx`: Clean reload button and error description.
  - `EmptyState.jsx`: Descriptive icon and call-to-action for empty lists.

---

# 22. SECURITY ANALYSIS

| Area | Status | Static Analysis Finding & Code Review |
| :--- | :---: | :--- |
| **Password Hashing** | **GOOD** | Passwords are automatically hashed via Mongoose pre-save hook with `bcryptjs` using 10 salt rounds. Plaintext comparisons are non-existent. |
| **Password Query Exposure** | **GOOD** | `User.js` defines `password: { select: false }`. Excluded from API responses unless explicitly queried via `.select('+password')`. |
| **JWT Storage & Expiry** | **GOOD** | Signed using `JWT_SECRET` with configurable expiry (`7d`). Stored in client `localStorage`. |
| **CORS Policy** | **GOOD** | Explicit origin whitelist (`http://localhost:5173`, `http://localhost:3000`, `CLIENT_URL`) with credentials allowed. |
| **HTTP Security Headers** | **GOOD** | `helmet()` initialized in `server.js` setting standard HTTP headers (DNS prefetch, frameguard, hide powered-by, etc.). |
| **Rate Limiting** | **GOOD** | `express-rate-limit` protects `/api/auth/login` (100 per 15 min) and `/api/auth/register` (50 per 15 min) against brute-force attacks. |
| **Payload Size Limiting** | **GOOD** | `express.json({ limit: '10kb' })` and `express.urlencoded({ extended: true, limit: '10kb' })` prevent denial-of-service via huge payloads. |
| **Role Enforcement (RBAC)**| **GOOD** | All `/api/admin/*` routes strictly chain `protect` followed by `admin` middleware. Demoting the only active admin is blocked in code. |
| **Payment Signature Verification** | **GOOD** | Razorpay verification computes HMAC-SHA256 hash using `RAZORPAY_KEY_SECRET` and matches client signature before marking orders as paid. |
| **MongoDB Injection Sanitization** | **NEEDS IMPROVEMENT** | No `express-mongo-sanitize` middleware installed. While Mongoose schemas provide structural typing, queries like `User.findOne({ email })` could be affected by object injection if non-string payloads bypass parsers. |
| **Hardcoded Test Credentials** | **NEEDS IMPROVEMENT** | Utility scripts `resetAdminPassword.js` and `createAdmin.js` contain fallback password strings when environment variables are omitted. |

---

# 23. PACKAGE ANALYSIS

### Root Dependencies (`package.json`)
```json
"devDependencies": {
  "concurrently": "^9.1.2"
}
```
*Purpose:* Runs backend and frontend development servers concurrently in one terminal.

### Backend Dependencies (`backend/package.json`)
- `express` (`^4.21.2`): Core web framework for REST API routing and middleware.
- `mongoose` (`^8.10.0`): MongoDB ODM schema modeling and database connectivity.
- `dotenv` (`^16.4.7`): Loads environment variables from `.env`.
- `cors` (`^2.8.5`): Manages Cross-Origin Resource Sharing headers.
- `helmet` (`^8.0.0`): Secures HTTP response headers.
- `morgan` (`^1.10.0`): HTTP request logger for development.
- `jsonwebtoken` (`^9.0.2`): JWT signing and verification for sessionless authentication.
- `bcryptjs` (`^2.4.3`): Password hashing and verification.
- `express-rate-limit` (`^7.5.0`): Rate limiting for endpoint abuse protection.
- `express-validator` (`^7.2.1`): Request sanitization and validation utilities.
- `razorpay` (`^2.9.8`): Official SDK for Razorpay payment order creation and signature verification.
- `nodemon` (`^3.1.9`): Dev auto-reload server daemon.

### Frontend Dependencies (`frontend/package.json`)
- `react` (`^18.3.1`), `react-dom` (`^18.3.1`): Modern React library.
- `react-router-dom` (`^7.1.5`): Client-side single page app routing.
- `axios` (`^1.7.9`): Promise-based HTTP client.
- `lucide-react` (`^0.475.0`): UI iconography.
- `tailwindcss` (`^3.4.17`), `postcss` (`^8.5.2`), `autoprefixer` (`^10.4.20`): Utility-first styling engine.
- `clsx` (`^2.1.1`), `tailwind-merge` (`^3.0.1`): Dynamic CSS class construction.
- `canvas-confetti` (`^1.9.4`): Visual confetti animation on booking success.
- `qrcode` (`^1.5.4`): Dynamic QR code generator for matchday turnstile passes.
- `vite` (`^6.1.0`): High-speed frontend build tool and dev server.

### Exact Package Scripts
```text
Root:
  npm run dev          -> concurrently "npm run server" "npm run client"
  npm run server       -> cd backend && npm run dev
  npm run client       -> cd frontend && npm run dev
  npm run install-all  -> npm install && cd backend && npm install && cd ../frontend && npm install
  npm run seed         -> cd backend && npm run seed

Backend:
  npm start            -> node server.js
  npm run dev          -> nodemon server.js
  npm test:*           -> 12 individual domain test suites (node tests/...)

Frontend:
  npm run dev          -> vite
  npm run build        -> vite build
  npm run preview      -> vite preview
```

---

# 24. LOCAL DEVELOPMENT SETUP

Follow these exact steps to run the complete project locally from scratch:

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher installed.
- **MongoDB:** MongoDB Community Server running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository_url>
cd stadium-booking

# Install all root, backend, and frontend dependencies
npm run install-all
```

### 3. Configure Environment Variables

**Backend Configuration:**  
Create `backend/.env`:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/stadium_booking
JWT_SECRET=super_secret_jwt_key_stadium_booking_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Razorpay Test Credentials (leave empty or use test keys)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_secret_placeholder
RAZORPAY_CURRENCY=INR

# Admin Provisioning
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@stadium.com
ADMIN_PASSWORD=admin12345
ADMIN_LOGIN_ID=ADMIN01
```

**Frontend Configuration:**  
Create `frontend/.env`:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Seed Database (Venues & Admin)
```bash
# Provision the admin account and seed comprehensive Indian and international stadiums
cd backend
node utils/configureAdminAccount.js
node scripts/seedStadiums.js
cd ..
```

### 5. Start Full Application
From the root directory:
```bash
npm run dev
```
- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

# 25. SEED DATA ANALYSIS

### Seeder Scripts
1. **`backend/scripts/seedStadiums.js`:**
   - Connects to MongoDB via `MONGO_URI`.
   - Locates an existing admin (`role: 'admin'`) to assign as `createdBy`.
   - Contains 14+ stadium venue profiles (Narendra Modi Stadium, The Arena by TransStadia, Wankhede Stadium, Eden Gardens, M. Chinnaswamy Stadium, Wembley Stadium, Camp Nou, Melbourne Cricket Ground, Dubai International Stadium, etc.).
   - Normalizes country codes and removes temporary test arena records.
2. **`backend/utils/configureAdminAccount.js`:**
   - Upserts an administrator document using environment credentials (`ADMIN_EMAIL`, `ADMIN_LOGIN_ID`, `ADMIN_PASSWORD`).
   - Ensures an active administrator document with valid `ObjectId` is ready for RBAC testing.
3. **`backend/utils/createAdmin.js` / `backend/utils/resetAdminPassword.js`:**
   - Standalone utilities to provision an admin or replace legacy string `_id` accounts.
   - > [!WARNING]
     > **SECURITY ISSUE:** Hardcoded fallback admin passwords detected in `createAdmin.js` and `resetAdminPassword.js`. Always supply `ADMIN_PASSWORD` in your `.env` to override defaults.

---

# 26. CURRENT DATA PERSISTENCE

| Data Entity | Primary Storage Location | Persistent After Server Restart? | Verification Notes |
| :--- | :--- | :---: | :--- |
| **Users** | MongoDB (`users` collection) | **YES** | User documents and password hashes persist across restarts. |
| **Stadiums** | MongoDB (`stadiums` collection) | **YES** | Stored in MongoDB. (See Section 28 for re-seeding warnings). |
| **Bookings** | MongoDB (`bookings` collection) | **YES** | All reservations, dates, statuses, and nominee fields persist in MongoDB. |
| **Payments** | MongoDB (`payments` collection) | **YES** | Financial logs and Razorpay signatures persist in MongoDB. |
| **Reviews** | MongoDB (`reviews` collection) | **YES** | Ratings and comments persist in MongoDB. |
| **Favorites** | MongoDB (`favorites` collection) | **YES** | User-stadium bookmark pairs persist in MongoDB. |
| **Notifications**| MongoDB (`notifications` collection) | **YES** | User alerts and broadcast messages persist in MongoDB. |
| **Sports** | MongoDB (`sports` collection) | **YES** | Sports catalog persists in MongoDB. |
| **Admin Settings**| MongoDB (`settings` collection) | **YES** | Global settings (GST rate, business name) persist in MongoDB. |
| **Audit Logs** | MongoDB (`auditlogs` collection) | **YES** | Admin action logs persist in MongoDB. |
| **Contact Inquiries**| MongoDB (`contactmessages` collection)| **YES** | Customer contact messages persist in MongoDB. |

---

# 27. STATIC / MOCK DATA AUDIT

- **`backend/data_store.json`:**  
  A 26 KB JSON file containing static arrays of users, stadiums, and bookings.  
  *Audit Result:* **Completely unreferenced by runtime code.** Neither `server.js` nor any active controller imports or reads `data_store.json`. It is a leftover artifact from early prototype development.
- **Frontend Fallback Images (`frontend/src/config/images.js`):**  
  An array of Unsplash photo URLs used only as `onError` fallbacks when an image URL fails to load.
- **Location Dictionaries (`indiaLocations.js` and `locationData.js`):**  
  Static dictionaries of countries, states, and cities used to populate registration and filter dropdowns. They do NOT override database values.
- **`DEFAULT_SPORTS` in `sportController.js`:**  
  A static array of 6 default sports used solely to seed the `sports` collection when `Sport.countDocuments() === 0`. If sports already exist in the database, the static array is ignored.

---

# 28. POTENTIAL DATA RESET PROBLEMS

> [!CAUTION]
> **HIGH PRIORITY INVESTIGATION: Why Admin Changes Might Disappear**

### Root Cause Identified in Code:
In `backend/scripts/seedStadiums.js` (lines 841–850):
```javascript
const existing = await Stadium.findOne({ name: data.name });
if (existing) {
  await Stadium.updateOne({ _id: existing._id }, { $set: stadiumPayload });
  updatedCount++;
} else {
  await Stadium.create(stadiumPayload);
  insertedCount++;
}
```
**Mechanism:**  
If a venue manager edits a pre-seeded stadium (e.g., changes the price per hour of `"Narendra Modi Stadium"` from 15,000 to 18,000 or updates its description) from the Admin Panel, that edit is successfully saved in MongoDB.  
**HOWEVER**, if anyone subsequently runs `npm run seed` or executes `node scripts/seedStadiums.js`, the script finds the existing stadium by name and executes `$set: stadiumPayload`, **overwriting the admin's database changes with the hardcoded values in `stadiumDataset`**!

### Automatic Startup Resets Checked:
- Does `backend/server.js` seed or reset on startup? **NO.** `server.js` only calls `connectDB()` and starts listening.
- Does `connectDB()` drop collections? **NO.**
- **Conclusion:** Data changes persist indefinitely across standard server restarts. Overwrites ONLY occur if `seedStadiums.js` is manually re-executed.

---

# 29. BUG / ISSUE ANALYSIS

### 1. High: Overlapping Booking Race Condition
- **File:** `backend/controllers/bookingController.js` (lines 140–155)
- **Why It Happens:** The overlap check `Booking.findOne(...)` and the insertion `Booking.create(...)` are two distinct, non-atomic operations without a database-level compound unique index or MongoDB transaction.
- **Impact:** Under high-concurrency traffic, two users attempting to book the exact same slot at the exact millisecond could both pass the validation check, resulting in a double-booked slot.
- **Recommended Fix:** Add a compound unique index on `{ stadium: 1, bookingDate: 1, startTime: 1 }` in `Booking.js` or wrap the check and insertion in a Mongoose session transaction (`mongoose.startSession()`).

### 2. Medium: Past-Slot Selection on Current Day
- **File:** `backend/controllers/stadiumController.js` (lines 427–435 & 501–523)
- **Why It Happens:** `checkAvailability` verifies that `date >= todayStr`, but does not compare `slotStart` with the current time of day when `date === todayStr`.
- **Impact:** Users viewing a stadium at 6:00 PM today are presented with 8:00 AM slots marked `available: true`.
- **Recommended Fix:** In `checkAvailability`, if `date === todayStr`, calculate current minutes from midnight (`now.getHours() * 60 + now.getMinutes()`) and mark any slot where `slotStart <= currentMinutes` as `available: false`.

### 3. Medium: Revenue Calculation Heuristic in Admin Dashboard
- **File:** `backend/controllers/adminDashboardController.js` (line 112)
- **Code:** `const val = p.amount >= 1000 ? p.amount / 100 : p.amount;`
- **Why It Happens:** Razorpay stores amounts in paise (1 INR = 100 paise). The controller attempts to guess whether an amount is in paise or rupees by checking `p.amount >= 1000`.
- **Impact:** If a real turf booking costs ₹8.00 (800 paise), the heuristic treats 800 as ₹800 instead of ₹8. Conversely, a ₹15 test payment stored as 15 in rupees is treated as ₹15.
- **Recommended Fix:** Standardize `Payment.amount` strictly in paise across the entire application and consistently divide by 100 (`val = p.amount / 100`).

### 4. Low: Mismatched Notification Fields in Payment Verification
- **File:** `backend/controllers/paymentController.js` (lines 150–157)
- **Why It Happens:** `Notification.create({ ..., relatedId: booking._id, onModel: 'Booking' })` passes fields `relatedId` and `onModel`. However, `Notification.js` schema defines `booking` and `stadium`.
- **Impact:** Mongoose strict mode drops `relatedId` and `onModel`. The notification is successfully created, but its `booking` reference field remains `null`.
- **Recommended Fix:** Change `relatedId: booking._id, onModel: 'Booking'` to `booking: booking._id, stadium: booking.stadium._id`.

### 5. Low: Hardcoded Localhost Fallback in Client API
- **File:** `frontend/src/services/api.js` (line 3)
- **Why It Happens:** `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';`
- **Impact:** If `frontend/.env` is omitted in a production deployment, all API calls default to localhost, failing for remote users.
- **Recommended Fix:** Throw an error or display a visible configuration warning if `import.meta.env.VITE_API_BASE_URL` is undefined in production builds.

---

# 30. INCOMPLETE FEATURES / TODOs

1. **Email Service Hookup:** Inbound support requests and booking status changes do not send transactional emails. Needs Nodemailer or Resend client.
2. **Multipart File Upload Service:** Venue photos and user avatars rely on external image URLs. Needs integration with Multer and cloud storage (Cloudinary / AWS S3).
3. **Razorpay Webhook Endpoint:** Payments rely on client-side verification via `POST /api/payments/verify`. An asynchronous webhook listener (`POST /api/payments/webhook`) is needed to handle abandoned checkouts or delayed bank approvals.
4. **Booking Rescheduling:** No API exists to change the date or slot of an existing booking without canceling and creating a new one.

---

# 31. DEAD / UNUSED CODE

1. **`backend/src/` (Entire Directory):**  
   Contains an obsolete, alternative Express application (`backend/src/server.js`, `backend/src/models/`, `backend/src/routes/`). The active server is `backend/server.js`. `backend/src/` is completely dormant and safe to archive.
2. **`backend/data_store.json`:**  
   Static 26 KB JSON mock archive. Unreferenced by any active code.
3. **`backend/validators/.gitkeep`:**  
   Empty directory. `express-validator` is installed in `package.json`, but all validation was implemented directly in controllers.
4. **Obsolete Route References in `README.md`:**  
   The root `README.md` mentions `/api/events` and `/api/bookings/turf-slots`, which belong to the legacy draft in `backend/src/`. The active production routes are `/api/stadiums/:id/availability` and `/api/bookings`.

---

# 32. DEPLOYMENT READINESS

```text
Deployment Readiness: PARTIALLY READY
```

### Readiness Evaluation
- **Database & Architecture (READY):** Express API and MongoDB Atlas connection operate cleanly over environment variables (`MONGO_URI`).
- **Build Scripts (READY):** Frontend builds cleanly with `vite build` to static HTML/JS/CSS assets.
- **Security & Headers (READY):** Helmet, rate limiting, and CORS are configured.
- **What Remains Before Production Deployment:**
  1. Set production `MONGO_URI` (MongoDB Atlas) and strong `JWT_SECRET` in environment variables.
  2. Set `CLIENT_URL` on backend to your production frontend domain (e.g. `https://stadiumbooking.vercel.app`).
  3. Set `VITE_API_BASE_URL` in frontend build settings to your deployed backend API URL (e.g. `https://api.stadiumbooking.com/api`).
  4. Obtain live Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and replace test keys.
  5. Remove or archive the dormant `backend/src/` directory to prevent confusion.

---

# 33. COMPLETE APPLICATION FLOW

### Guest User Flow
1. Navigates to `/` (Home landing page).
2. Explores popular sports (Cricket, Football, Tennis, etc.) and clicks a category.
3. Navigates to `/stadiums` and filters venues by Country, State, City, or keyword search.
4. Clicks a venue card to view `/stadiums/:id` (inspects amenities, operating hours, and reviews).
5. Clicks "Book Venue" -> Prompted to log in or register.

### Registered User Flow
1. Registers via `/register` (provides name, email, phone, location) -> Redirected to `/login`.
2. Logs in at `/login` -> Redirected to `/dashboard`.
3. Opens `/stadiums/:id` and clicks "Book Venue" -> `DynamicBookingModal` opens.
4. Selects Sport, Date, and Duration -> Picks an available green slot -> Enters player count and nominee info -> Accepts safety terms -> Confirms booking.
5. Redirected to `/dashboard/bookings/:id?new=true` with status `pending`.
6. Clicks "Pay Now" -> Completes Razorpay transaction -> Booking status updates to `confirmed`.
7. Clicks "View Receipt & Turnstile Pass" to open `ReceiptModal` with printable QR pass.
8. After match completion, returns to `/dashboard/bookings/:id` and submits a 5-star review via `ReviewModal`.

### Admin Management Flow
1. Logs in with admin credentials at `/login` -> Automatically routed to `/admin`.
2. Reviews KPI tiles on `AdminOverview` (Active venues, total revenue, pending bookings).
3. Navigates to `AdminBookings` -> Reviews pending reservations -> Clicks "Approve" (notifies customer).
4. Navigates to `AdminStadiums` -> Clicks "Add Venue" -> Fills out `AdminStadiumForm` (operating hours, dimensions, price per hour, facilities) -> Saves new venue to MongoDB.
5. Navigates to `AdminSettings` -> Adjusts global GST percentage and cancellation cutoff policies.
6. Navigates to `AdminActivityLog` -> Inspects timestamped audit log of all changes.

---

# 34. MOST IMPORTANT FILES

1. `backend/server.js`  
   *Purpose:* Express server entry point, middleware registration, and API route mounting.
2. `backend/models/Stadium.js`  
   *Purpose:* Definitive schema for stadiums, turfs, operating hours, and sport configurations.
3. `backend/models/Booking.js`  
   *Purpose:* Core reservation schema storing booking dates, slots, pricing, nominee info, and status.
4. `backend/models/User.js`  
   *Purpose:* User schema with bcrypt password hashing and role definitions (`user` vs `admin`).
5. `backend/models/Payment.js`  
   *Purpose:* Razorpay transaction schema linking orders, payments, and verification signatures.
6. `backend/controllers/stadiumController.js`  
   *Purpose:* Venue search, filtering, and the dynamic non-overlapping slot availability engine.
7. `backend/controllers/bookingController.js`  
   *Purpose:* Booking creation, overlap prevention, cancellation, and admin approval workflows.
8. `backend/controllers/paymentController.js`  
   *Purpose:* Razorpay order generation and HMAC-SHA256 signature verification.
9. `backend/controllers/adminController.js`  
   *Purpose:* Admin user management, system settings updates, and activity audit logging.
10. `backend/controllers/adminDashboardController.js`  
    *Purpose:* Parallel aggregation queries for dashboard KPI metrics and analytics.
11. `backend/middleware/authMiddleware.js`  
    *Purpose:* JWT verification middleware attaching authenticated `req.user`.
12. `backend/middleware/adminMiddleware.js`  
    *Purpose:* RBAC guard ensuring only users with `role: 'admin'` access admin endpoints.
13. `backend/scripts/seedStadiums.js`  
    *Purpose:* Primary seed script populating 14+ Indian and international stadiums.
14. `frontend/src/App.jsx`  
    *Purpose:* Frontend router configuring public, user, and admin route hierarchies.
15. `frontend/src/services/api.js`  
    *Purpose:* Centralized Axios client with token interceptors and all API methods.
16. `frontend/src/context/AuthContext.jsx`  
    *Purpose:* React context managing authentication state, login, register, and token storage.
17. `frontend/src/routes/ProtectedRoute.jsx`  
    *Purpose:* Route protection guards isolating User and Admin spaces.
18. `frontend/src/components/booking/DynamicBookingModal.jsx`  
    *Purpose:* 5-step booking wizard handling sport, date, duration, dynamic slot picking, and terms.
19. `frontend/src/pages/StadiumDetail.jsx`  
    *Purpose:* Full venue specifications, amenities, safety guidelines, and reviews view.
20. `frontend/src/pages/Stadiums.jsx`  
    *Purpose:* Filterable venue discovery catalog with dynamic country, city, and sport filters.
21. `frontend/src/pages/BookingDetail.jsx`  
    *Purpose:* Single booking summary, Razorpay payment trigger, and pass generator.
22. `frontend/src/pages/admin/AdminOverview.jsx`  
    *Purpose:* Master admin dashboard with real-time statistics, charts, and pending action alerts.
23. `frontend/src/pages/admin/AdminStadiumForm.jsx`  
    *Purpose:* Admin venue creation and editing interface.
24. `frontend/src/components/payment/ReceiptModal.jsx`  
    *Purpose:* Printable tax receipt with digital QR pass for turnstiles.
25. `frontend/src/components/admin/AdminLayout.jsx`  
    *Purpose:* Shell layout containing the admin sidebar and header.

---

# 35. CURRENT PROJECT STATE

- **Authentication & User Accounts:** ✅ Working
- **Venue Discovery & Filtering:** ✅ Working
- **Dynamic Slot Availability Engine:** ✅ Working
- **Booking Creation & Lifecycle:** ✅ Working
- **Razorpay Checkout & Signature Verification:** ✅ Working
- **In-App Notifications:** ✅ Working
- **Favorites & Bookmarks:** ✅ Working
- **Completed Booking Reviews:** ✅ Working
- **Admin Dashboard & Metrics:** ✅ Working
- **Admin Stadium CRUD & Deactivation:** ✅ Working
- **Admin Sport Management:** ✅ Working
- **Admin Booking Approval / Rejection:** ✅ Working
- **Admin Audit Logging & Settings:** ✅ Working
- **Digital Tax Receipt & QR Turnstile Pass:** ✅ Working
- **Past-Time Filtering for Today's Date:** ⚠️ Working but needs improvement
- **Revenue Calculation with Paise:** ⚠️ Working but needs improvement
- **Concurrent Overlap Race Prevention:** ⚠️ Working but needs improvement
- **Transactional Email Dispatch:** 🚧 Incomplete (Not hooked up)
- **Image File Uploads (Multer/Cloudinary):** 🚧 Incomplete (Uses HTTPS URLs)
- **Razorpay Webhooks:** 🚧 Incomplete (Client-driven verification only)

---

# 36. RECOMMENDED NEXT DEVELOPMENT ORDER

### Phase 1: Slot Engine & Concurrency Hardening
1. Add a compound unique index in `backend/models/Booking.js` on `{ stadium: 1, bookingDate: 1, startTime: 1 }` (ignoring cancelled bookings) or use a MongoDB session transaction in `createBooking` to make overlap prevention strictly atomic.
2. In `stadiumController.js` (`checkAvailability`), if `date === todayStr`, filter out time slots whose start time has already passed.

### Phase 2: Transactional Email Integration
1. Install `resend` or `nodemailer` in `backend`.
2. Create `backend/utils/emailService.js` with responsive HTML templates.
3. Dispatch emails on:
   - Account registration.
   - Booking submission & admin confirmation.
   - Booking cancellation & receipt dispatch.

### Phase 3: Multipart File & Image Uploads
1. Install `multer` and `cloudinary` in `backend`.
2. Add an upload route `POST /api/upload` protected by admin middleware.
3. Update `AdminStadiumForm.jsx` to support drag-and-drop image uploads alongside external URLs.

### Phase 4: Razorpay Webhook Infrastructure
1. Implement `POST /api/payments/webhook` with `express.raw()` body parsing.
2. Verify Razorpay webhook signatures using `RAZORPAY_WEBHOOK_SECRET`.
3. Handle `payment.captured` and `payment.failed` events to mark bookings asynchronously if a user closes the browser during payment.

### Phase 5: Production Deployment
1. Set up a MongoDB Atlas cluster and acquire production Razorpay keys.
2. Deploy backend to Render / Railway / AWS.
3. Deploy frontend to Vercel / Netlify with `VITE_API_BASE_URL` pointing to production backend.

---

# 37. FINAL CHATGPT HANDOFF

```text
================================================================================
STADIUM BOOKING — CHATGPT PROJECT CONTEXT
================================================================================

PROJECT NAME:
Stadium Booking System (StadiumX)

PROJECT TYPE:
Full-Stack MERN (MongoDB, Express.js, React, Node.js) Web Application

PURPOSE:
An online hourly sports ground, turf, and stadium reservation platform. Allows athletes and teams to discover athletic venues, inspect amenities and pricing, select custom durations, book slots for themselves or nominees, pay online via Razorpay, and access digital turnstile passes. Provides stadium managers with an isolated Admin Portal to manage venues, approve bookings, adjust GST/cancellation policies, view revenue analytics, and inspect audit logs.

FRONTEND:
- React 18, Vite 6, Tailwind CSS 3.4, React Router v7
- Lucide React icons, Canvas Confetti, QRCode
- Centralized Axios client (`api.js`) with automatic JWT Bearer token injection
- Context API: AuthContext (auth/token), ToastContext (alerts)
- Responsive dual layout: Public/User workspace and isolated Admin workspace (`/admin/*`)

BACKEND:
- Node.js & Express.js 4.21
- JWT authentication (`jsonwebtoken`) + bcrypt password hashing (`bcryptjs`)
- Security: Helmet, CORS, express-rate-limit (auth routes), 10kb body parser limit
- Razorpay Node SDK (`razorpay`) with server-side HMAC-SHA256 signature verification
- Centralized Express error handler with Mongoose CastError, duplicate key (E11000), and validation error formatting

DATABASE:
- MongoDB with Mongoose 8
- 11 Models: User, Stadium, Booking, Payment, Review, Favorite, Notification, Sport, Setting, AuditLog, ContactMessage
- Referenced ObjectIds with population, compound unique indexes on Review (`user + booking`) and Favorite (`user + stadium`)

AUTH:
- JWT stored in localStorage under key `stadium_token`
- Middleware: `protect` (verifies token & attaches active `req.user`), `admin` (checks `req.user.role === 'admin'`)
- Dual route guards in frontend: `ProtectedRoute` (user only, redirects admin to `/admin`) and `AdminRoute` (admin only, redirects user to `/dashboard`)

EMAIL:
- Incomplete / None installed. No Nodemailer or Resend in backend.
- Alerts are currently in-app and persisted to MongoDB `notifications` collection.

UPLOADS:
- Image URLs (Unsplash CDN) stored as strings. No Multer or Cloudinary installed.

DEPLOYMENT:
- Backend: Configured for Render/Railway/Node server (`server.js`, PORT 5000)
- Frontend: Configured for Vercel/Netlify/Vite build (`dist/`)
- Current status: PARTIALLY READY (Needs production MONGO_URI, CLIENT_URL, live Razorpay keys)

USER ROLES:
1. Guest: Public discovery, availability checks, venue details.
2. User: Hourly turf slot bookings, nominee bookings, Razorpay checkout, receipts, reviews, favorites.
3. Admin: Full management of venues, sports, approvals, revenue ledger, settings, and audit logs.

MAIN USER FEATURES:
- Register & Login (accepts email or alphanumeric login ID)
- Browse venues with instant Country, State, City, Sport, and Keyword filters
- Stadium details with photos, specs, amenities, safety guidelines, and reviews
- 5-step dynamic booking modal: Sport selection -> Date & duration -> Available slots -> Nominee details -> Terms consent
- Real-time slot availability engine computing non-overlapping windows within venue operating hours
- Digital Razorpay payment and HMAC signature verification
- Printable tax invoice & digital QR turnstile pass
- Booking cancellation, in-app notifications, favorites, and completed-booking reviews

ADMIN FEATURES:
- Admin Dashboard with KPI counters (users, active venues, revenue, unread alerts)
- Interactive charts: revenue over time, bookings by sport, stadium occupancy
- Venue Management: Add, edit, and soft-delete stadiums (operating hours, dimensions, sports)
- Booking Management: Approve pending bookings, reject with reason, mark completed
- User Management: User directory, role promotion/demotion, account deactivation
- Sport Configuration: Minimum/maximum players, duration increments, and safety rules per sport
- Operational Settings: GST percentage, business contact info, cancellation cutoff hours
- System Audit Logs: Immutable log of admin operations with IP tracking
- Broadcast Notifications: Send alerts to all users or specific roles

DATABASE MODELS:
- User: name, email, loginId, password (select: false), role ('user'|'admin'), mobile, age, gender, country, state, city, isActive
- Stadium: name, description, location, address, city, state, country, sports [String], capacity, playerCapacity, audienceCapacity, pricePerHour, gstRate, openingTime, closingTime, facilities [String], images [String], minDuration, maxDuration, allowedDurations, sportConfigurations, safetyRules, termsAndConditions, isActive, createdBy
- Booking: user, stadium, bookingReference, bookingDate, startTime, endTime, duration, pricePerHour, basePrice, gstRate, gstAmount, totalPrice, bookingFor ('myself'|'someone_else'), bookingPerson, gameDetails, status ('pending'|'confirmed'|'cancelled'|'completed'|'rejected'), paymentStatus ('pending'|'paid'), notes, sport, safetyAcknowledged, termsAccepted
- Payment: user, booking, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount (paise), currency, status ('created'|'paid'|'failed'), paidAt
- Review: user, stadium, booking (unique compound with user), rating (1-5), comment, photo
- Favorite: user, stadium (unique compound)
- Notification: user, type, title, message, booking, stadium, isRead, readAt
- Sport: name (unique), description, icon, defaultMinDuration, defaultMaxDuration, durationIncrement, minPlayers, maxPlayers, teamRequired, safetyRules
- Setting: businessName, contactEmail, contactPhone, defaultGstRate, currency, timezone, cancellationCutoffHours, maxAdvanceBookingDays
- AuditLog: admin, action, entity, entityId, details, ipAddress
- ContactMessage: name, email, mobile, subject, message, status ('unread'|'read'|'archived')

IMPORTANT ROUTES:
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/profile
- Stadiums: GET /api/stadiums, GET /api/stadiums/search, GET /api/stadiums/:id/availability, GET /api/stadiums/:id, POST /api/stadiums (admin), PUT /api/stadiums/:id (admin), DELETE /api/stadiums/:id (admin)
- Bookings: POST /api/bookings, GET /api/bookings/my, GET /api/bookings/admin/all (admin), GET /api/bookings/:id, PUT /api/bookings/:id/cancel, PUT /api/bookings/:id/status (admin)
- Payments: POST /api/payments/create-order, POST /api/payments/verify, GET /api/payments/my, GET /api/payments/admin/all (admin)
- Reviews: GET /api/reviews/stadium/:id, POST /api/reviews, GET /api/reviews/my, DELETE /api/reviews/:id
- Admin: GET /api/admin/dashboard, GET /api/admin/analytics, GET /api/admin/reports, GET /api/admin/users, GET /api/admin/activity, GET /api/admin/settings, PUT /api/admin/settings, POST /api/admin/notifications/broadcast

BOOKING FLOW:
User selects stadium -> chooses sport, date, duration -> frontend queries availability endpoint -> slots returned -> user selects start time -> fills nominee and game details -> submits booking -> backend verifies venue active, checks capacity, verifies slot overlap, computes price + GST -> creates booking (pending) -> redirects to booking detail -> user clicks Pay Now -> backend creates Razorpay order -> client opens Razorpay SDK -> user pays -> backend verifies HMAC-SHA256 signature -> marks payment 'paid' and booking 'confirmed' -> generates digital receipt and QR pass.

SLOT SYSTEM:
Dynamic on-demand generation (not stored in DB). Generates 1-hour step slots between stadium openingTime and closingTime. Flags slots as unavailable if an active booking overlaps (`existingStart < slotEnd && existingEnd > slotStart`).

PROJECT STRUCTURE:
- `backend/`: controllers/, models/, routes/, middleware/, config/, scripts/, tests/ (entry: `server.js`)
- `frontend/`: src/components/, src/pages/, src/pages/admin/, src/context/, src/services/, src/data/ (entry: `main.jsx`, router: `App.jsx`)
- `backend/src/`: Obsolete/draft directory from earlier prototype (dormant, ignore).

IMPORTANT FILES:
- `backend/server.js`, `backend/controllers/stadiumController.js`, `backend/controllers/bookingController.js`, `backend/controllers/paymentController.js`
- `frontend/src/App.jsx`, `frontend/src/services/api.js`, `frontend/src/components/booking/DynamicBookingModal.jsx`, `frontend/src/pages/StadiumDetail.jsx`, `frontend/src/pages/admin/AdminOverview.jsx`

CURRENTLY WORKING:
- Full JWT authentication, registration, login, and protected routing.
- Dynamic slot availability calculation and booking creation.
- Razorpay payment order creation and signature verification.
- User dashboard, booking history, payment ledger, favorites, and reviews.
- Complete 16-module Admin Portal (metrics, stadiums, bookings, sports, settings, audit logs).

CURRENTLY BROKEN / QUIRKY:
- `checkAvailability` does not filter out past time slots on current date (`date === todayStr`).
- In `paymentController.js`, `Notification.create()` passes `relatedId` instead of `booking`, leaving notification booking link null.
- Dashboard revenue logic guesses paise vs rupees using `amount >= 1000`.

INCOMPLETE FEATURES:
- Outbound transactional email service (Nodemailer / Resend).
- Multipart image file upload (Multer / Cloudinary).
- Asynchronous Razorpay webhook listener.

KNOWN BUGS:
- Potential booking overlap race condition during high-concurrency requests due to lack of a compound unique index or MongoDB transaction.

SECURITY CONCERNS:
- Hardcoded fallback password strings in `backend/utils/createAdmin.js` and `resetAdminPassword.js`.
- No `express-mongo-sanitize` middleware to prevent MongoDB query selector injection.

DATA PERSISTENCE:
- 100% of data (Users, Stadiums, Bookings, Payments, Reviews, Settings, Logs) persists in MongoDB across server restarts.
- WARNING: Re-running `seedStadiums.js` will overwrite admin modifications made to pre-seeded stadiums.

ENV VARIABLES:
- Backend: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_CURRENCY`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_LOGIN_ID`
- Frontend: `VITE_API_BASE_URL`

LOCAL RUN COMMANDS:
- Install all: `npm run install-all`
- Provision Admin & Venues: `cd backend && node utils/configureAdminAccount.js && node scripts/seedStadiums.js && cd ..`
- Run both: `npm run dev` (Frontend: `http://localhost:5173`, Backend: `http://localhost:5000`)

DEPLOYMENT STATUS:
PARTIALLY READY. Codebase runs cleanly in development. Production deployment requires live MongoDB Atlas URI, live Razorpay API keys, and production CORS/Vite URL configuration.

CURRENT PRIORITIES:
1. Prevent booking race conditions by adding a compound unique index or MongoDB transaction.
2. Filter out past time-slots for current day in `checkAvailability`.
3. Integrate Resend / Nodemailer for booking confirmations.
4. Hook up Multer / Cloudinary for stadium image uploads.
================================================================================
```
