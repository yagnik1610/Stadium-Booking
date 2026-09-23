import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { notificationAPI } from '../services/api';
import Button from '../components/ui/Button';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationAPI.getMy();
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await notificationAPI.markRead(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationAPI.markAllRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await notificationAPI.delete(id);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadList = notifications.filter(n => !n.isRead);
  const displayedList = filter === 'unread' ? unreadList : notifications;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-blue-200/50">
            Inbox & Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time updates regarding your reservations, approvals, and verified payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={markingAll}
              onClick={handleMarkAllRead}
              icon={CheckCheck}
            >
              Mark All as Read
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Unread</span>
          {unreadList.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
              {unreadList.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800">Failed to load alerts</h3>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">
            {filter === 'unread' ? "You're all caught up!" : "No notifications yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'unread' 
              ? "There are no unread alerts at this time." 
              : "System and booking notifications will be displayed here as your bookings progress."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedList.map((n) => {
            const timeAgo = new Date(n.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={n._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-[#EFF6FF]/50 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.isRead
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#172554]">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="p-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(n._id)}
                    className="p-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
