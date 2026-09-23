import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#172554] border-t border-blue-900/60 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-[#1D4ED8] transition-colors border border-blue-400/30">
                SB
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                STADIUM <span className="text-[#60A5FA]">BOOKING</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#BFDBFE] max-w-sm leading-relaxed">
              The international sports booking platform connecting athletes, clubs, and sports enthusiasts with verified sports arenas, cricket grounds, football turfs, and athletic complexes.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-[#93C5FD]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
                <span>Verified Facilities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#60A5FA]" />
                <span>Live Slot Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#60A5FA]" />
                <span>Multi-Country Catalog</span>
              </div>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4 text-[#93C5FD]">
              Explore
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/stadiums" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Explore Stadiums
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4 text-[#93C5FD]">
              Account
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/login" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Register Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard/bookings" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Saved Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Information & Support */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4 text-[#93C5FD]">
              Information & Support
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Booking Guide
                </a>
              </li>
              <li>
                <Link to="/contact" className="text-[#DBEAFE] hover:text-[#60A5FA] transition-colors">
                  Help & Assistance
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93C5FD]">
          <p>
            &copy; {new Date().getFullYear()} Stadium Booking Platform. All rights reserved. Real venues, real time.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-[#BFDBFE] hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-[#BFDBFE] hover:text-white transition-colors">
              Contact
            </Link>
            <Link to="/stadiums" className="text-[#BFDBFE] hover:text-white transition-colors">
              Stadiums
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
