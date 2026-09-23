import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, ShieldCheck, Clock, 
  CreditCard, CheckCircle, ArrowRight, 
  Calendar, ChevronRight, Trophy, UserPlus
} from 'lucide-react';
import { stadiumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IMAGES from '../config/images';
import StadiumCard from '../components/StadiumCard';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import { StadiumCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSport, setSelectedSport] = useState('');

  // Featured Stadiums from Backend
  const [stadiums, setStadiums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedStadiums = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await stadiumAPI.getAll({ limit: 6 });
        let data = [];
        if (res.success && Array.isArray(res.stadiums)) {
          data = res.stadiums;
        } else if (res.success && Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res)) {
          data = res;
        } else if (res.data && Array.isArray(res.data.stadiums)) {
          data = res.data.stadiums;
        }
        setStadiums(data);
      } catch (err) {
        console.error('Error fetching featured stadiums:', err);
        setError(err.message || 'Unable to connect to stadium database.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedStadiums();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedLocation.trim()) params.set('city', selectedLocation.trim());
    if (selectedSport.trim()) params.set('sport', selectedSport.trim());

    const queryString = params.toString();
    navigate(queryString ? `/stadiums?${queryString}` : '/stadiums');
  };

  // Real, individual sports and facility types (NO generic indoor/outdoor)
  const sportsCatalog = [
    { 
      name: 'Cricket', 
      facilityType: 'Cricket Stadium & Box Turf', 
      image: IMAGES.SPORTS.CRICKET,
      query: 'Cricket'
    },
    { 
      name: 'Football', 
      facilityType: 'Football Stadium & Turf', 
      image: IMAGES.SPORTS.FOOTBALL,
      query: 'Football'
    },
    { 
      name: 'Basketball', 
      facilityType: 'Indoor Hardwood & Court', 
      image: IMAGES.SPORTS.BASKETBALL,
      query: 'Basketball'
    },
    { 
      name: 'Tennis', 
      facilityType: 'Championship Tennis Court', 
      image: IMAGES.SPORTS.TENNIS,
      query: 'Tennis'
    },
    { 
      name: 'Badminton', 
      facilityType: 'Wooden & Synthetic Court', 
      image: IMAGES.SPORTS.BADMINTON,
      query: 'Badminton'
    },
    { 
      name: 'Volleyball', 
      facilityType: 'Volleyball Arena & Court', 
      image: IMAGES.SPORTS.VOLLEYBALL,
      query: 'Volleyball'
    },
    { 
      name: 'Futsal', 
      facilityType: 'Enclosed Futsal Turf', 
      image: IMAGES.SPORTS.FUTSAL,
      query: 'Futsal'
    },
    { 
      name: 'Box Cricket', 
      facilityType: 'Floodlit Box Cricket Turf', 
      image: IMAGES.SPORTS.BOX_CRICKET,
      query: 'Box Cricket'
    }
  ];

  // Calculate actual venue counts in MongoDB for each sport
  const getSportVenueCount = (sportQuery) => {
    if (!stadiums || stadiums.length === 0) return 0;
    const queryLower = sportQuery.toLowerCase();
    return stadiums.filter(s => 
      s.sports && s.sports.some(sp => sp.toLowerCase().includes(queryLower))
    ).length;
  };

  const features = [
    {
      icon: ShieldCheck,
      title: 'Verified Venues',
      description: 'Every sports facility is physically verified for surface condition, floodlights, and player amenities.'
    },
    {
      icon: Clock,
      title: 'Real-Time Availability',
      description: 'Check up-to-the-minute open slot schedules and book your desired hours instantly without manual calls.'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Transparent hourly pricing with protected transactions, clear invoices, and immediate reservation confirmation.'
    },
    {
      icon: CheckCircle,
      title: 'Simple Booking',
      description: 'Seamless 3-step checkout experience designed for athletes, corporate teams, and weekend sports clubs.'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Find a Stadium',
      desc: 'Browse verified sports grounds, turfs, and courts by sport, location, or amenities.'
    },
    {
      step: '02',
      title: 'Choose Date & Time',
      desc: 'Select your preferred game date and inspect live open 1-hour playing slots.'
    },
    {
      step: '03',
      title: 'Confirm Your Booking',
      desc: 'Lock in your slot with secure instant reservation and digital access pass.'
    },
    {
      step: '04',
      title: 'Play Your Game',
      desc: 'Arrive at the stadium on matchday ready to play with your team.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#334155]">
      
      {/* 1. HERO SECTION: Light, Bright & Connected */}
      <section className="bg-gradient-to-b from-[#F0F7FF] via-[#EFF6FF]/60 to-white py-12 md:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT COLUMN: Clean Content */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                BOOK YOUR GAME
              </div>

              {/* Large Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#172554] leading-[1.15] mb-5">
                Find the Perfect Stadium <br className="hidden sm:inline" />
                <span className="text-[#2563EB]">for Your Next Game</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed mb-8 max-w-xl">
                Discover quality sports venues, check real-time availability, and reserve your preferred playing time in just a few clicks.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3.5 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/stadiums')}
                  icon={ArrowRight}
                >
                  Explore Stadiums
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    if (user) {
                      navigate('/dashboard/bookings');
                    } else {
                      navigate('/login?redirect=/dashboard/bookings');
                    }
                  }}
                  icon={Calendar}
                >
                  View My Bookings
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 pt-6 border-t border-[#E2E8F0] w-full flex flex-wrap items-center gap-6 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Instant Confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Verified Athletic Venues</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Slot Booking</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: High-Quality Recognizable Stadium Photograph */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E2E8F0] bg-white aspect-[16/11]">
                <img
                  src={IMAGES.HERO}
                  alt="Real professional stadium pitch and arena"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = IMAGES.STADIUM_FALLBACKS[0];
                  }}
                />
                
                {/* Floating Venue Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs rounded-xl p-3.5 shadow-md border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
                      Live Verified Venues
                    </span>
                    <h2 className="text-sm font-bold text-[#172554]">
                      Pitches, Box Turfs & Indoor Courts
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/stadiums')}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                  >
                    Browse Venues
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SEARCH BOX: Real Backend Search Integration */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-16 relative z-10 w-full">
        <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Field 1: Venue Name / Keyword */}
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Stadium / Venue
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Stadium name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Location */}
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Mumbai, Ahmedabad..."
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Field 3: Sport */}
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white transition-colors"
              >
                <option value="">All Sports</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Badminton">Badminton</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Futsal">Futsal</option>
                <option value="Box Cricket">Box Cricket</option>
              </select>
            </div>

            {/* Submit CTA */}
            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                className="py-2.5"
                icon={Search}
              >
                Search Stadiums
              </Button>
            </div>

          </form>
        </div>
      </div>

      {/* 3. SPORTS SECTION: Actual Individual Sports & Facility Types */}
      <section className="py-12 bg-[#F0F7FF] border-y border-[#E2E8F0] w-full mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Sport Categories"
            title="Choose Your Sport"
            subtitle="Explore dedicated pitches, professional courts, and multi-sport complexes tailored for your game."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sportsCatalog.map((sport) => {
              const venueCount = getSportVenueCount(sport.query);
              return (
                <div
                  key={sport.name}
                  onClick={() => navigate(`/stadiums?sport=${encodeURIComponent(sport.name)}`)}
                  className="group relative bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
                >
                  {/* Visual Image: ~16:10 */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={sport.image}
                      alt={sport.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-85" />
                    
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                        {sport.facilityType}
                      </span>
                      <h3 className="text-xl font-black leading-tight text-white">
                        {sport.name}
                      </h3>
                    </div>
                  </div>

                  {/* Footer Bar with Real Venue Count */}
                  <div className="p-3.5 flex items-center justify-between bg-white border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">
                      {venueCount > 0 
                        ? `${venueCount} ${venueCount === 1 ? 'Venue' : 'Venues'} in DB` 
                        : 'Discover Venues'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. POPULAR / FEATURED STADIUMS FROM REAL MONGODB */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full mb-2 inline-block border border-[#DBEAFE]">
              Live From Database
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight">
              Popular Stadiums & Turfs
            </h2>
            <p className="text-sm text-[#475569] mt-1">
              Real sports grounds available for instant slot booking.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/stadiums')}
            icon={ArrowRight}
          >
            View all stadiums
          </Button>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <StadiumCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState
            title="Unable to load stadiums"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && stadiums.length === 0 && (
          <EmptyState
            title="No stadiums available yet"
            description="There are currently no active stadiums in the database. Please check back shortly or explore available categories."
            actionLabel="Browse All Venues"
            onAction={() => navigate('/stadiums')}
          />
        )}

        {/* Live Stadium Grid */}
        {!isLoading && !error && stadiums.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stadiums.slice(0, 6).map((stadium, index) => (
              <StadiumCard
                key={stadium._id || index}
                stadium={stadium}
                fallbackIndex={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. HOW IT WORKS: 4 Steps */}
      <section id="how-it-works" className="py-20 bg-[#F0F7FF] border-y border-[#E2E8F0] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Simple Workflow"
            title="How It Works"
            subtitle="From searching to stepping onto the pitch, reserve your venue in four simple steps."
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map((item) => (
              <div 
                key={item.step} 
                className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col items-start text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2563EB] text-white font-black text-sm flex items-center justify-center mb-4 shadow-xs">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-[#172554] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE US: Verified Platform Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeading
          badge="Platform Features"
          title="Everything You Need to Book Your Game"
          subtitle="Engineered for athletes, teams, and tournament organizers seeking reliable, transparent venue access."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs hover:border-[#DBEAFE] hover:bg-[#F0F7FF]/50 transition-colors flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#172554] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CALL TO ACTION / CREATE ACCOUNT SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-10">
        <div className="bg-[#EFF6FF] rounded-2xl p-8 sm:p-14 text-center flex flex-col items-center border border-[#DBEAFE] shadow-xs">
          <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-white px-3.5 py-1 rounded-full mb-4 border border-[#DBEAFE] shadow-2xs">
            Start Playing Today
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight mb-4">
            Ready to Book Your Next Game?
          </h2>
          <p className="text-base sm:text-lg text-[#475569] max-w-xl mb-8 leading-relaxed">
            Join thousands of sports enthusiasts. Create your free account to access live venue schedules, book cricket turfs, and reserve football grounds instantly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/stadiums')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#172554] font-bold text-sm border border-[#E2E8F0] hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Explore Stadiums
                  <ArrowRight className="w-4 h-4 text-[#2563EB]" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/stadiums')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] transition-colors shadow-xs"
                >
                  Explore Stadiums
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/bookings')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#172554] font-bold text-sm border border-[#E2E8F0] hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  My Bookings
                </button>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
