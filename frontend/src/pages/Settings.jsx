import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { 
  KeyRound, ShieldCheck, Bell, User, CheckCircle2, 
  AlertCircle, Lock, Eye, EyeOff 
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function Settings() {
  const { user } = useAuth();

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // Preference State
  const [notifPreferences, setNotifPreferences] = useState({
    bookingAlerts: true,
    paymentReceipts: true,
    promotional: false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirm password do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await userAPI.changePassword({
        currentPassword,
        newPassword
      });

      if (res.success) {
        setPwSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPwError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-blue-200/50">
          Account Security & Preferences
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your password credentials, notification preferences, and security settings.
        </p>
      </div>

      {/* 1. Password Change Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#172554]">Change Password</h2>
            <p className="text-xs text-slate-500">Ensure your account uses a secure password of at least 6 characters</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Password *
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password *
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1.5"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide password text' : 'Show password text'}</span>
            </button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={pwLoading}
              icon={Lock}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#172554]">Notification Preferences</h2>
            <p className="text-xs text-slate-500">Configure how and when you receive in-app alerts</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] cursor-pointer">
            <div>
              <span className="text-xs font-bold text-[#172554] block">Booking Status Updates</span>
              <span className="text-[11px] text-slate-500">Receive alerts when your reservations are approved or rescheduled</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.bookingAlerts}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, bookingAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] cursor-pointer">
            <div>
              <span className="text-xs font-bold text-[#172554] block">Payment Receipts & Invoices</span>
              <span className="text-[11px] text-slate-500">Alerts when Razorpay transactions are successfully verified</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.paymentReceipts}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, paymentReceipts: e.target.checked })}
              className="w-4 h-4 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
            />
          </label>
        </div>
      </div>

    </div>
  );
}
