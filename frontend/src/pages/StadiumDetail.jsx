import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Users, Clock, ShieldCheck, CheckCircle2, 
  Calendar, AlertCircle, ArrowLeft, Heart, Check, Star,
  ShieldAlert, FileText, Share2, Sparkles, AlertTriangle,
  Maximize2, Car, Compass, ChevronDown, ChevronUp, Plus, Minus
} from 'lucide-react';
import { stadiumAPI, favoriteAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IMAGES from '../config/images';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ErrorState from '../components/ui/ErrorState';
import DynamicBookingModal from '../components/booking/DynamicBookingModal';
import ReviewModal from '../components/review/ReviewModal';

export default function StadiumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stadium, setStadium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Sport Filter for sport-specific details
  const [selectedSport, setSelectedSport] = useState(null);

  // Favorite State
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Reviews & Eligibility State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [eligibleBooking, setEligibleBooking] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Accordions State
  const [isSafetyOpen, setIsSafetyOpen] = useState(true); // Open by default for clarity
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Dynamic Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Active Hero Image for Gallery Swapping
  const [activeHeroImage, setActiveHeroImage] = useState(null);

  // Fetch Stadium Details
  useEffect(() => {
    const fetchStadium = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await stadiumAPI.getById(id);
        if (res.success && res.stadium) {
          setStadium(res.stadium);
          if (res.stadium.sports && res.stadium.sports.length > 0) {
            setSelectedSport(res.stadium.sports[0]);
          }
        } else if (res.data) {
          setStadium(res.data);
          if (res.data.sports && res.data.sports.length > 0) {
            setSelectedSport(res.data.sports[0]);
          }
        } else {
          setError('Stadium not found or inactive.');
        }
      } catch (err) {
        console.error('Error fetching stadium:', err);
        setError(err.message || 'Failed to load stadium details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStadium();
  }, [id]);

  // Check Favorite Status
  useEffect(() => {
    if (!user || !id) return;
    let isMounted = true;
    const checkFav = async () => {
      try {
        const res = await favoriteAPI.check(id);
        if (isMounted && res.success) {
          setIsFavorited(!!res.isFavorite);
        }
      } catch (err) {
        // Silent failure
      }
    };
    checkFav();
    return () => { isMounted = false; };
  }, [user, id]);

  // Fetch Stadium Reviews
  const fetchReviews = async () => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const res = await reviewAPI.getByStadium(id);
      if (res.success && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
      }
    } catch (err) {
      // Silent failure
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  // Check Review Eligibility (Logged in user has a completed unreviewed booking)
  useEffect(() => {
    if (!user || !id) return;
    let isMounted = true;
    const checkEligibility = async () => {
      try {
        const res = await reviewAPI.getEligibleBookings(id);
        if (isMounted && res.success && res.isEligible && res.eligibleBookings?.length > 0) {
          setEligibleBooking(res.eligibleBookings[0]);
        } else if (isMounted) {
          setEligibleBooking(null);
        }
      } catch (err) {
        // Silent failure
      }
    };
    checkEligibility();
    return () => { isMounted = false; };
  }, [user, id]);

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!user) {
      navigate(`/login?redirect=/stadiums/${id}`);
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoriteAPI.remove(id);
        setIsFavorited(false);
      } else {
        await favoriteAPI.add(id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  // Booking CTA Handler: redirects guest to login or opens modal for logged-in user
  const handleBookingCTA = () => {
    if (!user) {
      navigate(`/login?redirect=/stadiums/${id}`);
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F7FF]/50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-[#172554]">Loading stadium details...</p>
        </div>
      </div>
    );
  }

  if (error || !stadium) {
    return (
      <div className="min-h-screen bg-[#F0F7FF]/50 py-16 max-w-3xl mx-auto px-4">
        <ErrorState
          title="Stadium Unavailable"
          message={error || 'The requested stadium could not be loaded.'}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-6 text-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/stadiums')} icon={ArrowLeft}>
            Back to Stadiums
          </Button>
        </div>
      </div>
    );
  }

  // Derive high resolution image
  const displayImage =
    activeHeroImage ||
    stadium.image ||
    (stadium.images && stadium.images[0]) ||
    IMAGES.STADIUM_FALLBACKS[0];

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : null;

  // Selected sport configuration
  const currentSportConf = stadium.sportConfigurations?.find(
    sc => sc.sport.toLowerCase() === (selectedSport || '').toLowerCase()
  );

  return (
    <div className={user ? "space-y-6" : "min-h-screen bg-[#F0F7FF]/40 py-8"}>
      <div className={user ? "space-y-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"}>
        
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/stadiums')}
            icon={ArrowLeft}
          >
            Back to Stadiums
          </Button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isFavorited ? 'Saved in Favorites' : 'Add to Favorites'}</span>
            </button>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Verified Venue
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PART 12 — STADIUM HERO (Top banner, clean aspect ratio, no stretch)       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Visual Photo */}
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[360px] bg-slate-100">
              <img
                src={displayImage}
                alt={stadium.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.src = IMAGES.STADIUM_FALLBACKS[0];
                }}
              />
              <div className="absolute top-4 left-4 bg-white/95 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#172554] shadow-xs border border-slate-100">
                ₹{stadium.pricePerHour ? stadium.pricePerHour.toLocaleString('en-IN') : '0'} / hour
              </div>
            </div>

            {/* Stadium Key Header & Actions */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Sports pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {stadium.sports?.map((sport, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]"
                    >
                      {sport}
                    </span>
                  ))}
                  {avgRating && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mb-2">
                  {stadium.name}
                </h1>

                <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-4">
                  <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>{stadium.address || `${stadium.city}, ${stadium.state ? stadium.state + ', ' : ''}${stadium.country || 'India'}`}</span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed mb-6">
                  {stadium.description}
                </p>
              </div>

              {/* Quick Venue Specs & Book Button */}
              <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F0F7FF] p-3 rounded-xl border border-[#DBEAFE]">
                    <div className="flex items-center gap-1.5 text-[#2563EB] font-bold mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Operating Hours</span>
                    </div>
                    <span className="text-[#172554] font-extrabold">
                      {stadium.openingTime} – {stadium.closingTime}
                    </span>
                  </div>

                  <div className="bg-[#F0F7FF] p-3 rounded-xl border border-[#DBEAFE]">
                    <div className="flex items-center gap-1.5 text-[#2563EB] font-bold mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Capacity</span>
                    </div>
                    <span className="text-[#172554] font-extrabold">
                      {stadium.capacity ? `${stadium.capacity.toLocaleString()} Players` : 'Standard'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold shadow-md shadow-blue-500/20"
                  onClick={handleBookingCTA}
                  icon={Calendar}
                >
                  Book This Stadium Now
                </Button>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* QUICK FACTS GRID (Player Capacity, Audience, Dimensions, Parking, etc.)   */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              QUICK FACTS & VENUE SPECIFICATIONS
            </h2>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              {stadium.facilityType || 'Standard Arena'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Player Capacity (Clean numeric card - Section 20/66) */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-[10px] font-black uppercase tracking-wider">Player Capacity</span>
              </div>
              <div>
                <span className="text-base font-black text-[#172554] block">
                  {stadium.playerCapacity || stadium.capacity || 22}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Max Players on Turf</span>
              </div>
            </div>

            {/* 2. Audience Capacity (Section 19/66) */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Audience Capacity</span>
              </div>
              <div>
                <span className="text-base font-black text-[#172554] block">
                  {stadium.audienceAllowed === false ? '0' : (stadium.audienceCapacity ? stadium.audienceCapacity.toLocaleString() : 'Open')}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Spectator Seats</span>
              </div>
            </div>

            {/* 3. Audience Allowed / Pass (Section 22/23) */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Audience Pass</span>
              </div>
              <div>
                <span className={`text-xs font-black block mt-0.5 ${
                  stadium.audienceAllowed === false 
                    ? 'text-rose-600' 
                    : (stadium.audiencePassRequired ? 'text-amber-700' : 'text-emerald-700')
                }`}>
                  {stadium.audienceAllowed === false 
                    ? 'Not Allowed' 
                    : (stadium.audiencePassRequired ? 'Pass Required' : 'Allowed')}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Access Policy</span>
              </div>
            </div>

            {/* 4. Dimensions */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-[10px] font-black uppercase tracking-wider">Dimensions</span>
              </div>
              <div>
                <span className="text-xs font-black text-[#172554] block mt-0.5">
                  {stadium.dimensions?.length && stadium.dimensions?.width 
                    ? `${stadium.dimensions.length}m × ${stadium.dimensions.width}m` 
                    : 'Standard Pitch'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Playing Surface</span>
              </div>
            </div>

            {/* 5. Parking */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Parking</span>
              </div>
              <div>
                <span className="text-xs font-black text-[#172554] block mt-0.5">
                  {stadium.parking?.available 
                    ? (stadium.parking.capacity ? `${stadium.parking.capacity} Spots` : 'Available') 
                    : 'None'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Vehicle Capacity</span>
              </div>
            </div>

            {/* 6. Duration */}
            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10px] font-black uppercase tracking-wider">Duration</span>
              </div>
              <div>
                <span className="text-xs font-black text-[#172554] block mt-0.5">
                  {stadium.minDuration || 1} to {stadium.maxDuration || 4} Hrs
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Slot Window</span>
              </div>
            </div>
          </div>

          {/* AUDIENCE / SPECTATOR INFORMATION (Section 18 & 23) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#172554]">Audience Policy:</span>
              <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                stadium.audienceAllowed === false 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stadium.audienceAllowed === false ? 'Audience Not Allowed' : 'Audience Allowed'}
              </span>
              {stadium.audienceAllowed !== false && stadium.audiencePassRequired && (
                <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px]">
                  Audience Pass Required
                </span>
              )}
            </div>
            {stadium.audienceRules && (
              <span className="text-slate-600 italic">
                Notice: {stadium.audienceRules}
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPORT-SPECIFIC SELECTOR & DETAILS                                         */}
        {/* ========================================================================= */}
        {stadium.sports && stadium.sports.length > 1 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
                Configured Sports & Rules
              </span>
              <h2 className="text-base font-black text-[#172554] tracking-tight mt-0.5">
                Sport-Specific Guidelines
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {stadium.sports.map((sport) => {
                const isSelected = selectedSport?.toLowerCase() === sport.toLowerCase();
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {sport}
                  </button>
                );
              })}
            </div>

            {currentSportConf && (
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172554]">
                    {currentSportConf.sport} Specific Requirements:
                  </span>
                  <span className="text-slate-500">
                    Players: {currentSportConf.minPlayers || 2} - {currentSportConf.maxPlayers || stadium.capacity}
                  </span>
                </div>
                {currentSportConf.bookingInstructions && (
                  <p className="text-slate-600 leading-relaxed">
                    {currentSportConf.bookingInstructions}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHOTO GALLERY SECTION                                                     */}
        {/* ========================================================================= */}
        {stadium.images && stadium.images.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Venue Photo Gallery ({stadium.images.length} Photos)
              </h2>
              <span className="text-[11px] font-bold text-[#2563EB]">
                Click thumbnail to view in hero
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {stadium.images.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveHeroImage(imgUrl)}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all group bg-slate-100 ${
                    displayImage === imgUrl ? 'border-[#2563EB] ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${stadium.name} Gallery ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = IMAGES.STADIUM_FALLBACKS[i % IMAGES.STADIUM_FALLBACKS.length];
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FACILITIES & AMENITIES GRID                                               */}
        {/* ========================================================================= */}
        {stadium.facilities && stadium.facilities.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              Verified Venue Facilities & Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stadium.facilities.map((fac, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#334155] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SAFETY REQUIREMENTS ACCORDION & RESERVATION POLICY                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Safety Requirements Accordion (PART 22 - MUST ACTUALLY OPEN) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-black text-[#172554]">Safety Requirements</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title={isSafetyOpen ? 'Collapse safety section' : 'Expand safety section'}
              >
                {isSafetyOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {isSafetyOpen && (
              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                {(stadium.safetyRules && stadium.safetyRules.length > 0 ? stadium.safetyRules : [
                  'Appropriate sports gear and non-marking soles required on playing turf.',
                  'On-site first aid kit and supervisor station available 24/7.',
                  'Arrive 15 minutes before your scheduled slot for venue administrative check-in.'
                ]).map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terms & Conditions Accordion */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-black text-[#172554]">Terms & Conditions</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsOpen(!isTermsOpen)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title={isTermsOpen ? 'Collapse terms section' : 'Expand terms section'}
              >
                {isTermsOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {isTermsOpen && (
              <div className="text-xs text-slate-600 space-y-2 whitespace-pre-line leading-relaxed pt-1">
                {stadium.termsAndConditions || 
                  `• Administrative Confirmation: Submissions enter pending review state.\n• Cancellation: Free cancellation up to 24 hours prior to session.\n• Weather Contingency: Rescheduling available for severe weather.\n• Cleanliness: Please dispose of waste appropriately.`}
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* STADIUM REVIEWS SECTION & REVIEW ELIGIBILITY BUTTON                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                Verified Reviews
              </span>
              <h2 className="text-xl font-black text-[#172554] tracking-tight mt-1">
                Player Reviews ({reviews.length})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {avgRating && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-black text-amber-800">{avgRating} / 5</span>
                </div>
              )}

              {/* Eligible Booking Review CTA */}
              {eligibleBooking && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(true)}
                  icon={Star}
                >
                  Write Review
                </Button>
              )}
            </div>
          </div>

          {loadingReviews ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading verified reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-dashed border-slate-200">
              <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#172554]">No reviews yet for this venue</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Book a slot and complete your match session to share your feedback.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                        {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <span className="text-xs font-bold text-[#172554]">
                        {rev.user?.name || 'Verified Athlete'}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  )}

                  {rev.photo && (
                    <div className="mt-2 rounded-lg overflow-hidden max-h-36 border border-slate-200">
                      <img
                        src={rev.photo}
                        alt="Player review photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1">
                    {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Dynamic Game-Specific Booking Wizard Modal */}
      <DynamicBookingModal
        stadium={stadium}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={() => {
          setIsBookingModalOpen(false);
        }}
      />

      {/* Write Review Modal for Eligible Bookings */}
      {eligibleBooking && (
        <ReviewModal
          booking={eligibleBooking}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewSuccess={() => {
            fetchReviews();
            setEligibleBooking(null);
          }}
        />
      )}

    </div>
  );
}
