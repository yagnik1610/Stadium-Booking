# Stadium Booking API Documentation

## 1. Authentication & User Profile
- `POST /api/auth/register` - Register a new customer account
- `POST /api/auth/login` - Authenticate user or administrator and receive JWT token
- `GET /api/auth/profile` - Get logged-in user profile (Protected)
- `GET /api/users/profile` - Retrieve complete user profile details (Protected)
- `PUT /api/users/profile` - Update user name, mobile, address (Protected)
- `PUT /api/users/change-password` - Securely change password (Protected)

---

## 2. Sports Management (`/api/sports`)
- **`GET /api/sports`**
  - **Auth**: None (Public) or Private
  - **Description**: List all active sport disciplines with equipment, duration, and player rules.
  - **Query Parameters**: `search`, `page`, `limit`
  - **Response (200)**: `{ success: true, sports: [...], pagination: { total, totalPages, page, limit } }`
- **`POST /api/sports`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Register a new sport discipline with player/duration constraints.
  - **Body**: `{ name: string, description?: string, minPlayers: number, maxPlayers: number, minDurationHours?: number, maxDurationHours?: number, equipmentRequired?: string[], safetyGuidelines?: string[], isActive?: boolean }`
  - **Response (201)**: `{ success: true, sport: { ... } }`
  - **Errors**: 400 (Validation), 403 (Forbidden), 409 (Duplicate sport name)
- **`GET /api/sports/:id`**
  - **Auth**: None (Public)
  - **Description**: Retrieve detailed specifications for a sport.
  - **Response (200)**: `{ success: true, sport: { ... } }`
  - **Errors**: 404 (Not Found)
- **`PUT /api/sports/:id`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Update sport rules, player capacities, or equipment requirements.
  - **Body**: `{ name?, description?, minPlayers?, maxPlayers?, minDurationHours?, maxDurationHours?, equipmentRequired?, safetyGuidelines?, isActive? }`
  - **Response (200)**: `{ success: true, sport: { ... } }`
  - **Errors**: 400 (Validation), 403 (Forbidden), 404 (Not Found)
- **`DELETE /api/sports/:id`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Safely deactivate or remove a sport discipline.
  - **Response (200)**: `{ success: true, message: 'Sport removed successfully' }`
  - **Errors**: 403 (Forbidden), 404 (Not Found)

---

## 3. Stadiums & Availability
- `GET /api/stadiums` - Get all active stadiums (Public)
- `GET /api/stadiums/search` - Search and filter stadiums by name, city, sport, price (Public)
- `GET /api/stadiums/:id` - Get single stadium detail (Public)
- `GET /api/stadiums/:stadiumId/availability` - Calculate valid availability slots for stadium, date, duration, and sport (Public)
  - **Query Parameters**: `date` (YYYY-MM-DD), `duration` (hours), `sport` (optional)
  - **Response (200)**: `{ success: true, data: { openingTime, closingTime, availableSlots: [...], bookedSlots: [...], slots: [...] } }`
- `POST /api/stadiums` - Create stadium with distinct player and audience capacity, facilities, safety, and terms (Admin)
- `PUT /api/stadiums/:id` - Update stadium configuration (Admin)
- `DELETE /api/stadiums/:id` - Safe soft delete / deactivate stadium (Admin)

---

## 4. Bookings Engine (`/api/bookings`)
- `POST /api/bookings` - Create slot booking with player validation, audience count verification, and GST computation (Protected)
- `GET /api/bookings/my` - Get current customer's booking history (Protected)
- `GET /api/bookings/:id` - Get single booking details (Protected/Owner or Admin)
- `PUT /api/bookings/:id/cancel` - Cancel booking before cutoff threshold (Protected)
- **`GET /api/bookings/admin/all`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: List all platform bookings with extensive multi-field filtering.
  - **Query Parameters**: `page`, `limit`, `search`, `status`, `paymentStatus`, `stadium`, `sport`, `date`
  - **Response (200)**: `{ success: true, data: { bookings: [...], pagination: { total, totalPages, page, limit } } }`
- **`PUT /api/bookings/:id/status`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Approve, reject, or mark booking completed with audit logging.
  - **Body**: `{ status: 'approved' | 'rejected' | 'completed' | 'cancelled', reason?: string }`
  - **Response (200)**: `{ success: true, message: 'Booking status updated', booking: { ... } }`
  - **Errors**: 400 (Invalid status / missing rejection reason), 403 (Forbidden), 404 (Not Found)

---

## 5. Payments & Billing (`/api/payments`)
- `POST /api/payments/create-order` - Create server-side Razorpay order (Protected)
- `POST /api/payments/verify` - Verify gateway HMAC signature and persist payment (Protected)
- `GET /api/payments/my` - Get customer's verified payments (Protected)
- `GET /api/payments/:bookingId` - Get payment for a specific booking (Protected/Owner or Admin)
- **`GET /api/payments/admin/all`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Administrative payment directory with transaction IDs, order IDs, and GST breakdown.
  - **Query Parameters**: `page`, `limit`, `search`, `status`
  - **Response (200)**: `{ success: true, data: { payments: [...], summary: { grossRevenue, gstCollected, completedCount, pendingCount }, pagination: { ... } } }`

