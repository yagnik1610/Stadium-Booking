import React from 'react';
import { X, Printer, CheckCircle2, Download, Building2, Calendar, Clock, CreditCard, ShieldCheck, User, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';

export default function ReceiptModal({ booking, payment, isOpen, onClose }) {
  if (!isOpen || (!booking && !payment)) return null;

  const stadiumName = booking?.stadium?.name || payment?.booking?.stadium?.name || 'Sports Arena';
  const stadiumCity = booking?.stadium?.city || payment?.booking?.stadium?.city || 'Venue Location';
  const bookingDate = booking?.bookingDate || payment?.booking?.bookingDate || 'N/A';
  const startTime = booking?.startTime || payment?.booking?.startTime || '';
  const endTime = booking?.endTime || payment?.booking?.endTime || '';
  const sport = booking?.sport || 'General Sports';
  const duration = booking?.duration || 1;
  const bookingRef = booking?.bookingReference || 'STB-VERIFIED';

  // Customer Details (Nominee / User)
  const customerName = booking?.bookingPerson?.name || booking?.user?.name || 'Valued Athlete';
  const customerEmail = booking?.bookingPerson?.email || booking?.user?.email || 'N/A';
  const customerMobile = booking?.bookingPerson?.mobile || 'N/A';

  // Financial Breakdown
  const rawTotal = payment?.amount 
    ? (payment.amount / 100) 
    : (booking?.totalPrice || 0);

  const basePrice = booking?.basePrice !== undefined 
    ? booking.basePrice 
    : (booking?.gstRate ? Math.round((rawTotal / (1 + (booking.gstRate / 100))) * 100) / 100 : rawTotal);

  const gstRate = booking?.gstRate !== undefined ? booking.gstRate : 18;
  const gstAmount = booking?.gstAmount !== undefined 
    ? booking.gstAmount 
    : Math.round((rawTotal - basePrice) * 100) / 100;

  const paymentId = payment?.razorpayPaymentId || booking?.paymentId?.razorpayPaymentId || 'RPAY_TXN_VERIFIED';
  const paymentDate = payment?.paidAt 
    ? new Date(payment.paidAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Modal Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#F8FAFC] print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-[#172554]">
              Official GST Tax Invoice & Receipt
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#172554]" id="printableReceipt">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-slate-200">
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-sm mb-2 shadow-xs">
                SB
              </div>
              <h2 className="text-lg font-black text-[#172554] tracking-tight">
                STADIUM BOOKING
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Facility Tax Invoice & Verified Receipt
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Paid & Confirmed
              </span>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Issued: {paymentDate}
              </p>
            </div>
          </div>

          {/* Booking & Transaction References */}
          <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl text-xs border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">BOOKING REFERENCE</span>
              <span className="font-mono font-bold text-[#172554] text-xs">{bookingRef}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">TRANSACTION / PAYMENT ID</span>
              <span className="font-mono font-bold text-slate-700 text-[11px] truncate block">{paymentId}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Customer & Nominee Information
            </h3>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Billed To / Athlete:</span>
                <span className="font-bold text-[#172554]">{customerName}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Contact Mobile:</span>
                <span className="font-semibold text-slate-700">{customerMobile}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-700">{customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Reserved Facility & Session Details */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Reserved Facility Specifications
            </h3>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Venue / Stadium:</span>
                <span className="font-bold text-[#172554]">{stadiumName} ({stadiumCity})</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Sport / Activity:</span>
                <span className="font-bold text-[#2563EB]">{sport}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Booking Date:</span>
                <span className="font-semibold text-slate-700">{bookingDate}</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Session Duration:</span>
                <span className="font-semibold text-slate-700">{duration} {duration === 1 ? 'Hour' : 'Hours'} ({startTime} – {endTime})</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-semibold text-slate-700">Razorpay Verified Secure</span>
              </div>
            </div>
          </div>

          {/* GST Billing Breakdown (PART 43) */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Tax & Charges Breakdown
            </h3>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-[#F8FAFC]">
              <div className="p-3 flex justify-between text-slate-600">
                <span>Facility Base Charges:</span>
                <span className="font-bold text-[#172554]">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>

              {gstRate > 0 && (
                <div className="p-3 flex justify-between text-slate-600">
                  <span>Applicable Goods & Services Tax (GST {gstRate}%):</span>
                  <span className="font-bold text-[#172554]">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="p-3 flex justify-between items-center bg-[#EFF6FF] text-[#172554]">
                <div>
                  <span className="font-black text-xs block">Grand Total Paid:</span>
                  <span className="text-[10px] text-blue-600">All applicable venue fees included</span>
                </div>
                <div className="text-lg font-black text-[#2563EB]">
                  ₹{rawTotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            This is an electronically generated GST tax invoice. Please present this receipt or your booking reference STB upon arrival at reception.
          </p>

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={Download}
            >
              Download PDF
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
