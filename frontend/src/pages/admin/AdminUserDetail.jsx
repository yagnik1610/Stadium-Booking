import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Star,
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/common/Button';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'payments' | 'reviews'

  // Activation Dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getUserStats(id);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'User not found');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message || 'Failed to load user information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    setActionLoading(true);
    try {
      const newStatus = !data.user.isActive;
      const res = await adminAPI.updateUserStatus(data.user._id, { isActive: newStatus });
      if (res.success) {
        setData(prev => ({
          ...prev,
          user: { ...prev.user, isActive: newStatus }
        }));
        setIsConfirmOpen(false);
      } else {
        alert(res.message || 'Failed to update user status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
        Loading user profile and activity records...
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-rose-900">User Account Not Found</h3>
        <p className="text-xs text-rose-700">{error || 'Requested user does not exist.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
          Return to Users Directory
        </Button>
      </div>
    );
  }

  const { user, stats, bookings = [], payments = [], reviews = [] } = data;

  return (
    <div className="space-y-6">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant={user.isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
          >
            {user.isActive ? 'Deactivate Account' : 'Activate Account'}
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-black text-xl flex items-center justify-center shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#172554] tracking-tight">{user.name}</h2>
                <StatusBadge status={user.role} />
                <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {user.phone || user.mobile || 'No mobile'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {user.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : 'India'}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Total Bookings</span>
            <span className="text-base font-black text-[#172554]">{stats?.totalBookings || 0}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Total Payments</span>
            <span className="text-base font-black text-[#172554]">{stats?.totalPayments || 0}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Lifetime Spend</span>
            <span className="text-base font-black text-emerald-600">₹{stats?.totalSpent ? stats.totalSpent.toLocaleString('en-IN') : '0'}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Saved Favorites</span>
            <span className="text-base font-black text-[#172554]">{stats?.totalFavorites || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs for Activity History */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        
        {/* Tab Selector Header */}
        <div className="flex border-b border-slate-100 px-4 pt-2 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Tab 1: Bookings */}
        {activeTab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No bookings recorded for this athlete.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Ref</th>
                      <th className="py-3 px-4">Stadium & Sport</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bookings.map(b => (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {b.bookingReference || b._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#172554] block">{b.stadium?.name || 'Arena'}</span>
                          <span className="text-[11px] text-slate-400">{b.sport}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{b.bookingDate}</div>
                          <div className="text-[11px] text-slate-400">{b.startTime} – {b.endTime}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#172554]">
                          ₹{b.totalPrice ? b.totalPrice.toLocaleString('en-IN') : '0'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate(`/admin/bookings/${b._id}`)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment transactions recorded for this user.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Payment ID / Order</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#172554] block">{p.razorpayPaymentId || p._id}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{p.razorpayOrderId}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#172554]">
                          ₹{(p.amount / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {p.createdAt ? new Date(p.createdAt).toLocaleString('en-GB') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="p-5 space-y-3">
            {reviews.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No reviews written by this user yet.
              </div>
            ) : (
              reviews.map(r => (
                <div key={r._id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172554]">{r.stadium?.name || 'Arena Review'}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{r.rating}/5</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-slate-600 italic">"{r.comment}"</p>
                  )}
                  <span className="text-[10px] text-slate-400 block">
                    Posted on {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={user.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={
          user.isActive
            ? `Are you sure you want to deactivate ${user.name}'s account? They will not be able to log in or make reservations.`
            : `Are you sure you want to activate ${user.name}'s account?`
        }
        confirmLabel={user.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={user.isActive ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
