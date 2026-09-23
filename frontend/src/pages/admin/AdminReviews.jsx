import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, stadiumAPI } from '../../services/api';
import AdminPagination from '../../components/admin/AdminPagination';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  Star,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Building2,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stadiums, setStadiums] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [stadiumFilter, setStadiumFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Dialog & Notification
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const res = await stadiumAPI.getAll({ limit: 100 });
        if (res && (res.stadiums || res.data?.stadiums)) {
          setStadiums(res.stadiums || res.data?.stadiums || []);
        }
      } catch (err) {
        console.error('Failed to load stadiums:', err);
      }
    };
    fetchStadiums();
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        rating: ratingFilter || undefined,
        stadium: stadiumFilter || undefined,
        search: search.trim() || undefined
      };
      const res = await adminAPI.getReviews(params);
      if (res && res.success) {
        const list = res.reviews || (Array.isArray(res.data) ? res.data : res.data?.reviews) || [];
        setReviews(list);
        setTotalPages(res.pagination?.totalPages || res.totalPages || 1);
        setTotalCount(res.total !== undefined ? res.total : (res.pagination?.total || list.length));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      showNotification('error', err.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  }, [currentPage, ratingFilter, stadiumFilter, search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchReviews();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchReviews]);

  const handleDelete = (review) => {
    setDialogConfig({
      isOpen: true,
      title: 'Delete Customer Review',
      message: `Are you sure you want to permanently delete this ${review.rating}-star review by ${
        review.user?.name || 'Customer'
      }? This will remove it from MongoDB and recompute stadium average rating.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteReview(review._id);
          showNotification('success', 'Review deleted successfully and stadium ratings updated.');
          fetchReviews();
        } catch (err) {
          showNotification('error', err.message || 'Failed to delete review');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Review Moderation</h1>
          <p className="text-sm text-slate-500">
            Inspect feedback, manage verified customer ratings, and moderate inappropriate content ({totalCount} total)
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-royal-blue' : ''}`} />
          Refresh Reviews
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feedback text, user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={stadiumFilter}
            onChange={(e) => {
              setStadiumFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-700"
          >
            <option value="">All Stadiums</option>
            {stadiums.map((std) => (
              <option key={std._id} value={std._id}>
                {std.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-royal-blue mx-auto mb-2" />
            <span>Loading reviews from database...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No reviews found</p>
            <p className="text-xs text-slate-400">No customer reviews match your active criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => {
              const userName = rev.user?.name || rev.userName || 'Verified Customer';
              const userEmail = rev.user?.email || rev.userEmail || '';
              const stadiumName = rev.stadium?.name || rev.stadiumName || 'Stadium Facility';

              return (
                <div key={rev._id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="space-y-2 flex-1">
                    {/* Header line: Rating & Stadium & User */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {rev.rating}.0 / 5.0
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-royal-blue">
                        {stadiumName}
                      </span>
                      {rev.booking && (
                        <span className="text-[11px] font-mono text-slate-400">
                          (Ref: {rev.booking.bookingReference || rev.booking._id?.slice(-6)})
                        </span>
                      )}
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {rev.comment || rev.reviewText || rev.text || <span className="italic text-slate-400">No comment text provided.</span>}
                    </p>

                    {/* Photos if any */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {rev.photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt={`Review upload ${i + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                          />
                        ))}
                      </div>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>By <strong className="text-slate-600 font-medium">{userName}</strong> {userEmail && `(${userEmail})`}</span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleDelete(rev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalCount}
          pageSize={limit}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type="danger"
        confirmText="Delete Review"
        onConfirm={() => {
          dialogConfig.onConfirm();
          setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminReviews;