---

## 6. Review Moderation (`/api/reviews`)
- `POST /api/reviews` - Add review for verified completed booking (Protected)
- `GET /api/reviews/stadium/:stadiumId` - Get reviews for a stadium (Public)
- `GET /api/reviews/my` - Get current user's reviews (Protected)
- **`GET /api/reviews/admin/all`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: View all customer reviews across stadiums with rating and keyword filters.
  - **Query Parameters**: `page`, `limit`, `rating`, `stadium`, `search`
  - **Response (200)**: `{ success: true, data: { reviews: [...], pagination: { ... } } }`
- **`DELETE /api/reviews/:id`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Permanently delete inappropriate review and recompute stadium average rating.
  - **Response (200)**: `{ success: true, message: 'Review deleted successfully' }`
  - **Errors**: 403 (Forbidden), 404 (Not Found)

---

## 7. Notifications & Broadcasts (`/api/notifications`)
- `GET /api/notifications/my` - Get authenticated user's notification list (Protected)
- `GET /api/notifications/unread-count` - Get count of unread notifications (Protected)
- `PUT /api/notifications/read-all` - Mark all notifications as read (Protected)
- `PUT /api/notifications/:id/read` - Mark single notification as read (Protected)
- **`POST /api/admin/broadcast-notification`** (Alias: `/api/admin/notifications/broadcast`)
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Dispatch verified administrative broadcast to all users, specific roles, or individual user ID.
  - **Body**: `{ title: string, message: string, target?: 'all' | 'users' | 'admins', specificUserId?: string }`
  - **Response (200)**: `{ success: true, message: string, recipientCount: number }`
  - **Errors**: 400 (Validation), 403 (Forbidden)

---

## 8. Admin Intelligence & Operations (`/api/admin`)
- **`GET /api/admin/dashboard`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: High-level platform KPIs: users, stadiums, bookings, revenue, and recent activities.
  - **Response (200)**: `{ success: true, stats: { ... }, recentBookings: [...] }`
- **`GET /api/admin/users`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Paginated customer and staff directory with role, status, and registration date filters.
  - **Query Parameters**: `page`, `limit`, `search`, `role`, `status`
  - **Response (200)**: `{ success: true, users: [...], pagination: { ... } }`
- **`GET /api/admin/users/:id/stats`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Aggregate booking, payment, and review volume for an individual user profile.
  - **Response (200)**: `{ success: true, data: { user, stats: { totalBookings, totalSpent, totalReviews, totalFavorites } } }`
- **`PUT /api/admin/users/:id/status`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Activate or deactivate user account with self-deactivation protection.
  - **Body**: `{ isActive: boolean }`
  - **Response (200)**: `{ success: true, user: { ... }, message: string }`
- **`GET /api/admin/analytics`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Aggregated operational intelligence: bookings by sport, status distribution, revenue by stadium, user growth.
  - **Query Parameters**: `type` (`bookings` | `revenue` | `users` | `stadiums`), `timeRange` (`7d` | `30d` | `90d` | `1y`)
  - **Response (200)**: `{ success: true, analytics: { revenue, bookings, stadiums, users } }`
- **`GET /api/admin/reports`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Filterable tabular dataset for audit reporting and CSV generation.
  - **Query Parameters**: `type` (`bookings` | `revenue` | `payments` | `users` | `reviews`), `startDate`, `endDate`, `stadiumId`, `sport`, `status`
  - **Response (200)**: `{ success: true, reportType: string, summary: { ... }, data: [...] }`
- **`GET /api/admin/settings`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Retrieve system-wide business info, GST config, booking cutoff hours, and safety/terms guidelines.
  - **Response (200)**: `{ success: true, settings: { ... } }`
- **`PUT /api/admin/settings`**
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Update and persist global platform configuration, GST rates, booking rules, and safety/terms versions.
  - **Body**: `{ businessName?, contactEmail?, contactPhone?, defaultGstRate?, currency?, timezone?, cancellationCutoffHours?, maxAdvanceBookingDays?, safetyRules?, termsAndConditions? }`
  - **Response (200)**: `{ success: true, message: string, settings: { ... } }`
- **`GET /api/admin/activity-logs`** (Alias: `/api/admin/activity`)
  - **Auth**: Bearer JWT (Admin required)
  - **Description**: Immutable audit logs of administrative actions, entity modifications, and security events.
  - **Query Parameters**: `page`, `limit`, `action`, `search`
  - **Response (200)**: `{ success: true, logs: [...], pagination: { ... } }`
