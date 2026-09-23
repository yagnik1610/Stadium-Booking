import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, ArrowRight, LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-xs">
      {/* Top subtle royal accent highlight line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#2563EB]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LEFT: Professional SB Brand & Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-[#1D4ED8] transition-all duration-200 border border-blue-400/30">
                SB
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base text-[#172554] tracking-tight leading-none group-hover:text-[#2563EB] transition-colors">
                  STADIUM <span className="text-[#2563EB]">BOOKING</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Global Sports Arenas
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: Main Public Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive('/')
                  ? 'text-[#2563EB] bg-[#EFF6FF] shadow-xs'
                  : 'text-[#334155] hover:text-[#2563EB] hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/stadiums"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive('/stadiums')
                  ? 'text-[#2563EB] bg-[#EFF6FF] shadow-xs'
                  : 'text-[#334155] hover:text-[#2563EB] hover:bg-slate-50'
              }`}
            >
              Stadiums
            </Link>
            <Link
              to="/about"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive('/about')
                  ? 'text-[#2563EB] bg-[#EFF6FF] shadow-xs'
                  : 'text-[#334155] hover:text-[#2563EB] hover:bg-slate-50'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive('/contact')
                  ? 'text-[#2563EB] bg-[#EFF6FF] shadow-xs'
                  : 'text-[#334155] hover:text-[#2563EB] hover:bg-slate-50'
              }`}
            >
              Contact Us
            </Link>
          </div>

          {/* RIGHT: User Actions (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {!user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#334155] hover:text-[#2563EB] hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 shadow-xs"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-[#334155] hover:text-[#2563EB] hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-bold ${
              isActive('/') ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155] hover:bg-slate-50'
            }`}
          >
            Home
          </Link>
          <Link
            to="/stadiums"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-bold ${
              isActive('/stadiums') ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155] hover:bg-slate-50'
            }`}
          >
            Stadiums
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-bold ${
              isActive('/about') ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155] hover:bg-slate-50'
            }`}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-bold ${
              isActive('/contact') ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155] hover:bg-slate-50'
            }`}
          >
            Contact Us
          </Link>

          <div className="pt-4 border-t border-slate-100">
            {!user ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-xs font-bold text-[#334155] border border-slate-200 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8]"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
