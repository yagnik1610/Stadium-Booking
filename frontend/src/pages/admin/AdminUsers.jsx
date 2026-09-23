import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  UserX,
  RotateCcw
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/common/Button';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Action Dialog State
  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null); // 'activate' | 'deactivate'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (isActive !== '') params.isActive = isActive;

      const res = await adminAPI.getUsers(params);
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
        setPagination({
          totalPages: res.pagination?.totalPages || 1,
          total: res.total || res.users.length
        });
      } else {
        setError(res.message || 'Failed to retrieve users.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Network error fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role, isActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setIsActive('');
    setPage(1);
  };

  const handleToggleStatus = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const newStatus = actionType === 'activate';
      const res = await adminAPI.updateUserStatus(actionUser._id, { isActive: newStatus });
      if (res.success) {
        setUsers(prev => prev.map(u => u._id === actionUser._id ? { ...u, isActive: newStatus } : u));
        setActionUser(null);
      } else {
        alert(res.message || 'Failed to update user status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
            Account Directory
          </span>
          <h2 className="text-xl font-black text-[#172554] tracking-tight mt-1">
            Registered Athletes & Administrators
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage account verification, platform roles, and member activity status.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by user name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Roles</option>
              <option value="user">Athletes (Users)</option>
              <option value="admin">Platform Administrators</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Accounts</option>
              <option value="false">Deactivated Accounts</option>
            </select>

            {(search || role || isActive) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                title="Clear filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
            Loading user accounts...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No user accounts found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Phone / Mobile</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172554] flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.role === 'admin' && (
                          <Shield className="w-3.5 h-3.5 text-[#2563EB]" title="Administrator" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{u.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.phone || u.mobile || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.city ? `${u.city}${u.state ? `, ${u.state}` : ''}` : 'India'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Eye}
                          onClick={() => navigate(`/admin/users/${u._id}`)}
                          title="Inspect profile & history"
                        >
                          View
                        </Button>
                        
                        {u.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('deactivate');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                            title="Deactivate account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('activate');
                            }}
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Activate account"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Confirmation Dialog for Activation/Deactivation */}
      <ConfirmDialog
        isOpen={!!actionUser}
        title={actionType === 'activate' ? 'Activate User Account' : 'Deactivate User Account'}
        message={
          actionType === 'activate'
            ? `Are you sure you want to activate the account for ${actionUser?.name} (${actionUser?.email})? They will regain access to book arenas.`
            : `Are you sure you want to deactivate ${actionUser?.name}? They will be blocked from logging in and booking stadiums until reactivated.`
        }
        confirmLabel={actionType === 'activate' ? 'Activate Account' : 'Deactivate Account'}
        confirmVariant={actionType === 'activate' ? 'primary' : 'danger'}
        loading={actionLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setActionUser(null)}
      />

    </div>
  );
}
