import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Building,
  CreditCard,
  Calendar,
  Bell,
  Globe
} from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [settings, setSettings] = useState({
    platformName: 'Stadium Booking System',
    contactEmail: 'admin@stadiumbooking.com',
    supportPhone: '+91 98765 43210',
    address: 'National Sports Complex, Ring Road, New Delhi, India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    bookingConfig: {
      advanceBookingDays: 30,
      minDurationHours: 1,
      maxDurationHours: 6,
      cancellationCutoffHours: 24
    },
    gstConfig: {
      gstRatePercent: 18,
      gstEnabled: true,
      companyGstNumber: '07AAAAA0000A1Z5',
      invoicePrefix: 'SBS-INV'
    },
    notifications: {
      emailAlerts: true,
      bookingAlerts: true,
      paymentAlerts: true
    }
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      const d = res?.settings || res?.data?.settings || res?.data;
      if (res && res.success && d) {
        setSettings((prev) => ({
          ...prev,
          ...d,
          bookingConfig: { ...prev.bookingConfig, ...d.bookingConfig },
          gstConfig: { ...prev.gstConfig, ...d.gstConfig },
          notifications: { ...prev.notifications, ...d.notifications }
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      showNotification('error', err.message || 'Error loading system configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminAPI.updateSettings(settings);
      if (res && res.success) {
        showNotification('success', 'System settings saved and persisted to MongoDB.');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      showNotification('error', err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-royal-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Settings & Configuration</h1>
          <p className="text-sm text-slate-500">
            Configure global business credentials, GST parameters, booking rules, and operational boundaries.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          Reload
        </button>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-royal-blue" />
            <h2 className="text-base font-bold text-navy">Platform Identity & Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operating Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* GST & Invoice Setup */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-navy">Statutory GST & Billing Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.gstConfig.gstRatePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gstConfig: { ...settings.gstConfig, gstRatePercent: Number(e.target.value) }
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company GSTIN Number
              </label>
              <input
                type="text"
                value={settings.gstConfig.companyGstNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gstConfig: { ...settings.gstConfig, companyGstNumber: e.target.value }
                  })
                }
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Reference Prefix
              </label>
              <input
                type="text"
                value={settings.gstConfig.invoicePrefix}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gstConfig: { ...settings.gstConfig, invoicePrefix: e.target.value }
                  })
                }
                placeholder="SBS-INV"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Currency & Timezone
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-20 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-navy"
                />
                <input
                  type="text"
                  value={settings.timezone}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Booking Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-navy">Global Booking Constraints</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advance Booking Window (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.bookingConfig.advanceBookingDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingConfig: {
                      ...settings.bookingConfig,
                      advanceBookingDays: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Cutoff (Hours Before)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={settings.bookingConfig.cancellationCutoffHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingConfig: {
                      ...settings.bookingConfig,
                      cancellationCutoffHours: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.bookingConfig.minDurationHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingConfig: {
                      ...settings.bookingConfig,
                      minDurationHours: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.bookingConfig.maxDurationHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingConfig: {
                      ...settings.bookingConfig,
                      maxDurationHours: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-royal-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Persisting Settings...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save System Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
