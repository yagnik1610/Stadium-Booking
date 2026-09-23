import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, Heart, ArrowRight, Star, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { favoriteAPI } from '../services/api';
import IMAGES from '../config/images';

export default function StadiumCard({ stadium, fallbackIndex = 0, onFavoriteChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [isFavorited, setIsFavorited] = useState(Boolean(stadium.isFavorited));
  const [favLoading, setFavLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    (stadium.images && stadium.images.length > 0 && stadium.images[0]) ||
    stadium.image ||
    IMAGES.STADIUM_FALLBACKS[fallbackIndex % IMAGES.STADIUM_FALLBACKS.length]
  );

  useEffect(() => {
    setIsFavorited(Boolean(stadium.isFavorited));
  }, [stadium.isFavorited]);

  useEffect(() => {
    const freshSrc = (stadium.images && stadium.images.length > 0 && stadium.images[0]) ||
      stadium.image ||
      IMAGES.STADIUM_FALLBACKS[fallbackIndex % IMAGES.STADIUM_FALLBACKS.length];
    setImgSrc(freshSrc);
  }, [stadium.images, stadium.image, fallbackIndex]);

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toastInfo?.('Please log in to save your favorite stadiums.');
      navigate('/login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorited) {
        await favoriteAPI.remove(stadium._id);
        setIsFavorited(false);
        toastSuccess?.('Removed from favorites.');
        onFavoriteChange?.(stadium._id, false);
      } else {
        await favoriteAPI.add({ stadium: stadium._id });
        setIsFavorited(true);
        toastSuccess?.('Added to favorites.');
        onFavoriteChange?.(stadium._id, true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      toastError?.(err.message || 'Unable to update favorite. Please try again.');
    } finally {
      setFavLoading(false);
    }
  };

  const sportsList = stadium.sports || [];
  const facilitiesList = stadium.facilities || stadium.amenities || [];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group h-full">
      
      {/* Visual Image Container: ~16:10 aspect ratio occupying ~45% of card visually */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={stadium.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            const fallback = IMAGES.STADIUM_FALLBACKS[fallbackIndex % IMAGES.STADIUM_FALLBACKS.length];
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
        />

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          disabled={favLoading}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors shadow-xs ${
            isFavorited
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-slate-600 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Availability Badge */}
        {stadium.isActive !== false && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-emerald-700 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Available
            </span>
          </div>
        )}

        {/* Hourly Price Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#172554]/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
          ₹{stadium.pricePerHour ? stadium.pricePerHour.toLocaleString('en-IN') : '0'} <span className="text-slate-200 font-normal">/ hr</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Sports Categories & Rating (only if provided by backend data) */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap gap-1.5">
              {sportsList.slice(0, 2).map((sport, idx) => (
                <span
                  key={idx}
                  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]"
                >
                  {sport}
                </span>
              ))}
              {sportsList.length > 2 && (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  +{sportsList.length - 2}
                </span>
              )}
            </div>

            {/* Render rating ONLY if actually returned by backend */}
            {stadium.rating && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{stadium.rating}</span>
              </div>
            )}
          </div>

          {/* Stadium Name */}
          <h3 className="text-lg font-bold text-[#172554] group-hover:text-[#2563EB] transition-colors line-clamp-1">
            <Link to={`/stadiums/${stadium._id}`}>
              {stadium.name}
            </Link>
          </h3>

          {/* Location & Capacity */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-1 truncate pr-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{stadium.city || stadium.location || 'Location on request'}</span>
            </div>
            {stadium.capacity && (
              <div className="flex items-center gap-1 flex-shrink-0 font-medium text-slate-600">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{stadium.capacity.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Facilities Preview */}
          {facilitiesList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {facilitiesList.slice(0, 3).map((facility, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {facility}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Slot reservation
          </span>
          <Link
            to={`/stadiums/${stadium._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            View Stadium <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
