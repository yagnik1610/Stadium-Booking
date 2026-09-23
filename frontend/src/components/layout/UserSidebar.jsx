import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Building2, Heart, CalendarDays, 
  CreditCard, Star, Bell, User, Settings, LogOut, ShieldCheck
} from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default function UserSidebar({ onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onCloseMobile) onCloseMobile();
    navigate('/');
  };

  const pathname = location.pathname;

  const isItemActive = (to) => {
    if (to === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (to === '/dashboard/bookings') {
      return pathname === '/dashboard/bookings' || pathname.startsWith('/dashboard/bookings/') || pathname === '/my-bookings';
    }
    if (to === '/stadiums') {
      return pathname === '/stadiums' || pathname.startsWith('/stadiums/');
    }
    return pathname === to;
  };

  const navGroups = [
    {
      group: 'DASHBOARD',
      items: [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'DISCOVER',
      items: [
        { label: 'Stadiums', to: '/stadiums', icon: Building2 },
        { label: 'Favorites', to: '/favorites', icon: Heart }
      ]
    },
    {
      group: 'BOOKINGS',
      items: [
        { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarDays },
        { label: 'Payment History', to: '/dashboard/payments', icon: CreditCard }
      ]
    },
    {
      group: 'ACTIVITY',
      items: [
        { label: 'Reviews', to: '/dashboard/reviews', icon: Star },
        { label: 'Notifications', to: '/dashboard/notifications', icon: Bell }
      ]
    },
    {
      group: 'ACCOUNT',
      items: [
        { label: 'Profile', to: '/profile', icon: User },
        { label: 'Settings', to: '/settings', icon: Settings }
      ]
    }
  ];

  const initials = getInitials(user?.name);

  return (
    <aside className="w-full h-full bg-white flex flex-col justify-between py-5 px-3.5 select-none">
      
      {/* 1. TOP: Compact User Profile Card (approx 76px height) */}
      <div className="shrink-0 pb-4 border-b border-slate-100">
        <div className="bg-[#F0F7FF] border border-[#DBEAFE] rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-extrabold text-[#172554] truncate capitalize">
              {user?.name || 'Athlete'}
            </h4>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Verified Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: Primary Navigation List with Internal Scrollbar if needed */}
      <nav 
        className="flex-1 overflow-y-auto py-4 space-y-5 pr-1"
        aria-label="Sidebar Primary Navigation"
      >
        {navGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
              {grp.group}
            </div>
            <div className="space-y-1">
              {grp.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 h-[42px] rounded-xl text-sm transition-all duration-150 ${
                      active
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-blue-200/50 shadow-2xs'
                        : 'text-[#334155] hover:bg-[#F0F7FF] hover:text-[#172554] font-semibold border border-transparent'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#2563EB]' : 'text-slate-500'}`} />
                    <span className="truncate text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. BOTTOM: Compact Logout Button */}
      <div className="shrink-0 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 h-[42px] rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 border border-transparent hover:border-red-100"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

    </aside>
  );
}
