import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  ShieldAlert,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  HeartPulse,
  Users,
  FileCheck2
} from 'lucide-react';

const AdminSafetyRules = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [safety, setSafety] = useState({
    defaultSafetyGuidelines: '',
    emergencyContactInstructions: '',
    equipmentSafetyProtocols: '',
    playerSafetyRules: '',
    spectatorSafetyRules: ''
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      const settingsObj = res?.settings || res?.data?.settings || res?.data;
      if (res && res.success && settingsObj?.safetyRules) {
        setSafety((prev) => ({
          ...prev,
          ...settingsObj.safetyRules
        }));
      }
    } catch (err) {
      console.error('Failed to load safety guidelines:', err);
      showNotification('error', err.message || 'Error loading safety settings from MongoDB');
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
      const res = await adminAPI.updateSettings({
        safetyRules: safety
      });
      if (res && res.success) {
        showNotification('success', 'Safety protocols and guidelines updated successfully in MongoDB.');
      }
    } catch (err) {
      console.error('Failed to save safety settings:', err);
      showNotification('error', err.message || 'Failed to save safety settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Safety & Regulations Management</h1>
          <p className="text-sm text-slate-500">
            Configure system-wide player safety, spectator restrictions, emergency protocols, and equipment rules.
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

      {/* Notification Toast */}
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
        {/* Core Guidelines Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-royal-blue" />
            <div>
              <h2 className="text-base font-bold text-navy">Standard Facility Safety Guidelines</h2>
              <p className="text-xs text-slate-400">
                Shown to all users during stadium reservation and displayed on booking confirmations
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              General Facility Rules & Mandatory Attire
            </label>
            <textarea
              rows={3}
              value={safety.defaultSafetyGuidelines}
              onChange={(e) => setSafety({ ...safety, defaultSafetyGuidelines: e.target.value })}
              placeholder="e.g. Non-marking sports shoes mandatory on synthetic turf and wooden courts. Proper sports attire required at all times."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-royal-blue" />
                Player Physical Safety & Age Restrictions
              </label>
              <textarea
                rows={4}
                value={safety.playerSafetyRules}
                onChange={(e) => setSafety({ ...safety, playerSafetyRules: e.target.value })}
                placeholder="e.g. Players under 16 must be accompanied by an adult guardian. Warm-up exercises recommended before high-intensity gameplay."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Spectator / Audience Safety & Conduct
              </label>
              <textarea
                rows={4}
                value={safety.spectatorSafetyRules}
                onChange={(e) => setSafety({ ...safety, spectatorSafetyRules: e.target.value })}
                placeholder="e.g. Spectators must remain in designated seating areas. Flash photography prohibited during professional games."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Emergency Protocols & Equipment */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-base font-bold text-navy">Emergency Protocols & Equipment Handling</h2>
              <p className="text-xs text-slate-400">
                Critical procedures for medical incidents, equipment checkout, and first-aid access
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Emergency & First Aid Procedure
              </label>
              <textarea
                rows={3}
                value={safety.emergencyContactInstructions}
                onChange={(e) => setSafety({ ...safety, emergencyContactInstructions: e.target.value })}
                placeholder="e.g. First aid kits available at main reception desk. In case of serious injury, contact on-site medical desk immediately."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Equipment Usage Protocols
              </label>
              <textarea
                rows={3}
                value={safety.equipmentSafetyProtocols}
                onChange={(e) => setSafety({ ...safety, equipmentSafetyProtocols: e.target.value })}
                placeholder="e.g. Inspect all balls, nets, and posts prior to starting play. Report any broken or hazardous equipment immediately."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-royal-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving to MongoDB...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Safety Guidelines
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSafetyRules;
