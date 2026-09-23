import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Calendar
} from 'lucide-react';

const AdminProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'admin',
    isActive: true,
    createdAt: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await authAPI.getProfile();
      if (res && res.success) {
        const u = res.user || res.data?.user || res.data || {};
        setProfile({
          name: u.name || '',
          email: u.email || '',
          mobile: u.phone || u.mobile || '',
          role: u.role || 'admin',
          isActive: u.isActive !== false,
          createdAt: u.createdAt || ''
        });
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
      showNotification('error', err.message || 'Error loading profile from database');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await userAPI.updateProfile({
        name: profile.name,
        mobile: profile.mobile
      });
      if (res && res.success) {
        showNotification('success', 'Profile updated successfully.');
        if (updateUser) {
          updateUser(res.user || res.data?.user || res.data);
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      showNotification('error', err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'New password and confirmation do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res && res.success) {
        showNotification('success', 'Admin password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Password change error:', err);
      showNotification('error', err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-royal-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Administrator Profile</h1>
        <p className="text-sm text-slate-500">
          Manage your administrative credentials, verified contact details, and account security.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Identity Badge */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 bg-royal-blue text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
              {profile.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">{profile.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
              <StatusBadge status={profile.role} />
              <StatusBadge status={profile.isActive ? 'active' : 'inactive'} />
            </div>

            <div className="text-left bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-royal-blue shrink-0" />
                <span>Privilege: Full Platform Operations</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Registered: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Edit Profile & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-royal-blue" />
              <h2 className="text-base font-bold text-navy">Personal Details</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Read Only)
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <input
                    type="text"
                    value="Administrator (System Root)"
                    disabled
                    className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-royal-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                >
                  {updatingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-navy">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
