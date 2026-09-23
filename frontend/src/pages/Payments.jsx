import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, Clock, CheckCircle2, AlertCircle, FileText, ArrowLeft, RefreshCw, Building2 } from 'lucide-react';
import { paymentAPI } from '../services/api';
import Button from '../components/ui/Button';
import ReceiptModal from '../components/payment/ReceiptModal';

export default function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentAPI.getMyPayments();
      if (res.success && Array.isArray(res.payments)) {
        setPayments(res.payments);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to retrieve payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Verified Paid</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">Failed</span>;
      case 'refunded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Refunded</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-blue-200/50">
            Billing & Invoices
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
            Payment History & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Official Razorpay transaction history, verified receipts, and invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPayments}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800">Unable to load payment history</h3>
          <p className="text-xs text-red-600">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchPayments} className="mt-2">
            Try Again
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No payment transactions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you reserve an arena and complete online checkout, your digital invoices and receipts will appear here.
          </p>
          <Button size="sm" variant="primary" onClick={() => navigate('/stadiums')} className="mt-2">
            Explore Venues
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Transaction Date</th>
                  <th className="px-6 py-3.5">Booking / Arena</th>
                  <th className="px-6 py-3.5">Payment ID</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {payments.map((p) => {
                  const displayDate = p.paidAt 
                    ? new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const amount = (p.amount / 100).toLocaleString('en-IN');

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {displayDate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#172554]">
                          {p.booking?.stadium?.name || 'Arena Booking'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Slot: {p.booking?.bookingDate} ({p.booking?.startTime} - {p.booking?.endTime})
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600 truncate max-w-[160px]">
                        {p.razorpayPaymentId || p.razorpayOrderId}
                      </td>
                      <td className="px-6 py-4 font-black text-[#2563EB] text-sm">
                        ₹{amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedPaymentForReceipt(p)}
                          icon={FileText}
                        >
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {payments.map((p) => {
              const amount = (p.amount / 100).toLocaleString('en-IN');
              return (
                <div key={p._id} className="p-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#172554]">
                        {p.booking?.stadium?.name || 'Arena Booking'}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.razorpayPaymentId || p.razorpayOrderId}
                      </p>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">AMOUNT</span>
                      <span className="font-black text-[#2563EB] text-sm">₹{amount}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedPaymentForReceipt(p)}
                      icon={FileText}
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal
        payment={selectedPaymentForReceipt}
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
      />

    </div>
  );
}
