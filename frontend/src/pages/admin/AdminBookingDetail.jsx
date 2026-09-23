import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Printer,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  Receipt
} from 'lucide-react';

const AdminBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [notification, setNotification] = useState(null);

  // Dialog state
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

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBookingById(id);
      if (res && res.success) {
        setBooking(res.booking || res.data?.booking || res.data);
      }
    } catch (err) {
      console.error('Failed to load booking details:', err);
      showNotification('error', err.message || 'Error loading booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleApprove = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Approve Booking',
      message: `Approve booking ${booking.bookingReference || booking._id}? This will confirm the booking in MongoDB and notify the customer.`,
      type: 'success',
      confirmText: 'Approve Now',
      showInput: false,
      onConfirm: async () => {
        try {
          await adminAPI.updateBookingStatus(booking._id, { status: 'confirmed' });
          showNotification('success', 'Booking approved successfully');
          fetchBooking();
        } catch (err) {
          showNotification('error', err.message || 'Failed to approve');
        }
      }
    });
  };

  const handleReject = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Reject Booking',
      message: 'Enter reason for rejecting this booking. This will be recorded and shared with the user.',
      type: 'danger',
      confirmText: 'Reject Booking',
      showInput: true,
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Reason for rejection...',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) {
          showNotification('error', 'Rejection reason is required');
          return;
        }
        try {
          await adminAPI.updateBookingStatus(booking._id, { status: 'rejected', reason: reason.trim() });
          showNotification('success', 'Booking rejected');
          fetchBooking();
        } catch (err) {
          showNotification('error', err.message || 'Failed to reject');
        }
      }
    });
  };

  const handleCancel = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Cancel Booking',
      message: 'Provide cancellation reason to cancel this confirmed booking.',
      type: 'danger',
      confirmText: 'Cancel Booking',
      showInput: true,
      inputLabel: 'Cancellation Reason',
      inputPlaceholder: 'Reason for administrative cancellation...',
      onConfirm: async (reason) => {
        try {
          await adminAPI.cancelBooking(booking._id, reason || 'Cancelled by Admin');
          showNotification('success', 'Booking cancelled');
          fetchBooking();
        } catch (err) {
          showNotification('error', err.message || 'Failed to cancel');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Booking Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested booking could not be retrieved from MongoDB.</p>
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-royal-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
      </div>
    );
  }

  const user = booking.user || {};
  const nominee = booking.bookingPerson || {};
  const stadium = booking.stadium || {};
  const pricing = booking.pricing || {
    baseAmount: booking.amount || 0,
    gstRate: 18,
    gstAmount: Math.round((booking.amount || 0) * 0.18),
    totalAmount: booking.totalAmount || booking.amount || 0
  };

  return (
    <div className="space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/bookings')}
            className="p-2 text-slate-500 hover:text-royal-blue hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-navy">
                Booking {booking.bookingReference || `#${booking._id.slice(-6).toUpperCase()}`}
              </h1>
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.paymentStatus} />
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowInvoice(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Receipt className="w-4 h-4 text-royal-blue" />
            View Invoice
          </button>

          {booking.status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {booking.status === 'approved' && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
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

      {/* Rejection / Cancellation alerts */}
      {booking.rejectionReason && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-sm text-rose-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Rejection Reason</div>
            <div className="mt-0.5">{booking.rejectionReason}</div>
          </div>
        </div>
      )}

      {booking.cancellationReason && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Cancellation Reason</div>
            <div className="mt-0.5">{booking.cancellationReason}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stadium & Session Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-royal-blue" />
              Facility & Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Stadium</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{stadium.name || 'Stadium'}</p>
                <p className="text-xs text-slate-500">
                  {[stadium.address, stadium.city, stadium.state].filter(Boolean).join(', ') || 'Address on file'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Sport Discipline</span>
                <p className="text-sm font-semibold text-royal-blue mt-0.5">{booking.sport}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Booking Date</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(booking.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Time Slot & Duration</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {booking.startTime} - {booking.endTime} ({booking.duration || 1} hr{booking.duration > 1 ? 's' : ''})
                </p>
              </div>
            </div>
          </div>

          {/* Participant & Audience Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-royal-blue" />
              Players & Audience Setup
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Player Specifications
                </span>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Player Count:</span>
                    <span className="font-semibold text-slate-800">
                      {booking.playerDetails?.playerCount || booking.players || 1}
                    </span>
                  </div>
                  {booking.playerDetails?.teamName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Team Name:</span>
                      <span className="font-medium text-slate-800">{booking.playerDetails.teamName}</span>
                    </div>
                  )}
                  {booking.playerDetails?.captainName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Captain:</span>
                      <span className="font-medium text-slate-800">{booking.playerDetails.captainName}</span>
                    </div>
                  )}
                  {booking.playerDetails?.coachName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coach:</span>
                      <span className="font-medium text-slate-800">{booking.playerDetails.coachName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Audience Specifications
                </span>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Audience Allowed:</span>
                    <span
                      className={`font-semibold ${
                        booking.audienceDetails?.audienceAllowed ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {booking.audienceDetails?.audienceAllowed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {booking.audienceDetails?.audienceAllowed && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Spectator Count:</span>
                        <span className="font-semibold text-slate-800">
                          {booking.audienceDetails?.audienceCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pass Required:</span>
                        <span className="font-medium text-slate-800">
                          {booking.audienceDetails?.audiencePassRequired ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {booking.audienceDetails?.passType && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pass Type:</span>
                          <span className="font-medium text-slate-800">{booking.audienceDetails.passType}</span>
                        </div>
                      )}
                      {booking.audienceDetails?.entryGate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Entry Gate:</span>
                          <span className="font-medium text-slate-800">{booking.audienceDetails.entryGate}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Safety Verification */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${booking.safetyAccepted ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Safety Requirements: {booking.safetyAccepted ? 'Acknowledged' : 'Not recorded'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${booking.termsAccepted ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>
                  Terms Accepted: {booking.termsAccepted ? `Yes (v${booking.termsVersion || '1.0'})` : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Customer Info & Financials */}
        <div className="space-y-6">
          {/* Customer / Nominee */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-royal-blue" />
              Customer Information
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400">Account Holder</span>
                <p className="font-semibold text-slate-800">{user.name || 'Account User'}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email || 'N/A'}
                </p>
                {user.mobile && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {user.mobile}
                  </p>
                )}
              </div>

              {nominee.name && nominee.name !== user.name && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Designated Contact / Nominee</span>
                  <p className="font-semibold text-slate-800">{nominee.name}</p>
                  {nominee.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {nominee.email}
                    </p>
                  )}
                  {nominee.mobile && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {nominee.mobile}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Billing & Payment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-royal-blue" />
              Billing & Transaction
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base Amount</span>
                <span className="font-medium text-slate-900">₹{pricing.baseAmount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({pricing.gstRate || 18}%)</span>
                <span className="font-medium text-slate-900">₹{pricing.gstAmount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-navy pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span>₹{pricing.totalAmount?.toLocaleString() || '0'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <StatusBadge status={booking.paymentStatus} />
              </div>
              {booking.paymentDetails?.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-mono text-slate-700">{booking.paymentDetails.paymentId}</span>
                </div>
              )}
              {booking.paymentDetails?.orderId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-slate-700">{booking.paymentDetails.orderId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative border border-slate-200 print:m-0 print:p-0 print:border-none">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-royal-blue text-white font-bold flex items-center justify-center">
                    SB
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-navy">STADIUM BOOKING INVOICE</h2>
                    <p className="text-xs text-slate-400">Official Payment & Booking Receipt</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInvoice(false)}
                className="text-slate-400 hover:text-slate-600 print:hidden"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Billed To:</span>
                  <div className="font-bold text-slate-800 mt-0.5">{nominee.name || user.name}</div>
                  <div className="text-slate-500">{nominee.email || user.email}</div>
                  <div className="text-slate-500">{nominee.mobile || user.mobile}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Reference Details:</span>
                  <div className="font-mono font-bold text-royal-blue mt-0.5">
                    {booking.bookingReference || booking._id}
                  </div>
                  <div className="text-slate-500">Date: {new Date(booking.createdAt).toLocaleDateString()}</div>
                  <div className="text-slate-500">Status: {booking.status?.toUpperCase()}</div>
                </div>
              </div>

              {/* Service Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Schedule</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{stadium.name}</div>
                        <div className="text-slate-400 text-[11px]">{booking.sport} session</div>
                      </td>
                      <td className="p-2.5">
                        <div>{new Date(booking.date).toLocaleDateString()}</div>
                        <div className="text-slate-400 text-[11px]">
                          {booking.startTime} - {booking.endTime} ({booking.duration} hr)
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">
                        ₹{pricing.baseAmount?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="space-y-1.5 text-right pt-2">
                <div className="text-slate-500">
                  Base Amount: <span className="font-medium text-slate-800">₹{pricing.baseAmount?.toLocaleString()}</span>
                </div>
                <div className="text-slate-500">
                  GST ({pricing.gstRate || 18}%):{' '}
                  <span className="font-medium text-slate-800">₹{pricing.gstAmount?.toLocaleString()}</span>
                </div>
                <div className="text-sm font-bold text-navy pt-1 border-t border-slate-200">
                  Grand Total: ₹{pricing.totalAmount?.toLocaleString()}
                </div>
              </div>

              {/* Payment details */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 space-y-0.5">
                <div>
                  <span className="font-medium text-slate-700">Payment Status:</span> {booking.paymentStatus}
                </div>
                {booking.paymentDetails?.paymentId && (
                  <div>
                    <span className="font-medium text-slate-700">Payment ID:</span>{' '}
                    {booking.paymentDetails.paymentId}
                  </div>
                )}
                {booking.paymentDetails?.orderId && (
                  <div>
                    <span className="font-medium text-slate-700">Order ID:</span> {booking.paymentDetails.orderId}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-royal-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmVariant={dialogConfig.type === 'danger' ? 'danger' : 'primary'}
        confirmLabel={dialogConfig.confirmText || 'Confirm'}
        requiresReason={dialogConfig.showInput}
        reasonPlaceholder={dialogConfig.inputPlaceholder}
        onConfirm={(val) => {
          dialogConfig.onConfirm(val);
          setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminBookingDetail;
