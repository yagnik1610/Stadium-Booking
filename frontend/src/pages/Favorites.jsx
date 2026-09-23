import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SectionHeading from '../components/ui/SectionHeading';
import { StadiumCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import IMAGES from '../config/images';

export default function Favorites() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoriteAPI.getMyFavorites();
      if (res.success && Array.isArray(res.favorites)) {
        // Filter out any favorites where stadium document might be null
        const validFavorites = res.favorites.filter(f => f.stadium && typeof f.stadium === 'object');
        setFavorites(validFavorites);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
      setError(err.message || 'Unable to load your favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (stadiumId) => {
    setRemovingId(stadiumId);
    try {
      await favoriteAPI.remove(stadiumId);
      setFavorites(prev => prev.filter(f => f.stadium._id !== stadiumId));
      success('Stadium removed from favorites.');
    } catch (err) {
      console.error('Failed to remove favorite', err);
      toastError(err.message || 'Failed to remove from favorites.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Breadcrumb / Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full mb-2 inline-block border border-[#DBEAFE]">
              Personal Shortlist
            </span>
            <h1 className="text-3xl font-extrabold text-[#172554] tracking-tight flex items-center gap-2.5">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              Saved Stadiums & Turfs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quickly view and reserve your preferred sporting venues across all cities.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/stadiums')}
            icon={ArrowLeft}
          >
            Explore More Venues
          </Button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(idx => (
              <StadiumCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load favorites"
            message={error}
            onRetry={fetchFavorites}
          />
        ) : favorites.length === 0 ? (
          <EmptyState
            title="No favorite stadiums saved yet"
            description="You have not saved any stadiums to your favorites shortlist. Browse active arenas and click the heart icon on any venue card to save it."
            actionLabel="Explore Stadiums"
            onAction={() => navigate('/stadiums')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((fav, index) => {
              const stadium = fav.stadium;
              const imgSrc = (stadium.images && stadium.images.length > 0 && stadium.images[0]) ||
                stadium.image ||
                IMAGES.STADIUM_FALLBACKS[index % IMAGES.STADIUM_FALLBACKS.length];

              return (
                <div 
                  key={fav._id || stadium._id} 
                  className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={imgSrc}
                      alt={stadium.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = IMAGES.STADIUM_FALLBACKS[index % IMAGES.STADIUM_FALLBACKS.length];
                      }}
                    />

                    {/* Price Overlay */}
                    <div className="absolute bottom-3 left-3 bg-[#172554]/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                      ₹{stadium.pricePerHour ? stadium.pricePerHour.toLocaleString('en-IN') : '0'} <span className="text-slate-200 font-normal">/ hr</span>
                    </div>

                    {/* Quick Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(stadium._id)}
                      disabled={removingId === stadium._id}
                      aria-label="Remove from favorites"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/95 text-red-500 hover:bg-red-50 transition-colors shadow-xs"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Sports list */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {(stadium.sports || []).slice(0, 3).map((sport, i) => (
                          <span
                            key={i}
                            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-[#172554] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                        <Link to={`/stadiums/${stadium._id}`}>
                          {stadium.name}
                        </Link>
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{stadium.city || stadium.location || 'Location on request'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(stadium._id)}
                        disabled={removingId === stadium._id}
                        className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {removingId === stadium._id ? 'Removing...' : 'Remove'}
                      </button>

                      <Link
                        to={`/stadiums/${stadium._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-xs"
                      >
                        Book Slot <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
