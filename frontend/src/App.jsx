import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Stadiums from './pages/Stadiums';
import StadiumDetail from './pages/StadiumDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Authenticated User Pages
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Admin System Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminStadiums from './pages/admin/AdminStadiums';
import AdminStadiumForm from './pages/admin/AdminStadiumForm';
import AdminStadiumDetail from './pages/admin/AdminStadiumDetail';
import AdminSports from './pages/admin/AdminSports';
import AdminBookings from './pages/admin/AdminBookings';
import AdminBookingDetail from './pages/admin/AdminBookingDetail';
import AdminAvailability from './pages/admin/AdminAvailability';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSafetyRules from './pages/admin/AdminSafetyRules';
import AdminTerms from './pages/admin/AdminTerms';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSettings from './pages/admin/AdminSettings';
import AdminActivityLog from './pages/admin/AdminActivityLog';

// Route Guards
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

// Outlet wrappers for layouts
const PublicLayoutWrapper = () => (
  <PublicLayout>
    <Outlet />
  </PublicLayout>
);

const AuthenticatedLayoutWrapper = () => (
  <AuthenticatedLayout>
    <Outlet />
  </AuthenticatedLayout>
);

const AdminLayoutWrapper = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

// Adaptive discovery route wrappers
const AdaptiveStadiumsRoute = () => {
  const { user } = useAuth();
  return user ? (
    <AuthenticatedLayout>
      <Stadiums />
    </AuthenticatedLayout>
  ) : (
    <PublicLayout>
      <Stadiums />
    </PublicLayout>
  );
};

const AdaptiveStadiumDetailRoute = () => {
  const { user } = useAuth();
  return user ? (
    <AuthenticatedLayout>
      <StadiumDetail />
    </AuthenticatedLayout>
  ) : (
    <PublicLayout>
      <StadiumDetail />
    </PublicLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 1. PUBLIC MARKETING WEBSITE */}
            <Route element={<PublicLayoutWrapper />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* 2. ADAPTIVE DISCOVERY ROUTES */}
            <Route path="/stadiums" element={<AdaptiveStadiumsRoute />} />
            <Route path="/stadiums/:id" element={<AdaptiveStadiumDetailRoute />} />

            {/* 3. AUTHENTICATED USER WORKSPACE */}
            <Route
              element={
                <ProtectedRoute>
                  <AuthenticatedLayoutWrapper />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/bookings" element={<MyBookings />} />
              <Route path="/dashboard/bookings/:id" element={<BookingDetail />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/bookings" element={<Navigate to="/dashboard/bookings" replace />} />
              <Route path="/my-bookings" element={<Navigate to="/dashboard/bookings" replace />} />
              <Route path="/dashboard/payments" element={<Payments />} />
              <Route path="/payments" element={<Navigate to="/dashboard/payments" replace />} />
              <Route path="/dashboard/reviews" element={<Reviews />} />
              <Route path="/reviews" element={<Navigate to="/dashboard/reviews" replace />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
              <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/dashboard/favorites" element={<Navigate to="/favorites" replace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />
            </Route>

            {/* 4. ADMIN MANAGEMENT SYSTEM (Completely isolated application shell) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayoutWrapper />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />

              <Route path="stadiums" element={<AdminStadiums />} />
              <Route path="stadiums/new" element={<AdminStadiumForm />} />
              <Route path="stadiums/:id" element={<AdminStadiumDetail />} />
              <Route path="stadiums/:id/edit" element={<AdminStadiumForm />} />

              <Route path="sports" element={<AdminSports />} />
              <Route path="sports/:id" element={<AdminSports />} />

              <Route path="bookings" element={<AdminBookings />} />
              <Route path="bookings/:id" element={<AdminBookingDetail />} />

              <Route path="availability" element={<AdminAvailability />} />

              <Route path="payments" element={<AdminPayments />} />
              <Route path="payments/:id" element={<AdminPayments />} />

              <Route path="reviews" element={<AdminReviews />} />

              <Route path="notifications" element={<AdminNotifications />} />

              <Route path="safety-rules" element={<AdminSafetyRules />} />
              <Route path="terms" element={<AdminTerms />} />

              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="analytics/bookings" element={<AdminAnalytics />} />
              <Route path="analytics/revenue" element={<AdminAnalytics />} />
              <Route path="analytics/users" element={<AdminAnalytics />} />
              <Route path="analytics/stadiums" element={<AdminAnalytics />} />

              <Route path="reports" element={<AdminReports />} />

              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="activity" element={<AdminActivityLog />} />
            </Route>

            {/* 5. FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
