import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, favoriteAPI, notificationAPI, stadiumAPI } from '../services/api';
import { 
  Calendar, Clock, MapPin, CreditCard, Heart, Bell, 
  ArrowRight, CheckCircle2, AlertCircle, Building2,
  ChevronRight, RefreshCw, Trophy, ShieldCheck, Sparkles
} from 'lucide-react';
import IMAGES from '../config/images';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real backend metrics
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [featuredStadiums, setFeaturedStadiums] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, favRes, notifRes, stadiumsRes] = await Promise.all([
        bookingAPI.getMyBookings(),
        favoriteAPI.getMyFavorites().catch(() => ({ success: true, favorites: [] })),
        notificationAPI.getUnreadCount().catch(() => ({ success: true, unreadCount: 0 })),
        stadiumAPI.getAll({ limit: 3 }).catch(() => ({ success: true, stadiums: [] }))
      ]);

      if (bookingsRes.success && Array.isArray(bookingsRes.bookings)) {
        setBookings(bookingsRes.bookings);
      }
      if (favRes.success && Array.isArray(favRes.favorites)) {
        setFavorites(favRes.favorites);
      }
      if (notifRes.success && typeof notifRes.unreadCount === 'number') {
        setUnreadCount(notifRes.unreadCount);
      }
      if (stadiumsRes.success && Array.isArray(stadiumsRes.stadiums)) {
        setFeaturedStadiums(stadiumsRes.stadiums.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter Bookings by exact date categories
  const todayBookings = bookings.filter(b => b.bookingDate === todayStr && b.status !== 'cancelled');
  const upcomingBookings = bookings
    .filter(b => b.bookingDate > todayStr && (b.status === 'confirmed' || b.status === 'pending'))
    .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
  const completedBookings = bookings.filter(b => b.status === 'completed' || (b.bookingDate < todayStr && b.status === 'confirmed'));
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate)).slice(0, 4);

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0';
    return price.toLocaleString('en-IN');
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Paid</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Unpaid</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white rounded-xl border border-slate-200 p-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-64 bg-white rounded-xl border border-slate-200" />
          <div className="lg:col-span-4 h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  const nextUpcoming = upcomingBookings[0];

  return (
    <div className="space-y-7">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-blue-200/50">
              DASHBOARD OVERVIEW
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight">
            Welcome back, {user?.name || 'Athlete'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Manage your bookings, payments, saved stadiums and notifications from one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/stadiums')}
            icon={Building2}
          >
            Book Stadium
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. FOUR PRIMARY METRIC CARDS (Exact same dimensions: height 120-135px, padding 18-22px, radius 12-14px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Bookings */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between h-[128px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#172554] leading-tight">{bookings.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">All reservations</p>
          </div>
        </div>

        {/* Metric 2: Upcoming */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between h-[128px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Upcoming</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 leading-tight">{upcomingBookings.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled slots</p>
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between h-[128px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#172554] leading-tight">{completedBookings.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Played sessions</p>
          </div>
        </div>

        {/* Metric 4: Saved Venues */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between h-[128px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Saved Venues</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#172554] leading-tight">{favorites.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Favorite arenas</p>
          </div>
        </div>

      </div>

      {/* 3. TODAY'S BOOKING (Prominent when exists, clean empty state when none) */}
      {todayBookings.length > 0 ? (
        <div className="bg-[#EFF6FF]/60 border-2 border-[#2563EB]/40 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-[#2563EB] text-white shadow-xs animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                TODAY'S BOOKING
              </span>
              <span className="text-xs font-bold text-[#172554]">
                You have {todayBookings.length} session{todayBookings.length > 1 ? 's' : ''} today
              </span>
            </div>
            <Link to="/dashboard/bookings" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayBookings.map((tb) => (
              <div key={tb._id} className="bg-white rounded-xl border border-blue-200/80 p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        {tb.sport || 'Sports Match'}
                      </span>
                      <h3 className="font-extrabold text-sm text-[#172554] mt-1 truncate">
                        {tb.stadium?.name || 'Reserved Stadium'}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{tb.stadium?.city || 'Local Arena'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#2563EB]">₹{formatPrice(tb.totalPrice)}</div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        {getStatusBadge(tb.status)}
                        {getPaymentBadge(tb.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] rounded-lg p-2.5 my-2 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">SLOT TIME</span>
                      <span className="font-bold text-[#172554]">{tb.startTime} - {tb.endTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">BOOKING REF</span>
                      <span className="font-mono font-bold text-[#172554]">{tb.bookingReference || 'STB-BOOK'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/bookings/${tb._id}`)}
                  >
                    View Booking
                  </Button>
                  {tb.paymentStatus !== 'paid' && tb.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/bookings/${tb._id}`)}
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#172554]">No booking scheduled for today.</span>
              <p className="text-slate-400 text-[11px]">Explore available arena slots to play your next match.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/stadiums')}>
            Find a Stadium
          </Button>
        </div>
      )}

      {/* 4. TWO-COLUMN GRID: 70% Content / 30% Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (lg:col-span-8): Upcoming Booking + Recent Activity */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Next Upcoming Booking */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#172554] uppercase tracking-wide">Upcoming Booking</h2>
                <p className="text-xs text-slate-400">Nearest upcoming confirmed or pending reservation</p>
              </div>
              <Link to="/dashboard/bookings" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-0.5">
                All Bookings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {nextUpcoming ? (
              <div className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-[#F8FAFC]/50">
                
                {/* Left Image / Thumbnail (approx 120-140px wide) */}
                <div className="w-full sm:w-[130px] h-[90px] rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={
                      (nextUpcoming.stadium?.images && nextUpcoming.stadium.images[0]) ||
                      nextUpcoming.stadium?.image ||
                      IMAGES.STADIUM_FALLBACKS[0]
                    }
                    alt={nextUpcoming.stadium?.name || 'Stadium'}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Center Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      {nextUpcoming.sport || 'Sports Match'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {nextUpcoming.stadium?.city || 'Venue Location'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-[#172554] truncate">
                    {nextUpcoming.stadium?.name || 'Stadium Reservation'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextUpcoming.bookingDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextUpcoming.startTime} - {nextUpcoming.endTime}</span>
                  </p>
                </div>

                {/* Right: Price + Status + Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-[#172554] block">₹{formatPrice(nextUpcoming.totalPrice)}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getStatusBadge(nextUpcoming.status)}
                      {getPaymentBadge(nextUpcoming.paymentStatus)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/dashboard/bookings/${nextUpcoming._id}`)}
                  >
                    View Booking
                  </Button>
                </div>

              </div>
            ) : (
              <div className="text-center py-7 px-4 bg-[#F8FAFC] rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-[#172554]">No upcoming bookings scheduled</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5 mb-3">
                  You don't have future slots reserved. Book a venue to schedule your upcoming match.
                </p>
                <Button size="xs" variant="primary" onClick={() => navigate('/stadiums')}>
                  Explore Stadiums
                </Button>
              </div>
            )}
          </div>

          {/* Section: Recent Bookings Table / List */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#172554] uppercase tracking-wide">Recent Bookings</h2>
                <p className="text-xs text-slate-400">Latest reservation status and activity</p>
              </div>
              <Link to="/dashboard/bookings" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-0.5">
                Complete History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous bookings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 pr-3">Stadium</th>
                      <th className="py-2.5 px-3">Sport</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-3">
                          <span className="font-bold text-[#172554] block truncate max-w-[150px]">
                            {b.stadium?.name || 'Sports Arena'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{b.bookingReference || 'STB'}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600">
                          {b.sport || 'Match'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          <div>{b.bookingDate}</div>
                          <div className="text-[10px] text-slate-400">{b.startTime} - {b.endTime}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-[#172554] whitespace-nowrap">
                          ₹{formatPrice(b.totalPrice)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(b.status)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getPaymentBadge(b.paymentStatus)}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/bookings/${b._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (lg:col-span-4): Compact Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">
              Quick Actions
            </h3>
            
            <div className="space-y-2.5">
              
              <Link
                to="/stadiums"
                className="flex items-center justify-between p-3.5 h-[56px] rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-[#F0F7FF] transition-all text-xs font-bold text-[#172554] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>Find & Book Stadium</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
              </Link>

              <Link
                to="/dashboard/bookings"
                className="flex items-center justify-between p-3.5 h-[56px] rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-[#F0F7FF] transition-all text-xs font-bold text-[#172554] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>Manage My Bookings</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </Link>

              <Link
                to="/favorites"
                className="flex items-center justify-between p-3.5 h-[56px] rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-[#F0F7FF] transition-all text-xs font-bold text-[#172554] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>Saved Favorites</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </Link>

              <Link
                to="/dashboard/payments"
                className="flex items-center justify-between p-3.5 h-[56px] rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-[#F0F7FF] transition-all text-xs font-bold text-[#172554] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Payment History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Link>

            </div>
          </div>

          {/* Mini Featured Venues Preview */}
          {featuredStadiums.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Featured Arenas
                </span>
                <Link to="/stadiums" className="text-[11px] font-bold text-[#2563EB] hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {featuredStadiums.map(st => (
                  <div 
                    key={st._id}
                    onClick={() => navigate(`/stadiums/${st._id}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={(st.images && st.images[0]) || st.image || IMAGES.STADIUM_FALLBACKS[0]}
                        alt={st.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#172554] truncate">{st.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{st.city || st.country} • ₹{formatPrice(st.pricePerHour)}/hr</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
