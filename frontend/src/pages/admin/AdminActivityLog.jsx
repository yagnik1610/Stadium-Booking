import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminPagination from '../../components/admin/AdminPagination';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react';

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        action: actionFilter || undefined,
        search: search.trim() || undefined
      };
      const res = await adminAPI.getActivityLogs(params);
      if (res && res.success) {
        const list = res.logs || (Array.isArray(res.data) ? res.data : res.data?.logs) || [];
        setLogs(list);
        setTotalPages(res.pagination?.totalPages || res.totalPages || 1);
        setTotalCount(res.total !== undefined ? res.total : (res.pagination?.total || list.length));
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Administrative Audit Trails</h1>
          <p className="text-sm text-slate-500">
            Immutable log of system modifications, entity lifecycle changes, and security operations ({totalCount} recorded events).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          Refresh Trails
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, details, admin..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
          >
            <option value="">All Action Types</option>
            <option value="USER_ACTIVATED">User Activated</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="BOOKING_APPROVED">Booking Approved</option>
            <option value="BOOKING_REJECTED">Booking Rejected</option>
            <option value="BOOKING_CANCELLED">Booking Cancelled</option>
            <option value="STADIUM_CREATED">Stadium Created</option>
            <option value="STADIUM_UPDATED">Stadium Updated</option>
            <option value="SPORT_CREATED">Sport Discipline Created</option>
            <option value="REVIEW_DELETED">Review Moderated</option>
            <option value="SETTINGS_UPDATED">System Settings Changed</option>
            <option value="NOTIFICATION_BROADCAST">Notification Broadcast</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Entity / Target</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-royal-blue mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No activity logs recorded yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Admin operations will automatically log here.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const adminName = log.admin?.name || log.adminName || 'Admin';
                  const adminEmail = log.admin?.email || '';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        <div className="font-mono text-slate-700 font-semibold">
                          {new Date(log.createdAt || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.createdAt || log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{adminName}</div>
                        {adminEmail && <div className="text-xs text-slate-400">{adminEmail}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-blue-50 text-royal-blue border border-blue-100 rounded">
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700 capitalize">
                          {log.entityType || log.entity || 'System'}
                        </div>
                        {log.entityId && (
                          <div className="font-mono text-[10px] text-slate-400">
                            ID: {log.entityId.slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600 max-w-md">
                        {log.details ? (
                          typeof log.details === 'object' ? (
                            <pre className="font-mono text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 overflow-x-auto">
                              {JSON.stringify(log.details, null, 1)}
                            </pre>
                          ) : (
                            log.details
                          )
                        ) : (
                          <span className="text-slate-400 italic">No additional metadata</span>
                        )}
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
    </div>
  );
};

export default AdminActivityLog;
