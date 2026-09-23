import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User,
  Search,
  ChevronDown,
  ShieldCheck,
  Settings,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminHeader({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    // Contextual navigation based on search input format
    if (query.toUpperCase().startsWith('STB-') || query.startsWith('#')) {
      navigate(`/admin/bookings?search=${encodeURIComponent(query)}`);
    } else if (query.includes('@')) {
      navigate(`/admin/users?search=${encodeURIComponent(query)}`);
    } else {
      // Default to bookings or stadiums search
      navigate(`/admin/bookings?search=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const displayName = user?.loginId || (user?.email === 'admin@stadium.com' ? 'Admin#1610' : user?.name || 'Admin#1610');

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Toggle & Brand Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/admin" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
            SB
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-[#172554] tracking-tight leading-none">
              STADIUM BOOKING ADMIN
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              Management Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Global Admin Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, bookings, stadiums..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB] focus:bg-white text-slate-800 placeholder:text-slate-400 transition-colors"
          />
        </form>
      </div>

      {/* Right: Notification, Admin Pill & Account Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick link to public user portal */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-[#2563EB] bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          title="Open customer website in new tab"
        >
          <span>User Portal</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {/* Notifications Icon */}
        <button
          type="button"
          onClick={() => navigate('/admin/notifications')}
          className="p-2 rounded-xl text-slate-500 hover:text-[#2563EB] hover:bg-[#F0F7FF] transition-colors relative"
          title="Admin Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#2563EB] absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* Admin Account & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#F8FAFC] border border-slate-200/80 transition-all focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-black text-[#172554] block leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">
                {user?.role === 'admin' ? 'Administrator' : 'Admin'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <span className="text-xs font-black text-[#172554] block truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user?.email || 'admin@stadium.com'}
                </span>
                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#2563EB] px-1.5 py-0.5 rounded border border-blue-100">
                  Role: Administrator
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Profile</span>
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
