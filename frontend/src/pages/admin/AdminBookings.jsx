import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, sportAPI, stadiumAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stadiums, setStadiums] = useState([]);
  const [sports, setSports] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [stadiumFilter, setStadiumFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Dialog states
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    confirmText: 'Confirm',
    showInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    onConfirm: () => {}
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load stadiums and sports for filter dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [stadiumRes, sportsRes] = await Promise.all([
          stadiumAPI.getAll({ limit: 100 }),
          sportAPI.getAll({ limit: 100 })
        ]);
        if (stadiumRes && (stadiumRes.stadiums || stadiumRes.data?.stadiums)) {
          setStadiums(stadiumRes.stadiums || stadiumRes.data?.stadiums || []);
        }
        if (sportsRes && (sportsRes.sports || sportsRes.data?.sports)) {
          setSports(sportsRes.sports || sportsRes.data?.sports || []);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        stadium: stadiumFilter || undefined,
        sport: sportFilter || undefined,
        date: dateFilter || undefined
      };

      const res = await adminAPI.getAllBookings(params);
      if (res && res.success) {
        const list = res.bookings || (Array.isArray(res.data) ? res.data : res.data?.bookings) || [];
        setBookings(list);
        setTotalPages(res.pagination?.totalPages || res.totalPages || 1);
        setTotalCount(res.total !== undefined ? res.total : (res.pagination?.total || list.length));
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      showNotification('error', err.message || 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, paymentFilter, stadiumFilter, sportFilter, dateFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchBookings();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [fetchBookings]);

  const handleApprove = (booking) => {
    setDialogConfig({
      isOpen: true,
      title: 'Approve Booking',
      message: `Are you sure you want to approve booking ${booking.bookingReference || booking._id}? This will notify the customer.`,
      type: 'success',
      confirmText: 'Approve Booking',
      showInput: false,
      onConfirm: async () => {
        try {
          await adminAPI.updateBookingStatus(booking._id, { status: 'confirmed' });
          showNotification('success', `Booking ${booking.bookingReference || ''} approved successfully!`);
          fetchBookings();
        } catch (err) {
          showNotification('error', err.message || 'Failed to approve booking');
        }
      }
    });
  };

  const handleReject = (booking) => {
    setDialogConfig({
      isOpen: true,
      title: 'Reject Booking',
      message: `Enter the reason for rejecting booking ${booking.bookingReference || booking._id}. This reason will be recorded and sent to the user.`,
      type: 'danger',
      confirmText: 'Reject Booking',
      showInput: true,
      inputLabel: 'Rejection Reason (Required)',
      inputPlaceholder: 'e.g., Facility undergoing emergency maintenance, scheduling conflict',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) {
          showNotification('error', 'Rejection reason is required');
          return;
        }
        try {
          await adminAPI.updateBookingStatus(booking._id, { status: 'rejected', reason: reason.trim() });
          showNotification('success', `Booking ${booking.bookingReference || ''} rejected.`);
          fetchBookings();
        } catch (err) {
          showNotification('error', err.message || 'Failed to reject booking');
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setStadiumFilter('');
    setSportFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Booking Management</h1>
          <p className="text-sm text-slate-500">
            View, filter, approve, and manage customer stadium bookings ({totalCount} total)
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white"
            />
          </div>

          {/* Booking Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
            >
              <option value="">All Booking Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Payment Pending</option>
              <option value="completed">Payment Completed</option>
              <option value="failed">Payment Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
            />
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <select
              value={stadiumFilter}
              onChange={(e) => {
                setStadiumFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
            >
              <option value="">All Stadiums</option>
              {stadiums.map((std) => (
                <option key={std._id} value={std._id}>
                  {std.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sportFilter}
              onChange={(e) => {
                setSportFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
            >
              <option value="">All Sports</option>
              {sports.map((sp) => (
                <option key={sp._id} value={sp.name}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-royal-blue hover:text-blue-700 px-3 py-2"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Reference / ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Stadium & Sport</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-royal-blue" />
                      <span>Loading bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No bookings found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const customerName = booking.user?.name || booking.bookingPerson?.name || 'Guest';
                  const customerEmail = booking.user?.email || booking.bookingPerson?.email || 'N/A';
                  const stadiumName = booking.stadium?.name || 'Stadium';
                  const sportName = booking.sport || 'Sports';
                  const total = booking.pricing?.totalAmount || booking.totalAmount || booking.amount || 0;

                  return (
                    <tr key={booking._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-navy">
                          {booking.bookingReference || `#${booking._id.slice(-6).toUpperCase()}`}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{customerName}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{customerEmail}</div>
                        {booking.bookingPerson?.mobile && (
                          <div className="text-[11px] text-slate-400">{booking.bookingPerson.mobile}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{stadiumName}</div>
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-royal-blue rounded mt-0.5">
                          {sportName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {booking.startTime} - {booking.endTime} ({booking.duration || 1}h)
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="font-medium text-slate-700">
                            {booking.playerDetails?.playerCount || booking.players || 1}
                          </span>{' '}
                          <span className="text-slate-400">players</span>
                        </div>
                        {booking.audienceDetails?.audienceCount > 0 && (
                          <div className="text-[11px] text-slate-400">
                            {booking.audienceDetails.audienceCount} spectators
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">₹{total.toLocaleString()}</div>
                        {booking.pricing?.gstAmount > 0 && (
                          <div className="text-[10px] text-slate-400">
                            incl. ₹{booking.pricing.gstAmount} GST
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.paymentStatus || 'pending'} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status || 'pending'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/bookings/${booking._id}`}
                            className="p-1.5 text-slate-500 hover:text-royal-blue hover:bg-blue-50 rounded-md transition-colors"
                            title="View Booking Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(booking)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Approve Booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(booking)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Reject Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalCount}
          pageSize={limit}
        />
      </div>

      {/* Confirmation & Reject Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmText={dialogConfig.confirmText}
        showInput={dialogConfig.showInput}
        inputLabel={dialogConfig.inputLabel}
        inputPlaceholder={dialogConfig.inputPlaceholder}
        onConfirm={(val) => {
          dialogConfig.onConfirm(val);
          setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminBookings;
