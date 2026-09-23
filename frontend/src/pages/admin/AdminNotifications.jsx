import React, { useState, useEffect } from 'react';
import { adminAPI, notificationAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Mail,
  ShieldAlert
} from 'lucide-react';

const AdminNotifications = () => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'system_broadcast',
    target: 'all', // 'all', 'users', 'admins'
    userId: ''
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchNotificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await notificationAPI.getMy();
      if (res && res.success) {
        setRecentNotifications(res.notifications || res.data?.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchNotificationHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showNotification('error', 'Title and message are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.broadcastNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        target: form.target,
        userId: form.target === 'specific' ? form.userId.trim() : undefined
      });

      if (res && res.success) {
        const count = res.recipientCount !== undefined ? res.recipientCount : (res.data?.recipientCount || 1);
        showNotification(
          'success',
          `Notification broadcast successfully! Delivered to ${count} recipient(s) in MongoDB.`
        );
        setForm({
          title: '',
          message: '',
          type: 'system_broadcast',
          target: 'all',
          userId: ''
        });
        fetchNotificationHistory();
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      showNotification('error', err.message || 'Failed to dispatch broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Notification Management</h1>
        <p className="text-sm text-slate-500">
          Dispatch authenticated system broadcasts, booking alerts, and inspect persistent user notifications.
        </p>
      </div>

      {/* Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Broadcast Composer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="w-5 h-5 text-royal-blue" />
            <h2 className="text-base font-bold text-navy">Compose Administrative Notification</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience *
                </label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                >
                  <option value="all">All Registered Users</option>
                  <option value="users">Regular Users Only</option>
                  <option value="admins">Admin Team Only</option>
                  <option value="specific">Specific User ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notification Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                >
                  <option value="system_broadcast">System Broadcast</option>
                  <option value="booking_update">Booking Operational Notice</option>
                  <option value="maintenance_alert">Facility Maintenance Notice</option>
                  <option value="promotional">Event Announcement</option>
                </select>
              </div>
            </div>

            {form.target === 'specific' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient User MongoDB ObjectId *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 64c39f0a213e8b11b90c1234"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white font-mono text-slate-800"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notification Headline / Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Scheduled Stadium Lighting Maintenance on Sunday"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Notification Body *
              </label>
              <textarea
                rows={4}
                placeholder="Write full message content that will appear in users' notifications center..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                required
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-royal-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Persisting to MongoDB...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Admin Notification Stream / Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-royal-blue" />
              Admin Notifications Feed
            </h2>
            <button
              onClick={fetchNotificationHistory}
              className="text-xs text-royal-blue hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-8 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-royal-blue" />
              <span className="text-xs">Loading feed...</span>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent notifications found.
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {recentNotifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  className={`p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                    n.isRead ? 'bg-slate-50 border-slate-100' : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800">{n.title}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span className="capitalize">{n.type?.replace('_', ' ') || 'Notice'}</span>
                    <span>{n.isRead ? 'Read' : 'Unread'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
