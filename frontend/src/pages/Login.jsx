import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import IMAGES from '../config/images';
import Button from '../components/ui/Button';

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || 
    (new URLSearchParams(location.search).get('registered') === 'true' 
      ? 'Registration successful! Please sign in with your email and password.' 
      : '')
  );
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user) {
        const searchParams = new URLSearchParams(location.search);
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
          navigate(redirectPath);
        } else if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#F0F7FF]">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden min-h-[560px]">
        
        {/* LEFT COLUMN: High-quality professional sports/stadium photo (~4:5) */}
        <div className="relative md:w-1/2 min-h-[240px] md:min-h-full bg-slate-100 overflow-hidden flex flex-col justify-end p-8 text-white">
          <img
            src={IMAGES.LOGIN}
            alt="Sports arena and venue pitch"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            onError={(e) => {
              e.target.src = IMAGES.STADIUM_FALLBACKS[0];
            }}
          />
          {/* Subtle gradient so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#172554]/90 via-[#172554]/40 to-transparent" />

          <div className="relative z-10">
            <span className="inline-block text-xs uppercase tracking-wider font-bold text-blue-200 bg-white/15 px-3 py-1 rounded-full mb-3 border border-white/20">
              Stadium Booking
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug mb-2 text-white">
              Your Game. <br />
              Your Venue. <br />
              <span className="text-[#60A5FA]">Your Time.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
              Sign in to reserve slots, manage team bookings, and access verified athletic facilities.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean White Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-sm mx-auto">
            
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-[#64748B]">
                Sign in to continue booking your next game.
              </p>
            </div>

            {/* Success Alert */}
            {successMessage && !error && (
              <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                  Email Address or Admin ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="name@example.com or Admin#1610"
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={isLoading}
                  icon={ArrowRight}
                >
                  Sign In
                </Button>
              </div>
            </form>

            {/* Register link */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] text-center text-sm">
              <span className="text-[#64748B]">Don't have an account? </span>
              <Link
                to="/register"
                className="font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors ml-1"
              >
                Create Account
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
