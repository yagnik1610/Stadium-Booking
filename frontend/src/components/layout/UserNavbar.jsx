import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { 
  Bell, User, CalendarDays, CreditCard, Heart, Settings, 
  LogOut, ChevronDown, LayoutDashboard, Menu, ShieldAlert
} from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default function UserNavbar({ onToggleMobileSidebar }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch real unread notification count from backend
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        if (isMounted && res.success && typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        // Silently handle offline/token refresh
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const initials = getInitials(user?.name);

  // Derive current area label based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.startsWith('/stadiums')) return 'Stadium Discovery';
    if (path.startsWith('/dashboard/bookings')) return 'My Bookings';
    if (path === '/favorites') return 'Saved Favorites';
    if (path === '/dashboard/payments') return 'Billing & Payments';
    if (path === '/dashboard/reviews') return 'Player Reviews';
    if (path === '/dashboard/notifications') return 'Notifications';
    if (path === '/profile') return 'User Profile';
    if (path === '/settings') return 'Account Settings';
    return 'User Workspace';
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-2xs h-16 flex items-center">
      <div className="w-full max-w-[1420px] mx-auto px-6 sm:px-8 flex justify-between items-center">
        
        {/* LEFT: Mobile hamburger trigger + Workspace Label */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#2563EB] transition-colors focus:outline-none"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Breadcrumb/Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#172554] tracking-tight uppercase">
              STADIUM BOOKING
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-[#2563EB]">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* RIGHT: Real Notifications + User Account Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Notification Bell with real MongoDB unread count */}
          <Link
            to="/dashboard/notifications"
            className={`relative p-2 rounded-lg text-slate-600 hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors ${
              location.pathname === '/dashboard/notifications' ? 'text-[#2563EB] bg-[#EFF6FF]' : ''
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Account Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all text-left focus:outline-none"
            >
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center font-black text-xs">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-[#172554] truncate max-w-[120px]">
                  {user?.name || 'Account'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role || 'Member'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-[#172554] truncate">{user?.name || 'Logged-in User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>

                <Link
                  to="/dashboard/bookings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  My Bookings
                </Link>

                <Link
                  to="/dashboard/payments"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Payment History
                </Link>

                <Link
                  to="/favorites"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Saved Favorites
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Admin Console
                  </Link>
                )}

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
