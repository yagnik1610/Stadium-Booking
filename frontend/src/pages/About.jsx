import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Calendar, ShieldCheck, Clock, 
  MapPin, CheckCircle2, ArrowRight, Globe, Trophy, Users 
} from 'lucide-react';
import Button from '../components/ui/Button';
import IMAGES from '../config/images';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F7FF]/40 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section 1: Balanced 2-Column Hero (Desktop: Text + Image; Mobile: Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Text & Value Proposition (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3.5 py-1.5 rounded-full inline-block border border-[#DBEAFE] mb-3">
                About Stadium Booking
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172554] tracking-tight leading-tight">
                Streamlining Sports Venue Discovery & Turf Reservations
              </h1>
            </div>
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
              Stadium Booking is a dedicated full-stack platform built to connect sports enthusiasts, teams, and tournament organizers directly with verified stadiums, cricket grounds, football turfs, and athletic complexes worldwide.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-[#334155]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Multi-country venue catalog</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Real-time slot conflict prevention</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Instant automated confirmation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Zero fake pricing or hidden fees</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-4">
              <Button
                variant="primary"
                onClick={() => navigate('/stadiums')}
                icon={ArrowRight}
              >
                Browse All Venues
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/contact')}
              >
                Get in Touch
              </Button>
            </div>
          </div>

          {/* Right Column: Properly Centered, Responsive, Balanced Image (5 Cols) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-[#E2E8F0] bg-slate-100 group">
              <img
                src={IMAGES.HERO_STADIUM}
                alt="Professional sports stadium arena"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = IMAGES.STADIUM_FALLBACKS[0];
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172554]/80 via-transparent to-transparent flex items-end p-5">
                <div className="text-white">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#60A5FA] block">
                    Verified Facilities
                  </span>
                  <p className="text-sm font-bold text-white">
                    International & Regional Sports Arenas
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Core Platform Pillars */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3.5 py-1.5 rounded-full inline-block border border-[#DBEAFE] mb-2">
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight">
              Engineered for Reliable Sports Management
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#172554]">
                Multi-Country Discovery
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explore stadiums across India, the United Kingdom, Spain, the United States, Australia, and the UAE with hierarchical Country → State → City → Stadium filtering.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#172554]">
                Live Conflict Detection
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Slot schedules are calculated on the backend from each facility's operating hours, ensuring overlapping bookings and race conditions are blocked.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#172554]">
                Booking Lifecycle Tracking
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep complete track of upcoming, confirmed, and completed reservations with booking references, timestamps, cancelation options, and payment verification.
              </p>
            </div>

          </div>
        </div>

        {/* Section 3: Technical Integrity Guarantee */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-10 shadow-xs">
          <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-extrabold text-[#172554] tracking-tight">
              Direct MongoDB Truth & No Fake Data
            </h2>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#172554]">Database-Driven Venues:</strong> Every stadium, pricing entry, operating time, and sport category is stored and queried directly from MongoDB.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#172554]">Persistent User Favorites:</strong> Saved favorites are tied to the user's MongoDB profile, persisting across page refreshes and multi-device sessions.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#172554]">International Compatibility:</strong> The platform supports players with global calling codes and addresses, removing regional barriers to sports turf reservations.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
