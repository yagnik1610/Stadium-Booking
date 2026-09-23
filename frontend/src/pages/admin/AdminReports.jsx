import React, { useState, useEffect } from 'react';
import { adminAPI, stadiumAPI, sportAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  Building2,
  DollarSign,
  Users,
  Star
} from 'lucide-react';

const AdminReports = () => {
  const [reportType, setReportType] = useState('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stadiumId, setStadiumId] = useState('');
  const [sport, setSport] = useState('');
  const [status, setStatus] = useState('');

  const [stadiums, setStadiums] = useState([]);
  const [sports, setSports] = useState([]);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [stdRes, sptRes] = await Promise.all([
          stadiumAPI.getAll({ limit: 100 }),
          sportAPI.getAll({ limit: 100 })
        ]);
        if (stdRes && (stdRes.stadiums || stdRes.data?.stadiums)) {
          setStadiums(stdRes.stadiums || stdRes.data?.stadiums || []);
        }
        if (sptRes && (sptRes.sports || sptRes.data?.sports)) {
          setSports(sptRes.sports || sptRes.data?.sports || []);
        }
      } catch (err) {
        console.error('Failed to load report filter metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        type: reportType,
        category: reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stadiumId: stadiumId || undefined,
        stadium: stadiumId || undefined,
        sport: sport || undefined,
        status: status || undefined
      };

      const res = await adminAPI.getReports(params);
      if (res && res.success) {
        const recordsList = Array.isArray(res.data) ? res.data : (res.records || []);
        setReportData({
          records: recordsList,
          summary: res.summary || { totalRecords: recordsList.length }
        });
      } else {
        setError('Unable to compile report from MongoDB.');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.message || 'Failed to generate report from backend');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      alert('No database records available to export.');
      return;
    }

    const records = reportData.records;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'bookings') {
      csvContent += 'Booking Reference,Customer,Email,Stadium,Sport,Date,Time,Duration,Total Amount,GST,Payment Status,Booking Status\n';
      records.forEach((r) => {
        csvContent += `"${r.bookingReference || r._id}","${r.user?.name || r.bookingPerson?.name || ''}","${r.user?.email || ''}","${r.stadium?.name || ''}","${r.sport || ''}","${new Date(r.date).toLocaleDateString()}","${r.startTime}-${r.endTime}",${r.duration || 1},${r.pricing?.totalAmount || r.totalAmount || r.amount || 0},${r.pricing?.gstAmount || 0},"${r.paymentStatus}","${r.status}"\n`;
      });
    } else if (reportType === 'revenue' || reportType === 'payments') {
      csvContent += 'Payment ID,Order ID,Customer,Booking Ref,Base Amount,GST,Total Amount,Status,Date\n';
      records.forEach((p) => {
        csvContent += `"${p.paymentId || p.razorpayPaymentId || p._id}","${p.orderId || ''}","${p.user?.name || ''}","${p.booking?.bookingReference || ''}",${p.baseAmount || 0},${p.gstAmount || 0},${p.totalAmount || p.amount || 0},"${p.status}","${new Date(p.createdAt || p.paidAt).toLocaleDateString()}"\n`;
      });
    } else if (reportType === 'users') {
      csvContent += 'Name,Email,Mobile,Role,Status,Registered Date\n';
      records.forEach((u) => {
        csvContent += `"${u.name}","${u.email}","${u.mobile || ''}","${u.role}","${u.isActive ? 'Active' : 'Inactive'}","${new Date(u.createdAt).toLocaleDateString()}"\n`;
      });
    } else {
      csvContent += 'Rating,Stadium,Customer,Comment,Date\n';
      records.forEach((rv) => {
        csvContent += `${rv.rating},"${rv.stadium?.name || ''}","${rv.user?.name || ''}","${(rv.comment || '').replace(/"/g, '""')}","${new Date(rv.createdAt).toLocaleDateString()}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Operational Reports Engine</h1>
          <p className="text-sm text-slate-500">
            Generate audit-ready tabular reports and export CSV summaries directly from verified MongoDB records.
          </p>
        </div>

        {reportData && reportData.records?.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Domain</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800 font-medium"
            >
              <option value="bookings">Booking Activity Report</option>
              <option value="revenue">Revenue & GST Report</option>
              <option value="payments">Payment Transaction Report</option>
              <option value="users">User Accounts Directory Report</option>
              <option value="reviews">Customer Reviews & Ratings Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Stadium Scope</label>
            <select
              value={stadiumId}
              onChange={(e) => setStadiumId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            >
              <option value="">All Stadiums</option>
              {stadiums.map((std) => (
                <option key={std._id} value={std._id}>
                  {std.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Reports query active MongoDB collections directly with date-range index support.
          </span>
          <button
            onClick={generateReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-royal-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Compile Report
          </button>
        </div>
      </div>

      {/* Report Summary Cards if available */}
      {reportData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Compiled Records</span>
            <div className="text-2xl font-bold text-navy mt-1">
              {reportData.summary.totalRecords || reportData.records?.length || 0}
            </div>
          </div>

          {reportData.summary.totalAmount !== undefined && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Billed Volume</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{reportData.summary.totalAmount?.toLocaleString()}
              </div>
            </div>
          )}

          {reportData.summary.totalGst !== undefined && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total GST Collected</span>
              <div className="text-2xl font-bold text-royal-blue mt-1">
                ₹{reportData.summary.totalGst?.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-royal-blue mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Extracting database records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : !reportData || !reportData.records || reportData.records.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No records found for current criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try widening your date range or adjusting facility filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  {reportType === 'bookings' && (
                    <>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Facility</th>
                      <th className="px-4 py-3">Sport</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </>
                  )}
                  {(reportType === 'revenue' || reportType === 'payments') && (
                    <>
                      <th className="px-4 py-3">Payment ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Booking Ref</th>
                      <th className="px-4 py-3">Base</th>
                      <th className="px-4 py-3">GST</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </>
                  )}
                  {reportType === 'users' && (
                    <>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined Date</th>
                    </>
                  )}
                  {reportType === 'reviews' && (
                    <>
                      <th className="px-4 py-3">Facility</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Feedback</th>
                      <th className="px-4 py-3">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportData.records.slice(0, 100).map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-50/70">
                    {reportType === 'bookings' && (
                      <>
                        <td className="px-4 py-3 font-mono font-bold text-navy">
                          {r.bookingReference || `#${r._id.slice(-6)}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {r.user?.name || r.bookingPerson?.name || 'Customer'}
                        </td>
                        <td className="px-4 py-3">{r.stadium?.name || 'Facility'}</td>
                        <td className="px-4 py-3 text-royal-blue font-semibold">{r.sport}</td>
                        <td className="px-4 py-3">
                          {new Date(r.date).toLocaleDateString()} {r.startTime}-{r.endTime}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          ₹{(r.pricing?.totalAmount || r.totalAmount || r.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                      </>
                    )}
                    {(reportType === 'revenue' || reportType === 'payments') && (
                      <>
                        <td className="px-4 py-3 font-mono font-bold text-navy">
                          {r.paymentId || r.razorpayPaymentId || r._id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.user?.name || 'Customer'}</td>
                        <td className="px-4 py-3 font-mono text-royal-blue">
                          {r.booking?.bookingReference || 'N/A'}
                        </td>
                        <td className="px-4 py-3">₹{(r.baseAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">₹{(r.gstAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-navy">
                          ₹{(r.totalAmount || r.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                      </>
                    )}
                    {reportType === 'users' && (
                      <>
                        <td className="px-4 py-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="px-4 py-3 text-slate-500">{r.email}</td>
                        <td className="px-4 py-3 text-slate-500">{r.mobile || 'N/A'}</td>
                        <td className="px-4 py-3 capitalize font-medium">{r.role}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </>
                    )}
                    {reportType === 'reviews' && (
                      <>
                        <td className="px-4 py-3 font-semibold text-slate-800">{r.stadium?.name || 'Facility'}</td>
                        <td className="px-4 py-3 text-slate-600">{r.user?.name || 'Customer'}</td>
                        <td className="px-4 py-3 font-bold text-amber-500">★ {r.rating}.0</td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{r.comment || 'No text'}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
