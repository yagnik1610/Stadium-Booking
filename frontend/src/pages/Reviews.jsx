import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, Calendar, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { reviewAPI } from '../services/api';
import Button from '../components/ui/Button';

export default function Reviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewAPI.getMyReviews();
      if (res.success && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching my reviews:', err);
      setError(err.message || 'Failed to retrieve your reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(id);
    try {
      const res = await reviewAPI.delete(id);
      if (res.success) {
        setReviews(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Could not delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-blue-200/50">
            Player Feedback
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] tracking-tight mt-1">
            My Venue Reviews
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ratings and comments you have posted for completed match sessions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800">Failed to load reviews</h3>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <Star className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#172554]">No reviews submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you complete a booked sports match or practice session at any venue, you can share your feedback and ratings here.
          </p>
          <Button size="sm" variant="primary" onClick={() => navigate('/dashboard/bookings')} className="mt-2">
            View My Bookings
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-[#172554]">
                    {r.stadium?.name || 'Stadium Venue'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reviewed on {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={deletingId === r._id}
                  onClick={() => handleDelete(r._id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-600 ml-1">
                  {r.rating} / 5 Stars
                </span>
              </div>

              {/* Optional Comment */}
              {r.comment && (
                <p className="text-xs text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 italic">
                  "{r.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
