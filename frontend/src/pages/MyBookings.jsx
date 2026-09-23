import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, AlertCircle, ArrowLeft, CheckCircle, 
  XCircle, Building2, CreditCard, Star, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { bookingAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ReceiptModal from '../components/payment/ReceiptModal';
import ReviewModal from '../components/review/ReviewModal';

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  // Modals state
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingAPI.getMyBookings();
      if (res.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching my bookings:', err);
      setError(err.message || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your reserved playing slot.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await bookingAPI.cancel(bookingId);
      if (res.success) {
        await fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Could not cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter Bookings by Tab
  const filteredBookings = bookings.filter((b) => {
    const status = b.status?.toLowerCase();
    const isToday = b.bookingDate === todayStr;
    const isFuture = b.bookingDate >= todayStr;

    if (activeTab === 'today') return isToday && status !== 'cancelled';
    if (activeTab === 'upcoming') return isFuture && (status === 'confirmed' || status === 'pending');
    if (activeTab === 'pending') return status === 'pending';
    if (activeTab === 'approved') return status === 'confirmed';
    if (activeTab === 'cancelled') return status === 'cancelled';
    if (activeTab === 'completed') return status === 'completed' || (!isFuture && status === 'confirmed');
    return true; // 'all'
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending Approval</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    if (paymentStatus === 'paid') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Paid</span>;
    }
    if (paymentStatus === 'failed') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Payment Failed</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Payment Required</span>;
  };

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'today', label: 'Today', count: bookings.filter(b => b.bookingDate === todayStr && b.status !== 'cancelled').length },
    { id: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.bookingDate >= todayStr && (b.status === 'confirmed' || b.status === 'pending')).length },
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'approved', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-blue-200/50">
            Booking Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
            My Stadium Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            View all confirmed, pending, and past venue reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
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
            Find Stadium
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800">Unable to load bookings</h3>
          <p className="text-xs text-red-600">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchBookings} className="mt-2">
            Try Again
          </Button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No bookings in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'today' ? "You don't have any sessions scheduled for today." :
             activeTab === 'upcoming' ? "No upcoming matches found in your schedule." :
             activeTab === 'pending' ? "No reservations awaiting administrative review." :
             "You don't have any bookings matching this filter yet."}
          </p>
          <Button size="sm" variant="primary" onClick={() => navigate('/stadiums')} className="mt-2">
            Explore Venues
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isCompleted = b.status === 'completed' || (b.bookingDate < todayStr && b.status === 'confirmed');
            const canCancel = b.status !== 'cancelled' && b.status !== 'completed';
            const canPay = (b.status === 'confirmed' || b.status === 'pending') && b.paymentStatus !== 'paid';

            return (
              <div 
                key={b._id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        {b.sport || b.stadium?.sports?.[0] || 'Sport Session'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {b.bookingReference || 'STB-REF'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#172554]">
                      {b.stadium?.name || 'Stadium Booking'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.stadium?.address || b.stadium?.city || 'Venue location'}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                    {getStatusBadge(b.status)}
                    {getPaymentBadge(b.paymentStatus)}
                  </div>
                </div>

                {/* Details Strip */}
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">DATE</span>
                    <span className="font-bold text-[#172554]">{b.bookingDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TIME</span>
                    <span className="font-bold text-[#172554]">{b.startTime} - {b.endTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">DURATION</span>
                    <span className="font-bold text-slate-700">{b.duration} Hour{b.duration > 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL AMOUNT</span>
                    <span className="font-black text-[#2563EB]">₹{b.totalPrice ? b.totalPrice.toLocaleString('en-IN') : '0'}</span>
                  </div>
                </div>

                {/* Actions Bottom Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/bookings/${b._id}`)}
                  >
                    View Details
                  </Button>

                  <div className="flex items-center gap-2">
                    {canPay && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard/bookings/${b._id}?pay=true`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        icon={CreditCard}
                      >
                        Pay Now
                      </Button>
                    )}

                    {b.paymentStatus === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBookingForReceipt(b)}
                        icon={FileText}
                      >
                        Receipt
                      </Button>
                    )}

                    {isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBookingForReview(b)}
                        icon={Star}
                        className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Leave Review
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingId === b._id}
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-rose-600 hover:bg-rose-50 hover:border-rose-300 border-slate-200"
                      >
                        {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal
        booking={selectedBookingForReceipt}
        isOpen={!!selectedBookingForReceipt}
        onClose={() => setSelectedBookingForReceipt(null)}
      />

      {/* Review Modal */}
      <ReviewModal
        booking={selectedBookingForReview}
        isOpen={!!selectedBookingForReview}
        onClose={() => setSelectedBookingForReview(null)}
        onReviewSuccess={() => {
          alert('Thank you! Your verified review has been submitted.');
          fetchBookings();
        }}
      />

    </div>
  );
}
