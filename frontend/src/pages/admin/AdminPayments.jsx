import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Receipt,
  Printer,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Aggregate stats from current response or calculated
  const [stats, setStats] = useState({
    grossRevenue: 0,
    gstCollected: 0,
    completedCount: 0,
    pendingCount: 0
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined
      };

      const res = await adminAPI.getPayments(params);
      if (res && res.success) {
        const list = res.payments || (Array.isArray(res.data) ? res.data : res.data?.payments) || [];
        setPayments(list);
        setTotalPages(res.pagination?.totalPages || res.totalPages || 1);
        setTotalCount(res.total !== undefined ? res.total : (res.pagination?.total || list.length));

        // Compute summary metrics if provided or from list
        if (res.summary || res.data?.summary) {
          setStats(res.summary || res.data?.summary);
        } else {
          const gross = list.reduce(
            (acc, p) => acc + (p.totalAmount || p.amount || 0),
            0
          );
          const gst = list.reduce(
            (acc, p) => acc + (p.gstAmount || Math.round((p.amount || 0) * 0.18)),
            0
          );
          const completed = list.filter((p) => p.status === 'completed' || p.status === 'paid' || p.status === 'captured').length;
          const pending = list.filter((p) => p.status === 'pending').length;
          setStats({
            grossRevenue: gross,
            gstCollected: gst,
            completedCount: completed,
            pendingCount: pending
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payment & GST Management</h1>
          <p className="text-sm text-slate-500">
            Real-time server-verified transactions, order IDs, and GST collection logs ({totalCount} total)
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          Refresh Transactions
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Transaction Volume</span>
          <div className="text-2xl font-bold text-navy mt-1">₹{stats.grossRevenue?.toLocaleString() || 0}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Total recorded billing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GST Collected</span>
          <div className="text-2xl font-bold text-royal-blue mt-1">₹{stats.gstCollected?.toLocaleString() || 0}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Standard statutory tax</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Completed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedCount}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Server verified payments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending / Processing</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">{stats.pendingCount}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Awaiting gateway webhook</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payment ID, order ID, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
          >
            <option value="">All Payment Statuses</option>
            <option value="completed">Completed / Captured</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Transaction / Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Booking Ref</th>
                <th className="px-4 py-3">Base Amount</th>
                <th className="px-4 py-3">GST (18%)</th>
                <th className="px-4 py-3">Total Billed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-royal-blue mx-auto mb-2" />
                    <span>Loading payment transactions...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No payment records found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search criteria or filter.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const paymentId = p.paymentId || p.razorpayPaymentId || p._id;
                  const orderId = p.orderId || p.razorpayOrderId || 'N/A';
                  const bookingRef = p.booking?.bookingReference || p.bookingReference || (p.booking ? `#${p.booking._id?.slice(-6)}` : 'N/A');
                  const customer = p.user?.name || p.customerName || 'Customer';
                  const customerEmail = p.user?.email || p.customerEmail || '';
                  const baseAmount = p.baseAmount || Math.round((p.totalAmount || p.amount || 0) / 1.18);
                  const gst = p.gstAmount || (p.totalAmount || p.amount || 0) - baseAmount;
                  const total = p.totalAmount || p.amount || 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {p.paymentId || p.razorpayPaymentId || 'PENDING'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {orderId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{customer}</div>
                        {customerEmail && (
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">{customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-royal-blue">
                          {bookingRef}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        ₹{baseAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        ₹{gst.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-navy">
                        ₹{total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status || 'pending'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(p.createdAt || p.paidAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 text-slate-500 hover:text-royal-blue hover:bg-blue-50 rounded-md transition-colors"
                          title="View Payment Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
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

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy">OFFICIAL PAYMENT RECEIPT</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedReceipt.paymentId || selectedReceipt._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Payer:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedReceipt.user?.name || selectedReceipt.customerName || 'Customer'}
                  </div>
                  <div className="text-slate-500">{selectedReceipt.user?.email || selectedReceipt.customerEmail}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Status:</span>
                  <StatusBadge status={selectedReceipt.status} />
                  <div className="text-[11px] text-slate-400 mt-1">
                    {new Date(selectedReceipt.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Order ID:</span>
                  <span className="font-mono text-slate-700">{selectedReceipt.orderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono text-royal-blue font-bold">
                    {selectedReceipt.booking?.bookingReference || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Base Net Amount:</span>
                  <span className="font-medium text-slate-800">
                    ₹{(selectedReceipt.baseAmount || Math.round((selectedReceipt.totalAmount || selectedReceipt.amount || 0) / 1.18)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST (18% Statutory):</span>
                  <span className="font-medium text-slate-800">
                    ₹{(selectedReceipt.gstAmount || Math.round((selectedReceipt.totalAmount || selectedReceipt.amount || 0) * 0.18)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-slate-100">
                  <span>Grand Total Paid:</span>
                  <span>₹{(selectedReceipt.totalAmount || selectedReceipt.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-royal-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
