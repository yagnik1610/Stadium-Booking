# 🏟️ StadiumX - Full-Stack MERN Stadium & Turf Booking Platform

A modern, production-grade **MERN (MongoDB, Express.js, React, Node.js)** web application for **Stadium Match Ticket Reservations** (with interactive 2D/3D seat and stand selection) and **Sports Turf & Arena Hourly Slot Bookings** with instant QR code digital passes.

---

## 🌟 Key Features

1. **Dual Booking Modes**:
   - **Match / Concert Tickets**: Interactive stadium stand & seat selector (VIP Lounges, Premium Box, General Stands) with real-time seat locking and angle views.
   - **Turf & Ground Slot Rentals**: Hourly time-slot scheduling (06:00 AM - 11:00 PM) for Cricket, Football, and Badminton with equipment & floodlight add-ons.
2. **Dynamic QR Digital Pass Generation**:
   - Instant scannable turnstile passes rendered on dynamic HTML5 canvas with holographic foil styling.
   - Printable receipt and matchday pass download.
3. **Interactive Checkout & Promo Simulator**:
   - Multi-step modal supporting Credit Card, UPI / QR scanner, and NetBanking with discount promo engine (e.g. `STADIUM50`, `GAMEON20`).
4. **Organizer & Admin Management Dashboard**:
   - Live revenue analytics, total bookings, seat occupancy volume, and sport distribution charts.
   - Match Scheduler: Create, publish, and manage sports events.
   - Venue Manager: Add stadiums and turf arenas with custom pricing.
5. **JWT Authentication & Role Guard**:
   - Secure login and registration with standard Fan and Admin roles.
   - 1-click Demo Logins for instant evaluation.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
In the root directory, run:
```bash
npm run install-all
```
*(Or install backend and frontend individually)*:
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 2. Seed Sample Stadiums & Matches
```bash
npm run seed
```

### 3. Launch Application (Frontend + Backend Concurrently)
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin / Organizer** | `admin@stadium.com` | `admin123` | Full Admin Portal, Match Creation, Analytics |
| **Demo Fan / User** | `john@example.com` | `user123` | Match Booking, Turf Slots, QR Wallet |

*(You can also use the **Demo: User** or **Demo: Admin** instant buttons in the navbar and login screen.)*

---

## 🏗️ Project Architecture

```
stadium-booking/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & memory store fallback
│   │   ├── controllers/     # Auth, Stadium, Event, Booking, Admin
│   │   ├── middleware/      # JWT auth guard & admin protection
│   │   ├── models/          # User, Stadium, Event, Booking schemas
│   │   ├── routes/          # Express REST API routes
│   │   ├── seed/            # Pre-seeded stadiums, matches, passes
│   │   └── server.js        # Server entry point
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # StadiumMap, TurfSlotPicker, TicketCard, CheckoutModal...
│   │   ├── context/         # AuthContext with JWT & demo state
│   │   ├── pages/           # Home, Events, EventBooking, Stadiums, TurfBooking, MyBookings, AdminDashboard, Auth...
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json             # Root runner
└── README.md
```

---

## 🛠️ REST API Endpoints

- **Auth**:
  - `POST /api/auth/register` - Create user
  - `POST /api/auth/login` - Sign in & receive JWT
  - `GET /api/auth/me` - Current user profile
- **Stadiums & Turfs**:
  - `GET /api/stadiums` - List all venues (filter by sport, city, type)
  - `GET /api/stadiums/:id` - Detailed venue info with stands
  - `POST /api/stadiums` - Add venue (Admin)
- **Events & Matches**:
  - `GET /api/events` - Upcoming matches with pricing
  - `GET /api/events/:id` - Match details with booked seat status
  - `POST /api/events` - Publish match (Admin)
- **Bookings & Passes**:
  - `POST /api/bookings` - Create ticket or turf reservation
  - `GET /api/bookings/my` - User's booking wallet
  - `GET /api/bookings/turf-slots` - Real-time slot availability
  - `PUT /api/bookings/:id/cancel` - Cancel booking and process refund
- **Admin**:
  - `GET /api/admin/stats` - Total revenue, occupancy, sport breakdown
  - `GET /api/admin/bookings` - All transactions log
