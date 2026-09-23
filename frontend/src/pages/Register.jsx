import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Eye, EyeOff, AlertCircle, 
  Phone, Calendar, MapPin, CheckCircle2, Globe, Compass 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import IMAGES from '../config/images';
import Button from '../components/ui/Button';
import { 
  COUNTRIES, 
  getCountryDialCode, 
  getStatesForCountry, 
  getCitiesForState 
} from '../data/locationData';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function Register() {
  const { success: toastSuccess } = useToast() || {};
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: 'India',
    dialCode: '+91',
    mobileNumber: '',
    age: '',
    gender: 'Prefer not to say',
    state: '',
    city: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Dynamic States for currently selected Country
  const availableStates = getStatesForCountry(formData.country);

  // Dynamic Cities for currently selected State
  const availableCities = getCitiesForState(formData.country, formData.state);

  const handleCountryChange = (newCountry) => {
    const newDialCode = getCountryDialCode(newCountry);
    setFormData(prev => ({
      ...prev,
      country: newCountry,
      dialCode: newDialCode,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Name Validation
    if (!formData.name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    // Email Validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    // Mobile Validation (International ITU Standard)
    const rawNumber = formData.mobileNumber.trim();
    if (!rawNumber) {
      setError('Please provide your mobile phone number.');
      return;
    }

    const digitsOnly = rawNumber.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid international phone number (7 to 15 digits).');
      return;
    }

    const fullMobile = `${formData.dialCode} ${rawNumber}`;

    // Age Validation
    if (formData.age) {
      const numAge = Number(formData.age);
      if (isNaN(numAge) || numAge < 5 || numAge > 120) {
        setError('Please enter a valid age between 5 and 120.');
        return;
      }
    }

    // Country, State & City validation
    if (!formData.country) {
      setError('Please select your country.');
      return;
    }

    if (!formData.state) {
      setError('Please select your state or region.');
      return;
    }

    if (!formData.city) {
      setError('Please select your city.');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        mobile: fullMobile,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
        country: formData.country,
        state: formData.state,
        city: formData.city
      };

      const res = await authAPI.register(payload);
      if (res.success) {
        toastSuccess?.('Account registered successfully! Please log in with your credentials.');
        navigate('/login?registered=true', {
          state: {
            registered: true,
            email: formData.email.trim().toLowerCase(),
            message: 'Registration successful! Please log in with your email and password.'
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F0F7FF]">
      <div className="max-w-5xl w-full flex flex-col lg:flex-row bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden my-6">
        
        {/* LEFT COLUMN: Real sports turf training imagery */}
        <div className="relative lg:w-5/12 min-h-[260px] lg:min-h-full bg-slate-100 overflow-hidden flex flex-col justify-between p-8 text-white">
          <img
            src={IMAGES.REGISTER}
            alt="Sports turf training facility"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            onError={(e) => {
              e.target.src = IMAGES.STADIUM_FALLBACKS[1];
            }}
          />
          {/* Royal Blue / Navy Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#172554] via-[#172554]/60 to-[#172554]/30" />

          {/* Top Badge */}
          <div className="relative z-10">
            <span className="inline-block text-xs uppercase tracking-wider font-bold text-blue-200 bg-white/15 px-3 py-1 rounded-full border border-white/20">
              International Players & Organizers
            </span>
          </div>

          {/* Bottom Pitch Copy */}
          <div className="relative z-10 pt-16">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug mb-3 text-white">
              Instant Access to <br />
              <span className="text-[#60A5FA]">Verified Sports Arenas.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-6">
              Create your account with your location details to unlock localized turf reservations, live availability, and real-time slot bookings across multiple countries.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-2 text-xs text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
                <span>Global & domestic arena reservations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
                <span>Instant automated slot confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
                <span>Synchronized country, state & city discovery</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form */}
        <div className="w-full lg:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="w-full max-w-xl mx-auto">
            
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight mb-1.5">
                Create Your Profile
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Enter your details to begin booking cricket pitches, football turfs, and sports courts.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Marcus Vance"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 2: Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 3: International Mobile Number (Country Code + Phone Number) */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  {/* Dial Code Selector */}
                  <div className="w-32 flex-shrink-0">
                    <select
                      value={formData.dialCode}
                      onChange={(e) => handleChange('dialCode', e.target.value)}
                      className="w-full px-2 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.dialCode}>
                          {c.code} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={(e) => handleChange('mobileNumber', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports valid international phone formats worldwide.
                </p>
              </div>

              {/* Row 4: Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      min="5"
                      max="120"
                      placeholder="e.g. 25"
                      value={formData.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  >
                    {GENDER_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Country Selector */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                  Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 6: Dependent State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
                    State / Region *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="">Select State / Region</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    City *
                  </label>
                  <select
                    required
                    disabled={!formData.state}
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] ${
                      !formData.state ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''
                    }`}
                  >
                    <option value="">
                      {!formData.state ? 'Select State first' : 'Select City'}
                    </option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 7: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5"
                >
                  Create Account
                </Button>
              </div>

              {/* Sign In Link */}
              <p className="text-center text-xs text-[#64748B] pt-2">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#2563EB] hover:underline">
                  Sign in here
                </Link>
              </p>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
