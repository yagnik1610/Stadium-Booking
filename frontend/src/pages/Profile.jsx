import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  ShieldCheck, Save, AlertCircle, CheckCircle2, Lock, Globe, Compass, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { 
  COUNTRIES, 
  getStatesForCountry, 
  getCitiesForState 
} from '../data/locationData';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: 'Prefer not to say',
    country: 'India',
    state: '',
    city: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getProfile();
      if (res.success && res.user) {
        setFormData({
          name: res.user.name || '',
          email: res.user.email || '',
          mobile: res.user.mobile || '',
          age: res.user.age !== undefined && res.user.age !== null ? String(res.user.age) : '',
          gender: res.user.gender || 'Prefer not to say',
          country: res.user.country || 'India',
          state: res.user.state || '',
          city: res.user.city || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          age: user.age !== undefined && user.age !== null ? String(user.age) : '',
          gender: user.gender || 'Prefer not to say',
          country: user.country || 'India',
          state: user.state || '',
          city: user.city || ''
        });
      }
      setError('Could not refresh profile from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const availableStates = getStatesForCountry(formData.country);
  const availableCities = getCitiesForState(formData.country, formData.state);

  const handleCountryChange = (newCountry) => {
    setFormData(prev => ({
      ...prev,
      country: newCountry,
      state: '',
      city: ''
    }));
    setError('');
  };

  const handleStateChange = (newState) => {
    setFormData(prev => ({
      ...prev,
      state: newState,
      city: ''
    }));
    setError('');
  };

  const handleChange = (field, value) => {
    setError('');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Full Name cannot be empty.');
      return;
    }

    if (formData.mobile && formData.mobile.trim() !== '') {
      const cleanMobile = formData.mobile.trim();
      const digitsOnly = cleanMobile.replace(/\D/g, '');
      const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
      if (!phoneRegex.test(cleanMobile) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        setError('Please provide a valid international phone number (7 to 15 digits).');
        return;
      }
    }

    if (formData.age) {
      const numAge = Number(formData.age);
      if (isNaN(numAge) || numAge < 5 || numAge > 120) {
        setError('Age must be between 5 and 120.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
        country: formData.country,
        state: formData.state,
        city: formData.city
      };

      const res = await userAPI.updateProfile(payload);
      if (res.success && res.user) {
        success('Profile updated successfully in MongoDB!');
        if (updateUser) {
          updateUser(res.user);
        }
        setFormData(prev => ({
          ...prev,
          name: res.user.name || prev.name,
          mobile: res.user.mobile !== undefined ? res.user.mobile : prev.mobile,
          age: res.user.age !== undefined && res.user.age !== null ? String(res.user.age) : prev.age,
          gender: res.user.gender || prev.gender,
          country: res.user.country || prev.country,
          state: res.user.state || prev.state,
          city: res.user.city || prev.city
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      toastError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(formData.name || user?.name);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-48" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* 1. Header Section matching Second Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md mb-1.5 inline-block border border-blue-200/50">
            ACCOUNT SETTINGS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight">
            User Profile & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal contact details, verified account credentials, and international location settings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchProfile}
          icon={RefreshCw}
        >
          Refresh Data
        </Button>
      </div>

      {/* 2. User Overview Card with Dynamic Avatar Initials */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF6FF] text-[#2563EB] font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-[#DBEAFE] shrink-0 shadow-xs">
          {initials}
        </div>

        <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172554] truncate capitalize">
              {formData.name || 'Athlete'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-[#DBEAFE]">
              {user?.role === 'admin' ? 'Administrator' : 'Registered Member'}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Account</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formData.email}</span>
          </p>

          {(formData.city || formData.state || formData.country) && (
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{[formData.city, formData.state, formData.country].filter(Boolean).join(', ')}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Personal & Location Information Form */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-[#172554]">
            Personal & Location Information
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ensure your mobile and location details are up-to-date for localized booking notifications and match alerts.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Yagnik Vithlani"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Email (Read Only per backend policy) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Account ID (Locked)
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Age
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all bg-white"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Country</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all bg-white"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>State / Province</span>
              </label>
              {availableStates.length > 0 ? (
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Select State / Region</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Enter state or province"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>City</span>
              </label>
              {availableCities.length > 0 ? (
                <select
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Select City</option>
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
}
