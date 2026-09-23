import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle2, Image as ImageIcon, Camera } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import Button from '../ui/Button';

export default function ReviewModal({ booking, isOpen, onClose, onReviewSuccess }) {
  if (!isOpen || !booking) return null;

  const stadiumId = booking.stadium?._id || booking.stadium;
  const stadiumName = booking.stadium?.name || 'Stadium';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        stadium: stadiumId,
        booking: booking._id,
        rating,
        comment: comment.trim() || undefined,
        photo: photo.trim() || undefined
      };

      const res = await reviewAPI.submit(payload);

      if (res.success) {
        if (onReviewSuccess) onReviewSuccess(res.review);
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Failed to submit review. You may have already reviewed this booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
              Verified Player Feedback
            </span>
            <h2 className="text-base font-black text-[#172554] tracking-tight mt-1">
              Review {stadiumName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Star Rating (Required) */}
          <div className="text-center space-y-2 py-3 bg-[#F8FAFC] rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              How was your experience? (Required) *
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-115 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-600 block">
              {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional venue' :
               rating === 4 ? '⭐⭐⭐⭐ Great experience' :
               rating === 3 ? '⭐⭐⭐ Satisfactory' :
               rating === 2 ? '⭐⭐ Needs improvement' : '⭐ Poor experience'}
            </span>
          </div>

          {/* Optional Review Comment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                What did you like? (Optional)
              </label>
              <span className="text-[10px] text-slate-400">{comment.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Share details about the pitch condition, lighting, changing rooms, or overall staff experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Optional Photo URL / Image */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Photo URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                className="w-full p-2.5 pl-8 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
            {photo && (
              <div className="mt-2 rounded-lg overflow-hidden h-24 border border-slate-200">
                <img
                  src={photo}
                  alt="Review preview"
                  className="w-full h-full object-cover"
                  onError={() => setError('Invalid image URL format.')}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              icon={CheckCircle2}
              className="shadow-sm"
            >
              Submit Review
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
