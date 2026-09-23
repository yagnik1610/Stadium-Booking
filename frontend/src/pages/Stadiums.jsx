import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Search, Filter, RotateCcw, Building2, Trophy, Globe, Compass, Star, ArrowRight } from 'lucide-react';
import { stadiumAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StadiumCard from '../components/StadiumCard';
import { StadiumCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';

export default function Stadiums() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // All active stadiums fetched from MongoDB backend
  const [allStadiums, setAllStadiums] = useState([]);
  const [userFavoriteIds, setUserFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'All');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || 'All');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All');
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');

  // Fetch all active stadiums & favorites on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stadiumAPI.getAll();
      let stadiumsList = [];
      if (res.success && Array.isArray(res.stadiums)) {
        stadiumsList = res.stadiums.filter(s => s.isActive !== false);
      } else if (Array.isArray(res)) {
        stadiumsList = res.filter(s => s.isActive !== false);
      }
      setAllStadiums(stadiumsList);

      if (user) {
        try {
          const favRes = await favoriteAPI.getMyFavorites();
          if (favRes.success && Array.isArray(favRes.favorites)) {
            const favIds = new Set(
              favRes.favorites.map(f => (typeof f.stadium === 'object' ? f.stadium?._id : f.stadium))
            );
            setUserFavoriteIds(favIds);
          }
        } catch (favErr) {
          // Non-blocking favorite check
        }
      }
    } catch (err) {
      console.error('Failed to load stadiums:', err);
      setError(err.message || 'Unable to connect to stadiums database. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive unique sports data-driven from MongoDB stadiums
  const availableSports = useMemo(() => {
    const sportsSet = new Set();
    allStadiums.forEach(s => {
      if (Array.isArray(s.sports)) {
        s.sports.forEach(sp => {
          if (sp && sp.trim()) sportsSet.add(sp.trim());
        });
      }
    });
    return ['All', ...Array.from(sportsSet).sort()];
  }, [allStadiums]);

  // Derive unique countries from database
  const availableCountries = useMemo(() => {
    const set = new Set();
    allStadiums.forEach(s => {
      if (s.country && s.country.trim()) set.add(s.country.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [allStadiums]);

  // Derive dependent states based on selected country
  const availableStates = useMemo(() => {
    const set = new Set();
    allStadiums.forEach(s => {
      const countryMatches = selectedCountry === 'All' || s.country?.toLowerCase() === selectedCountry.toLowerCase();
      if (countryMatches && s.state && s.state.trim()) {
        set.add(s.state.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [allStadiums, selectedCountry]);

  // Derive dependent cities based on selected state/country
  const availableCities = useMemo(() => {
    const set = new Set();
    allStadiums.forEach(s => {
      const countryMatches = selectedCountry === 'All' || s.country?.toLowerCase() === selectedCountry.toLowerCase();
      const stateMatches = selectedState === 'All' || s.state?.toLowerCase() === selectedState.toLowerCase();
      if (countryMatches && stateMatches && s.city && s.city.trim()) {
        set.add(s.city.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [allStadiums, selectedCountry, selectedState]);

  // Dependent Filter Handlers
  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry);
    setSelectedState('All');
    setSelectedCity('All');
  };

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSelectedCity('All');
  };

  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
  };

  const handleSportChange = (newSport) => {
    setSelectedSport(newSport);
  };

  const handleClearFilters = () => {
    setSelectedCountry('All');
    setSelectedState('All');
    setSelectedCity('All');
    setSelectedSport('All');
    setSearchQuery('');
  };

  // Sync state to URL params cleanly
  useEffect(() => {
    const params = {};
    if (selectedCountry !== 'All') params.country = selectedCountry;
    if (selectedState !== 'All') params.state = selectedState;
    if (selectedCity !== 'All') params.city = selectedCity;
    if (selectedSport !== 'All') params.sport = selectedSport;
    if (searchQuery.trim()) params.q = searchQuery.trim();
    setSearchParams(params, { replace: true });
  }, [selectedCountry, selectedState, selectedCity, selectedSport, searchQuery, setSearchParams]);

  // Filter stadiums
  const filteredStadiums = useMemo(() => {
    return allStadiums.filter(stadium => {
      if (selectedCountry !== 'All' && stadium.country?.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedState !== 'All' && stadium.state?.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      if (selectedCity !== 'All' && stadium.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedSport !== 'All') {
        const hasSport = Array.isArray(stadium.sports) && stadium.sports.some(
          sp => sp.toLowerCase() === selectedSport.toLowerCase()
        );
        if (!hasSport) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = stadium.name?.toLowerCase().includes(q);
        const matchesCity = stadium.city?.toLowerCase().includes(q);
        const matchesSport = Array.isArray(stadium.sports) && stadium.sports.some(sp => sp.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesSport) return false;
      }
      return true;
    });
  }, [allStadiums, selectedCountry, selectedState, selectedCity, selectedSport, searchQuery]);

  const isFiltered = Boolean(
    (selectedCountry && selectedCountry !== 'All') ||
    (selectedState && selectedState !== 'All') ||
    (selectedCity && selectedCity !== 'All') ||
    (selectedSport && selectedSport !== 'All') ||
    searchQuery.trim()
  );

  return (
    <div className="space-y-6">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-blue-200/50">
            DISCOVER ARENAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
            Stadiums & Sports Venues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Find the right venue for your game. Filter by sport, city, or venue name.
          </p>
        </div>

        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            icon={RotateCcw}
            className="text-slate-600 hover:text-red-600"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* 2. COMPACT DATA-DRIVEN SPORT SELECTOR (Section 30–32: 40-44px height, padding 12-16px, radius 8-10px, no giant boxes) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#2563EB]" />
            SELECT SPORT
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">
            {filteredStadiums.length} venue{filteredStadiums.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {/* Horizontal scrollable compact pill buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 pr-2">
          {availableSports.map(sport => {
            const isActive = selectedSport.toLowerCase() === sport.toLowerCase();
            return (
              <button
                key={sport}
                type="button"
                onClick={() => handleSportChange(sport)}
                className={`h-[40px] px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white text-[#334155] border border-[#E2E8F0] hover:border-blue-300 hover:bg-[#F0F7FF]'
                }`}
              >
                {sport === 'All' ? 'All Sports' : sport}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. COMPACT ONE-ROW FILTER CONTROLS (Section 33: Search + Country + State + City) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stadium name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-[42px] rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#172554] placeholder-slate-400 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Country */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 h-[42px] rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              {availableCountries.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Countries' : c}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 h-[42px] rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              {availableStates.map(st => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All States / Regions' : st}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3 h-[42px] rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#172554] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              {availableCities.map(ct => (
                <option key={ct} value={ct}>
                  {ct === 'All' ? 'All Cities' : ct}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 4. STADIUMS GRID (Section 35: 3 cards per row on desktop) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <StadiumCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load arenas"
          message={error}
          onRetry={loadData}
        />
      ) : filteredStadiums.length === 0 ? (
        <EmptyState
          title="No stadiums match your filters"
          message="Try selecting 'All Sports' or clearing your location filters to view more available sports arenas."
          actionText="Clear All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStadiums.map((stadium, idx) => (
            <StadiumCard
              key={stadium._id}
              stadium={{
                ...stadium,
                isFavorited: userFavoriteIds.has(stadium._id)
              }}
              fallbackIndex={idx}
              onFavoriteChange={(id, isFav) => {
                setUserFavoriteIds(prev => {
                  const updated = new Set(prev);
                  if (isFav) updated.add(id);
                  else updated.delete(id);
                  return updated;
                });
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
