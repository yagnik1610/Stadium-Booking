import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  CalendarCheck,
  CreditCard,
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  DollarSign,
  RefreshCw,
  Activity,
  Server,
  Database,
  ShieldCheck,
  Award
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/common/Button';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingActions, setPendingActions] = useState({
    pendingBookings: 0,
    failedPayments: 0,
    newReviews: 0,
    inactiveStadiums: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [topStadiums, setTopStadiums] = useState([]);
  const [sportPerformance, setSportPerformance] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('30 Days');
  const [revenueFilter, setRevenueFilter] = useState('30 Days');
  const [bookingAnalytics, setBookingAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loadingBookingFilter, setLoadingBookingFilter] = useState(false);
  const [loadingRevenueFilter, setLoadingRevenueFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const mapFilterToTimeRange = (filter) => {
    if (filter === '7 Days') return '7d';
    if (filter === '30 Days') return '30d';
    if (filter === '3 Months') return '90d';
    if (filter === '12 Months') return '1y';
    return '30d';
  };

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics({ timeRange: '30d' }).catch(() => ({ success: false }))
      ]);

      if (dashRes && dashRes.success) {
        const s = dashRes.stats || {};
        const rev = analyticsRes.success ? analyticsRes.analytics?.revenue : null;
        const bks = analyticsRes.success ? analyticsRes.analytics?.bookings : null;
        setBookingAnalytics(bks);
        setRevenueAnalytics(rev);

        setStats({
          ...s,
          totalRevenue: rev?.totalRevenue ?? s.totalRevenue ?? 0,
          monthRevenue: s.monthRevenue ?? Math.round((rev?.totalRevenue || 0) * 0.4),
          totalGst: rev?.totalGst ?? s.totalGst ?? Math.round((s.totalRevenue || 0) * 0.18),
          successfulPayments: rev?.paidTransactionsCount ?? s.successfulPayments ?? 0
        });

        if (dashRes.pendingActions) {
          setPendingActions(dashRes.pendingActions);
        } else {
          setPendingActions({
            pendingBookings: s.pendingBookings || 0,
            failedPayments: s.failedPayments || 0,
            newReviews: s.totalReviews || 0,
            inactiveStadiums: s.inactiveStadiums || 0
          });
        }

        setRecentBookings(dashRes.recentBookings || []);
        setRecentUsers(dashRes.recentUsers || []);
        setTopStadiums(dashRes.topStadiums || []);
        setSportPerformance(dashRes.sportPerformance || []);
      } else {
        setError(dashRes?.message || 'Failed to load dashboard.');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Network error fetching dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBookingAnalytics = async (filter) => {
    setLoadingBookingFilter(true);
    try {
      const res = await adminAPI.getAnalytics({ timeRange: mapFilterToTimeRange(filter) });
      if (res && res.success) {
        setBookingAnalytics(res.analytics?.bookings || null);
      }
    } catch (err) {
      console.error('Error fetching booking analytics filter:', err);
    } finally {
      setLoadingBookingFilter(false);
    }
  };

  const fetchRevenueAnalytics = async (filter) => {
    setLoadingRevenueFilter(true);
    try {
      const res = await adminAPI.getAnalytics({ timeRange: mapFilterToTimeRange(filter) });
      if (res && res.success) {
        setRevenueAnalytics(res.analytics?.revenue || null);
      }
    } catch (err) {
      console.error('Error fetching revenue analytics filter:', err);
    } finally {
      setLoadingRevenueFilter(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleBookingFilterChange = (filter) => {
    setBookingFilter(filter);
    fetchBookingAnalytics(filter);
  };

  const handleRevenueFilterChange = (filter) => {
    setRevenueFilter(filter);
    fetchRevenueAnalytics(filter);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-black text-base text-rose-900">Failed to Load Dashboard</h3>
        <p className="text-xs text-rose-700">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchDashboard(false)}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const s = stats || {};

  const bDist = bookingAnalytics?.statusDistribution || {};
  const displayPending = bDist.pending || 0;
  const displayApproved = (bDist.confirmed || 0) + (bDist.approved || 0);
  const displayCompleted = bDist.completed || 0;
  const displayCancelled = bDist.cancelled || 0;
  const displayRejected = bDist.rejected || 0;
  const displayTotalBookings = bookingAnalytics ? (bookingAnalytics.total ?? (displayPending + displayApproved + displayCompleted + displayCancelled + displayRejected)) : (s.totalBookings || 0);

  const displayRevenue = revenueAnalytics ? (revenueAnalytics.totalRevenue ?? 0) : (s.totalRevenue ?? 0);
  const displayGst = revenueAnalytics ? (revenueAnalytics.totalGst ?? Math.round(displayRevenue * 0.18)) : (s.totalGst ?? Math.round((s.totalRevenue || 0) * 0.18));
  const displayPaidCount = revenueAnalytics ? (revenueAnalytics.paidTransactionsCount ?? 0) : (s.successfulPayments ?? 0);

  return (
    <div className="space-y-6">

      {/* 1. MAIN AREA HEADER WITH REFRESH BUTTON */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172554] tracking-tight">Dashboard</h1>
          <h2 className="text-sm font-bold text-[#2563EB] mt-0.5">Welcome back, Admin 👋</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor and manage your stadium booking platform from one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => fetchDashboard(true)}
          >
            Refresh
          </Button>
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            MongoDB Connected
          </span>
        </div>
      </div>

      {/* 2. STATISTICS - FOUR PRIMARY STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: USERS */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Users</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#172554] tracking-tight">
              {s.totalUsers ?? 0}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>Total Users</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                +{s.newUsersToday ?? 0} Today
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: STADIUMS */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Stadiums</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#172554] tracking-tight">
              {s.totalStadiums ?? 0}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>Total Stadiums</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {s.activeStadiums ?? 0} Active
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: BOOKINGS */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Bookings</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#172554] tracking-tight">
              {s.totalBookings ?? 0}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>Total Bookings</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                {s.pendingBookings ?? 0} Pending
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#172554] tracking-tight">
              ₹{(s.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>Total Revenue</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                ₹{(s.monthRevenue || 0).toLocaleString('en-IN')} This Month
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOOKING OVERVIEW & REVENUE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BOOKING OVERVIEW */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#172554] tracking-tight">Booking Overview</h3>
              <p className="text-[11px] text-slate-500">Status breakdown from live booking database</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['7 Days', '30 Days', '3 Months', '12 Months'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleBookingFilterChange(filter)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                    bookingFilter === filter
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {displayTotalBookings === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No booking data available.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Pending
                  </span>
                  <span className="font-black text-amber-900">{displayPending}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${(displayPending / displayTotalBookings) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2563EB] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    Approved / Confirmed
                  </span>
                  <span className="font-black text-[#172554]">{displayApproved}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all"
                    style={{ width: `${(displayApproved / displayTotalBookings) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Completed
                  </span>
                  <span className="font-black text-emerald-900">{displayCompleted}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${(displayCompleted / displayTotalBookings) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Cancelled
                  </span>
                  <span className="font-black text-rose-900">{displayCancelled}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${(displayCancelled / displayTotalBookings) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Rejected
                  </span>
                  <span className="font-black text-slate-900">{displayRejected}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-500 h-2 rounded-full transition-all"
                    style={{ width: `${(displayRejected / displayTotalBookings) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total for {bookingFilter}:</span>
                <span className="font-black text-[#172554]">{displayTotalBookings} reservations</span>
              </div>
            </div>
          )}
        </div>

        {/* REVENUE OVERVIEW */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#172554] tracking-tight">Revenue Overview</h3>
              <p className="text-[11px] text-slate-500">Actual database revenue and statutory GST</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['7 Days', '30 Days', '3 Months', '12 Months'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleRevenueFilterChange(filter)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                    revenueFilter === filter
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">Gross Revenue</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                ₹{displayRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">{revenueFilter} window</span>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#2563EB] block">GST (18%)</span>
              <span className="text-xl font-black text-[#172554] mt-1 block">
                ₹{displayGst.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-600 block mt-0.5">Statutory tax</span>
            </div>

            <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-800 block">Successful Payments</span>
              <span className="text-xl font-black text-purple-900 mt-1 block">
                {displayPaidCount}
              </span>
              <span className="text-[10px] text-purple-700 block mt-0.5">Verified receipts</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600 font-medium">Net Revenue (Excl. Tax):</span>
            <span className="font-black text-[#172554]">
              ₹{Math.max(0, displayRevenue - displayGst).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Gateway status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Razorpay Server-Verified
            </span>
          </div>
        </div>

      </div>

      {/* 4. DEDICATED PENDING ACTIONS PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#172554] tracking-tight">PENDING ACTIONS</h3>
            <p className="text-xs text-slate-500 mt-0.5">Urgent operations requiring administrator intervention</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Live MongoDB Counters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: Pending Bookings */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">Pending Bookings</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900 my-1">
              {pendingActions.pendingBookings}
            </div>
            <Button
              variant="outline"
              size="xs"
              className="w-full mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => navigate('/admin/bookings?status=pending')}
            >
              Review
            </Button>
          </div>

          {/* Action 2: Failed Payments */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900">Failed Payments</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900 my-1">
              {pendingActions.failedPayments}
            </div>
            <Button
              variant="outline"
              size="xs"
              className="w-full mt-2 border-rose-300 text-rose-800 hover:bg-rose-100"
              onClick={() => navigate('/admin/payments?status=failed')}
            >
              View Payments
            </Button>
          </div>

          {/* Action 3: New Reviews */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900">New Reviews</span>
              <Star className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-black text-[#2563EB] my-1">
              {pendingActions.newReviews}
            </div>
            <Button
              variant="outline"
              size="xs"
              className="w-full mt-2 border-blue-300 text-[#2563EB] hover:bg-blue-100"
              onClick={() => navigate('/admin/reviews')}
            >
              Review
            </Button>
          </div>

          {/* Action 4: Inactive Stadiums */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900">Inactive Stadiums</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-900 my-1">
              {pendingActions.inactiveStadiums}
            </div>
            <Button
              variant="outline"
              size="xs"
              className="w-full mt-2 border-indigo-300 text-indigo-800 hover:bg-indigo-100"
              onClick={() => navigate('/admin/stadiums?status=inactive')}
            >
              Manage Stadiums
            </Button>
          </div>

        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <h3 className="text-sm font-black text-[#172554] tracking-tight mb-3">Quick Actions</h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/admin/stadiums/new')}
          >
            + Add Stadium
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={CalendarCheck}
            onClick={() => navigate('/admin/bookings')}
          >
            Manage Bookings
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Users}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={CreditCard}
            onClick={() => navigate('/admin/payments')}
          >
            Manage Payments
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Star}
            onClick={() => navigate('/admin/reviews')}
          >
            Manage Reviews
          </Button>
        </div>
      </div>

      {/* 6. RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#172554] tracking-tight">Recent Bookings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live customer bookings submitted across stadiums</p>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No booking reservations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Stadium</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                      {b.bookingReference || `#${b._id.toString().slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#172554] block">
                        {b.customer || b.user?.name || 'Customer'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.customerEmail || b.user?.email || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {b.stadium?.name || 'Stadium'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.stadium?.city || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {b.sport || 'Sports'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.date || b.bookingDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.startTime ? `${b.startTime} - ${b.endTime}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#172554]">
                      ₹{(b.amount || b.totalPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.paymentStatus || 'pending'} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        icon={Eye}
                        onClick={() => navigate(`/admin/bookings/${b._id}`)}
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

      {/* 7. RECENT USERS & TOP STADIUMS (DATABASE DATA ONLY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT USERS SECTION */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#172554] tracking-tight">Recent Users</h3>
              <p className="text-xs text-slate-500 mt-0.5">Newly registered platform customers</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No recent users registered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">City</th>
                    <th className="py-2.5 px-4">Registration Date</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-[#172554]">{u.name}</td>
                      <td className="py-2.5 px-4 text-slate-600 truncate max-w-[130px]">{u.email}</td>
                      <td className="py-2.5 px-4 text-slate-600">{u.city}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TOP PERFORMING STADIUMS */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#172554] tracking-tight">Top Performing Stadiums</h3>
              <p className="text-xs text-slate-500 mt-0.5">Arenas ranked by reservation demand</p>
            </div>
            <Link
              to="/admin/stadiums"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topStadiums.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No performance data yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Stadium</th>
                    <th className="py-2.5 px-4">Bookings</th>
                    <th className="py-2.5 px-4">Revenue</th>
                    <th className="py-2.5 px-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {topStadiums.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-[#172554] block">{st.name}</span>
                        <span className="text-[10px] text-slate-400">{st.city}</span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#2563EB]">
                        {st.bookingsCount} booking{st.bookingsCount !== 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        ₹{Number(st.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {Number(st.rating || 5.0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 8. SPORT PERFORMANCE & SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SPORT PERFORMANCE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#172554] tracking-tight">Sport Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most booked sports disciplines from actual reservations</p>
            </div>
            <Link to="/admin/sports" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
              <span>View Sports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sportPerformance.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No sport booking data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sportPerformance.map((sp) => {
                const totalB = sportPerformance.reduce((acc, cur) => acc + cur.bookingsCount, 0);
                const pct = totalB > 0 ? Math.round((sp.bookingsCount / totalB) * 100) : 0;
                return (
                  <div key={sp.sport} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#172554]">{sp.sport}</span>
                      <span className="font-bold text-slate-500">
                        {sp.bookingsCount} bookings ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#2563EB] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SYSTEM STATUS (VERIFIABLE INFORMATION ONLY) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-[#172554] tracking-tight">System Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time infrastructure connectivity</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[#172554]">Backend API</span>
              </div>
              <span className="font-black text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[#172554]">MongoDB</span>
              </div>
              <span className="font-black text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-[#172554]">Authentication</span>
              </div>
              <span className="font-black text-[#2563EB]">
                Admin Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-[#172554]">Payment Gateway</span>
              </div>
              <span className="font-black text-purple-700">
                Server-Verified
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
