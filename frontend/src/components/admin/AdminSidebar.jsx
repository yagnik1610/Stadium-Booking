import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  CalendarCheck,
  CreditCard,
  Star,
  Clock,
  Bell,
  ShieldCheck,
  FileText,
  BarChart3,
  FileSpreadsheet,
  User,
  Settings,
  History,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Admin Console?')) {
      logout();
      navigate('/');
    }
  };

  const navCategories = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Stadiums', to: '/admin/stadiums', icon: Building2 },
        { label: 'Sports', to: '/admin/sports', icon: Trophy },
        { label: 'Bookings', to: '/admin/bookings', icon: CalendarCheck },
        { label: 'Payments', to: '/admin/payments', icon: CreditCard },
        { label: 'Reviews', to: '/admin/reviews', icon: Star }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Availability', to: '/admin/availability', icon: Clock },
        { label: 'Notifications', to: '/admin/notifications', icon: Bell },
        { label: 'Safety & Rules', to: '/admin/safety-rules', icon: ShieldCheck },
        { label: 'Terms & Conditions', to: '/admin/terms', icon: FileText }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
        { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Admin Profile', to: '/admin/profile', icon: User },
        { label: 'Settings', to: '/admin/settings', icon: Settings },
        { label: 'Activity Log', to: '/admin/activity', icon: History }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-white border-r border-[#E2E8F0] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider text-[#172554] block leading-tight">
                STADIUM BOOKING
              </span>
              <span className="text-[10px] font-bold text-[#2563EB] tracking-widest uppercase">
                ADMIN PANEL
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navCategories.map((category, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                {category.title}
              </div>
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60 shadow-2xs'
                          : 'text-slate-600 hover:text-[#172554] hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
