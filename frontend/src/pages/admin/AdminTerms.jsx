import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  FileText,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  History,
  Info,
  Calendar,
  Layers
} from 'lucide-react';

const AdminTerms = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [terms, setTerms] = useState({
    version: '1.0',
    generalTerms: '',
    bookingTerms: '',
    cancellationTerms: '',
    audienceTerms: '',
    lastUpdated: new Date().toISOString()
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      const settingsObj = res?.settings || res?.data?.settings || res?.data;
      if (res && res.success && settingsObj?.termsAndConditions) {
        setTerms((prev) => ({
          ...prev,
          ...settingsObj.termsAndConditions
        }));
      }
    } catch (err) {
      console.error('Failed to load terms & conditions:', err);
      showNotification('error', err.message || 'Error loading terms from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedTerms = {
        ...terms,
        lastUpdated: new Date().toISOString()
      };
      const res = await adminAPI.updateSettings({
        termsAndConditions: updatedTerms
      });
      if (res && res.success) {
        setTerms(updatedTerms);
        showNotification(
          'success',
          `Terms & Conditions version ${terms.version} updated successfully in MongoDB.`
        );
      }
    } catch (err) {
      console.error('Failed to save terms:', err);
      showNotification('error', err.message || 'Failed to save terms');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Terms & Conditions Management</h1>
          <p className="text-sm text-slate-500">
            Version-controlled legal terms, user booking contracts, cancellation rules, and spectator policies.
          </p>
        </div>
        <button
          onClick={fetchTerms}
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
        {/* Version & Metadata Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-royal-blue rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400">Active Terms Version</span>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={terms.version}
                  onChange={(e) => setTerms({ ...terms, version: e.target.value })}
                  className="w-24 px-2.5 py-1 text-sm font-bold text-royal-blue bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-royal-blue"
                  placeholder="e.g. 1.1"
                  required
                />
                <span className="text-xs text-slate-500">
                  Last updated: {new Date(terms.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <strong className="text-slate-700">Integrity Rule:</strong> New bookings record this version string so historical contracts remain legally verifiable.
          </div>
        </div>

        {/* General & Booking Terms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-royal-blue" />
              General Platform Terms
            </h2>
            <p className="text-xs text-slate-400">Governs account creation, usage rights, and liability waivers.</p>
            <textarea
              rows={6}
              value={terms.generalTerms}
              onChange={(e) => setTerms({ ...terms, generalTerms: e.target.value })}
              placeholder="Standard user service terms..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-royal-blue" />
              Stadium Booking Terms
            </h2>
            <p className="text-xs text-slate-400">Accepted by customers during checkout prior to slot confirmation.</p>
            <textarea
              rows={6}
              value={terms.bookingTerms}
              onChange={(e) => setTerms({ ...terms, bookingTerms: e.target.value })}
              placeholder="Facility reservation terms, prompt arrival, and turf etiquette..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Cancellation & Spectator Terms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Cancellation & Refund Policy
            </h2>
            <p className="text-xs text-slate-400">Cutoff hours, refund percentages, and force majeure conditions.</p>
            <textarea
              rows={6}
              value={terms.cancellationTerms}
              onChange={(e) => setTerms({ ...terms, cancellationTerms: e.target.value })}
              placeholder="Cancellations permitted up to 24 hours before session start..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Audience & Spectator Terms
            </h2>
            <p className="text-xs text-slate-400">Pass regulations, code of conduct, and spectator capacity caps.</p>
            <textarea
              rows={6}
              value={terms.audienceTerms}
              onChange={(e) => setTerms({ ...terms, audienceTerms: e.target.value })}
              placeholder="Spectator code of conduct, pass validation, and admission gate rules..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
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
                Updating MongoDB...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Terms & Update Version
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTerms;
