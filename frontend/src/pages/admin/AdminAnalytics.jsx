import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Calendar,
  PieChart,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, revenue, users, stadiums
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getAnalytics({ type: activeTab, timeRange });
      if (res && res.success) {
        const raw = res.analytics || res.data?.analytics || res.data || {};
        const bookingsData = raw.bookings || {};
        const revenueData = raw.revenue || {};
        const stadiumsData = raw.stadiums || {};
        const usersData = raw.users || {};

        let formattedData = {};
        if (activeTab === 'bookings') {
          const statusList = Object.entries(bookingsData.statusDistribution || {}).map(([status, count]) => ({
            _id: status,
            count
          }));
          const sportList = Array.isArray(bookingsData.bySport)
            ? bookingsData.bySport.map((s) => ({ _id: s._id || s.sport, count: s.count || s.bookingsCount }))
            : [];
          formattedData = {
            summary: {
              totalBookings: bookingsData.total || 0,
              approvedBookings: (bookingsData.statusDistribution?.confirmed || 0) + (bookingsData.statusDistribution?.approved || 0),
              pendingBookings: bookingsData.statusDistribution?.pending || 0,
              cancelledBookings: bookingsData.statusDistribution?.cancelled || 0,
              rejectedBookings: bookingsData.statusDistribution?.rejected || 0
            },
            bySport: sportList,
            statusBreakdown: statusList,
            dailyTrend: bookingsData.dailyTrend || []
          };
        } else if (activeTab === 'revenue') {
          const stadiumList = Array.isArray(stadiumsData.topPerformers)
            ? stadiumsData.topPerformers.map((s) => ({
                _id: s.stadiumId || s._id,
                stadiumName: s.name,
                revenue: s.totalRevenue || 0,
                bookingsCount: s.bookingCount || 0
              }))
            : [];
          formattedData = {
            summary: {
              totalRevenue: revenueData.totalRevenue || 0,
              totalGst: revenueData.totalGst || 0,
              paidTransactions: revenueData.paidTransactionsCount || 0
            },
            byStadium: stadiumList,
            revenueBySport: revenueData.revenueBySport || {}
          };
        } else if (activeTab === 'users') {
          formattedData = {
            summary: {
              totalUsers: usersData.total || 0,
              activeUsers: usersData.active || 0,
              newUsers: usersData.newLast30Days || 0,
              transactingUsers: usersData.active || 0
            },
            byCity: []
          };
        } else {
          // stadiums
          const stadiumList = Array.isArray(stadiumsData.topPerformers)
            ? stadiumsData.topPerformers.map((s) => ({
                _id: s.stadiumId || s._id,
                name: s.name,
                city: s.city,
                bookingsCount: s.bookingCount || 0,
                revenue: s.totalRevenue || 0,
                avgRating: 5.0,
                isActive: true
              }))
            : [];
          formattedData = {
            stadiums: stadiumList,
            summary: {
              totalStadiums: stadiumList.length
            }
          };
        }
        setData(formattedData);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Error fetching analytics from MongoDB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics & Performance Intelligence</h1>
          <p className="text-sm text-slate-500">
            Real-time operational metrics aggregated directly from MongoDB records.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue text-slate-700 shadow-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Past 12 Months</option>
          </select>

          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-royal-blue text-royal-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Booking Analytics
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'border-royal-blue text-royal-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Revenue & GST
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-royal-blue text-royal-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Analytics
        </button>

        <button
          onClick={() => setActiveTab('stadiums')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stadiums'
              ? 'border-royal-blue text-royal-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Stadium Performance
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-royal-blue mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Aggregating MongoDB datasets...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : !data ? (
        <div className="bg-white p-12 text-center text-slate-400 text-sm rounded-xl border border-slate-200">
          No analytics data returned for the selected criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: BOOKING ANALYTICS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Top KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Total Bookings</span>
                  <div className="text-2xl font-bold text-navy mt-1">
                    {data.summary?.totalBookings || 0}
                  </div>
                  <span className="text-xs text-slate-500">In selected period</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Approved / Confirmed</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {data.summary?.approvedBookings || 0}
                  </div>
                  <span className="text-xs text-slate-500">Scheduled sessions</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Pending Approval</span>
                  <div className="text-2xl font-bold text-amber-500 mt-1">
                    {data.summary?.pendingBookings || 0}
                  </div>
                  <span className="text-xs text-slate-500">Requires review</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Cancelled / Rejected</span>
                  <div className="text-2xl font-bold text-slate-600 mt-1">
                    {(data.summary?.cancelledBookings || 0) + (data.summary?.rejectedBookings || 0)}
                  </div>
                  <span className="text-xs text-slate-500">Terminated bookings</span>
                </div>
              </div>

              {/* Bookings by Sport & Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings by Sport */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Bookings by Sport Discipline</span>
                    <span className="text-xs text-slate-400 font-normal">Aggregated count</span>
                  </h3>
                  <div className="space-y-3">
                    {data.bySport && data.bySport.length > 0 ? (
                      data.bySport.map((item, idx) => {
                        const total = data.summary?.totalBookings || 1;
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{item._id || 'General Sport'}</span>
                              <span className="font-semibold text-slate-900">
                                {item.count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-royal-blue h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 py-4 text-center">No sport booking data</div>
                    )}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Booking Status Breakdown</span>
                    <span className="text-xs text-slate-400 font-normal">Real-time status</span>
                  </h3>
                  <div className="space-y-3">
                    {data.statusBreakdown && data.statusBreakdown.length > 0 ? (
                      data.statusBreakdown.map((item, idx) => {
                        const total = data.summary?.totalBookings || 1;
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span className="capitalize">{item._id || 'unknown'}</span>
                              <span className="font-semibold text-slate-900">
                                {item.count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item._id === 'approved' || item._id === 'completed'
                                    ? 'bg-emerald-500'
                                    : item._id === 'pending'
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 py-4 text-center">No status data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REVENUE ANALYTICS */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Gross Revenue</span>
                  <div className="text-2xl font-bold text-navy mt-1">
                    ₹{data.summary?.totalRevenue?.toLocaleString() || 0}
                  </div>
                  <span className="text-xs text-slate-500">Collected in period</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Statutory GST</span>
                  <div className="text-2xl font-bold text-royal-blue mt-1">
                    ₹{data.summary?.totalGst?.toLocaleString() || 0}
                  </div>
                  <span className="text-xs text-slate-500">18% statutory tax</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Net Facility Revenue</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    ₹{((data.summary?.totalRevenue || 0) - (data.summary?.totalGst || 0)).toLocaleString()}
                  </div>
                  <span className="text-xs text-slate-500">Base earnings</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Successful Transactions</span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {data.summary?.paidTransactions || 0}
                  </div>
                  <span className="text-xs text-slate-500">Server verified</span>
                </div>
              </div>

              {/* Revenue by Stadium / Sport */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3">
                  Revenue Generation by Facility
                </h3>
                <div className="space-y-3">
                  {data.byStadium && data.byStadium.length > 0 ? (
                    data.byStadium.map((item, idx) => {
                      const maxRev = Math.max(...data.byStadium.map((s) => s.revenue || 1));
                      const pct = Math.round(((item.revenue || 0) / maxRev) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span>{item.stadiumName || item._id || 'Stadium'}</span>
                            <span className="font-bold text-slate-900">
                              ₹{(item.revenue || 0).toLocaleString()} ({item.bookingsCount || 0} bookings)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No stadium revenue data</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER ANALYTICS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Total Registered Users</span>
                  <div className="text-2xl font-bold text-navy mt-1">
                    {data.summary?.totalUsers || 0}
                  </div>
                  <span className="text-xs text-slate-500">Total database accounts</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Active Accounts</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {data.summary?.activeUsers || 0}
                  </div>
                  <span className="text-xs text-slate-500">Eligible to book</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">New Signups in Period</span>
                  <div className="text-2xl font-bold text-royal-blue mt-1">
                    {data.summary?.newUsers || 0}
                  </div>
                  <span className="text-xs text-slate-500">Growth indicator</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Customers with Bookings</span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {data.summary?.transactingUsers || 0}
                  </div>
                  <span className="text-xs text-slate-500">Converted users</span>
                </div>
              </div>

              {/* Users by Location / Role */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3">
                  User Distribution by Geography / City
                </h3>
                <div className="space-y-3">
                  {data.byCity && data.byCity.length > 0 ? (
                    data.byCity.map((item, idx) => {
                      const total = data.summary?.totalUsers || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span>{item._id || 'Unspecified Location'}</span>
                            <span className="font-semibold text-slate-900">
                              {item.count} users ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-royal-blue h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No location demographic data</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STADIUM PERFORMANCE */}
          {activeTab === 'stadiums' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-navy">Facility Performance & Booking Efficiency</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated by total confirmed bookings, gross revenue generated, and customer ratings
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Facility Name</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Total Bookings</th>
                        <th className="px-4 py-3">Gross Revenue</th>
                        <th className="px-4 py-3">Avg Rating</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.stadiums && data.stadiums.length > 0 ? (
                        data.stadiums.map((std) => (
                          <tr key={std._id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-800">{std.name}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{std.city || 'Metro'}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{std.bookingsCount || 0}</td>
                            <td className="px-4 py-3 font-bold text-navy">
                              ₹{(std.revenue || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-xs text-amber-600 font-bold">
                              ★ {std.avgRating?.toFixed(1) || '5.0'}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span
                                className={`px-2 py-0.5 rounded-full font-medium ${
                                  std.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {std.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-xs">
                            No stadium performance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
