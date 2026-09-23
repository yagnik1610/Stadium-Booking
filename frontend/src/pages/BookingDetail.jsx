import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, CreditCard, ShieldCheck, AlertCircle, 
  ArrowLeft, FileText, Star, XCircle, CheckCircle2, Building2,
  Users, AlertTriangle, Printer, Info
} from 'lucide-react';
import { bookingAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ReceiptModal from '../components/payment/ReceiptModal';
import ReviewModal from '../components/review/ReviewModal';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingAPI.getById(id);
      if (res.success && res.booking) {
        setBooking(res.booking);

        // If paid, also attempt to load payment record
        if (res.booking.paymentStatus === 'paid') {
          try {
            const payRes = await paymentAPI.getByBookingId(id);
            if (payRes.success && payRes.payment) {
              setPayment(payRes.payment);
            }
          } catch (pErr) {
            // Non-critical if payment lookup fails
          }
        }
      } else {
        setError('Booking record not found.');
      }
    } catch (err) {
      console.error('Error loading booking:', err);
      setError(err.message || 'Failed to retrieve booking information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  // Handle Cancellation
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      const res = await bookingAPI.cancel(id);
      if (res.success) {
        await fetchBooking();
      }
    } catch (err) {
      alert(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Razorpay Payment Flow
  const handlePayNow = async () => {
    if (!booking) return;
    setPaying(true);

    try {
      // 1. Request Razorpay Order from backend
      const orderRes = await paymentAPI.createOrder({ bookingId: booking._id });

      if (!orderRes.success || !orderRes.payment) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway.');
      }

      const { razorpayOrderId, amount, currency, razorpayKeyId } = orderRes.payment;

      // 2. Load Razorpay SDK script dynamically if not on window
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay SDK. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Stadium Booking Platform',
        description: `Booking ${booking.bookingReference} for ${booking.stadium?.name}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile || ''
        },
        theme: {
          color: '#2563EB'
        },
        handler: async function (response) {
          try {
            // 4. Send verification data to backend
            const verifyRes = await paymentAPI.verify({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              alert('Payment verified and confirmed successfully!');
              await fetchBooking();
              setIsReceiptOpen(true);
            } else {
              alert('Payment verification failed on server.');
            }
          } catch (vErr) {
            alert('Payment verification error: ' + (vErr.message || 'Unknown error'));
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Payment flow error:', err);
      alert(err.message || 'Unable to start payment. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-[#172554]">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 bg-red-50 rounded-2xl border border-red-200 text-center max-w-lg mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-800">Booking Not Available</h3>
        <p className="text-xs text-red-600">{error || 'Booking could not be loaded.'}</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/bookings')}>
          Back to My Bookings
        </Button>
      </div>
    );
  }

  const isToday = booking.bookingDate === new Date().toISOString().split('T')[0];
  const isPast = booking.bookingDate < new Date().toISOString().split('T')[0];
  const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed';
  const canPay = (booking.status === 'confirmed' || booking.status === 'pending') && booking.paymentStatus !== 'paid';
  const isCompleted = booking.status === 'completed' || (isPast && booking.status === 'confirmed');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/bookings')}
          icon={ArrowLeft}
        >
          Back to Bookings
        </Button>

        <div className="flex items-center gap-2">
          {booking.status === 'confirmed' && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Confirmed Reservation
            </span>
          )}
          {booking.status === 'pending' && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
              Pending Admin Review
            </span>
          )}
          {booking.status === 'cancelled' && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
              Cancelled
            </span>
          )}
          {booking.status === 'completed' && (
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
              Completed
            </span>
          )}

          {booking.paymentStatus === 'paid' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Paid
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Payment Pending
            </span>
          )}
        </div>
      </div>

      {/* Main Booking Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded">
                {booking.sport || 'Sports Match'}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">
                {booking.bookingReference || (booking._id ? `BK-${booking._id.slice(-8).toUpperCase()}` : '')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">
              {booking.stadium?.name || 'Stadium Venue'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{booking.stadium?.address || booking.stadium?.city || 'Venue location'}</span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Price</span>
            <div className="text-2xl font-black text-[#2563EB]">
              ₹{booking.totalPrice?.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">
              (₹{booking.pricePerHour} / hour × {booking.duration} hr)
            </span>
          </div>
        </div>

        {/* Visual Lifecycle Timeline */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">
            Reservation Lifecycle Timeline
          </span>

          <div className="flex items-center justify-between relative">
            <div className="w-full absolute top-1/2 left-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ✓
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Submitted</span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                booking.status === 'confirmed' || booking.status === 'completed'
                  ? 'bg-[#2563EB] text-white'
                  : booking.status === 'cancelled'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-white animate-pulse'
              }`}>
                {booking.status === 'cancelled' ? '✕' : '✓'}
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">
                {booking.status === 'cancelled' ? 'Rejected/Cancelled' : 'Admin Approved'}
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                booking.paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {booking.paymentStatus === 'paid' ? '✓' : '3'}
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Payment Verified</span>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? '✓' : '4'}
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Completed</span>
            </div>
          </div>
        </div>

        {/* Detailed Spec Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">MATCH DATE</span>
            <span className="font-bold text-[#172554] text-sm mt-0.5 block">{booking.bookingDate}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">SESSION TIME</span>
            <span className="font-bold text-[#172554] text-sm mt-0.5 block">
              {booking.startTime} - {booking.endTime}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">DURATION</span>
            <span className="font-bold text-[#172554] text-sm mt-0.5 block">
              {booking.duration} Hour{booking.duration > 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">TERMS ACCEPTANCE</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> v{booking.termsVersion || '1.0'}
            </span>
          </div>
        </div>

        {/* Dynamic Sport Requirements Strip */}
        {booking.customFields && Object.keys(booking.customFields).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Custom Match & Sport Parameters
            </h3>
            <div className="bg-[#F0F7FF] rounded-xl p-4 border border-blue-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {Object.entries(booking.customFields).map(([key, val]) => (
                <div key={key}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="font-bold text-[#172554]">
                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection / Cancellation Notes if applicable */}
        {booking.rejectionReason && (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Administrative Cancellation Reason:</span>
            </div>
            <p className="pl-5 text-rose-700 italic">"{booking.rejectionReason}"</p>
          </div>
        )}

        {/* Actions Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canPay && (
              <Button
                variant="primary"
                size="md"
                loading={paying}
                onClick={handlePayNow}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                icon={CreditCard}
              >
                Pay Now (₹{booking.totalPrice?.toLocaleString('en-IN')})
              </Button>
            )}

            {booking.paymentStatus === 'paid' && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsReceiptOpen(true)}
                icon={FileText}
              >
                View / Print Official Receipt
              </Button>
            )}

            {isCompleted && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsReviewOpen(true)}
                icon={Star}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Review Venue
              </Button>
            )}
          </div>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              loading={cancelling}
              onClick={handleCancel}
              className="text-rose-600 hover:bg-rose-50 border-slate-200"
            >
              Cancel Reservation
            </Button>
          )}
        </div>

      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal
        booking={booking}
        payment={payment}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Review Modal */}
      <ReviewModal
        booking={booking}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onReviewSuccess={() => {
          alert('Thank you! Your verified review has been submitted.');
          fetchBooking();
        }}
      />

    </div>
  );
}
