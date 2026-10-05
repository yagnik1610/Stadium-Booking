import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stadium_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.statusCode = error.response?.status;
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data)
};

export const stadiumAPI = {
  getAll: (params) => api.get('/stadiums', { params }),
  getAllStadiums: (params) => api.get('/stadiums', { params }),
  search: (params) => api.get('/stadiums/search', { params }),
  getById: (id) => api.get(`/stadiums/${id}`),
  getAvailability: (id, date, duration, sport) => {
    const params = { date };
    if (duration !== undefined && duration !== null) params.duration = duration;
    if (sport) params.sport = sport;
    return api.get(`/stadiums/${id}/availability`, { params });
  }
};

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, typeof data === 'string' ? { reason: data } : data)
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  getMyPayments: () => api.get('/payments/my'),
  getByBookingId: (bookingId) => api.get(`/payments/${bookingId}`)
};

export const reviewAPI = {
  getByStadium: (stadiumId) => api.get(`/reviews/stadium/${stadiumId}`),
  getEligibleBookings: (stadiumId) => api.get(`/reviews/eligible-bookings/${stadiumId}`),
  submit: (data) => api.post('/reviews', data),
  getMyReviews: () => api.get('/reviews/my'),
  getById: (id) => api.get(`/reviews/${id}`),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`)
};

export const favoriteAPI = {
  add: (data) => api.post('/favorites', typeof data === 'string' ? { stadium: data } : data),
  getMyFavorites: () => api.get('/favorites/my'),
  check: (stadiumId) => api.get(`/favorites/check/${stadiumId}`),
  remove: (stadiumId) => api.delete(`/favorites/${stadiumId}`)
};

export const contactAPI = {
  submit: (data) => api.post('/contact', data)
};

export const notificationAPI = {
  getMy: () => api.get('/notifications/my'),
  getMyNotifications: () => api.get('/notifications/my'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications')
};

export const sportAPI = {
  getAll: (params) => api.get('/sports', { params }),
  getAllSports: (params) => api.get('/sports', { params }),
  getById: (id) => api.get(`/sports/${id}`),
  create: (data) => api.post('/sports', data),
  update: (id, data) => api.put(`/sports/${id}`, data),
  delete: (id) => api.delete(`/sports/${id}`)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  getUserStats: (id) => api.get(`/admin/users/${id}/stats`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  
  // Stadiums
  getStadiums: (params) => api.get('/stadiums/admin/all', { params }),
  getAllStadiums: (params) => api.get('/stadiums/admin/all', { params }),
  getStadiumById: (id) => api.get(`/stadiums/${id}`),
  createStadium: (data) => api.post('/stadiums', data),
  updateStadium: (id, data) => api.put(`/stadiums/${id}`, data),
  deleteStadium: (id) => api.delete(`/stadiums/${id}`),
  uploadStadiumCover: (id, formData) => api.post(`/stadiums/${id}/media/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteStadiumCover: (id) => api.delete(`/stadiums/${id}/media/cover`),
  uploadStadiumGallery: (id, formData) => api.post(`/stadiums/${id}/media/gallery`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteStadiumGalleryImage: (id, mediaId) => api.delete(`/stadiums/${id}/media/gallery/${encodeURIComponent(mediaId)}`),
  
  // Sports
  getAllSports: (params) => api.get('/sports', { params }),
  
  // Bookings
  getAllBookings: (params) => api.get('/bookings/admin/all', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/status`, typeof reason === 'object' ? { status: 'cancelled', ...reason } : { status: 'cancelled', reason, rejectionReason: reason }),
  
  // Payments
  getPayments: (params) => api.get('/payments/admin/all', { params }),
  getAllPayments: (params) => api.get('/payments/admin/all', { params }),
  
  // Reviews
  getReviews: (params) => api.get('/reviews/admin/all', { params }),
  getAllReviews: (params) => api.get('/reviews/admin/all', { params }),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  
  // Analytics & Reports
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getReports: (params) => api.get('/admin/reports', { params }),
  
  // Operations & System
  getActivityLogs: (params) => api.get('/admin/activity', { params }),
  getContactMessages: (params) => api.get('/admin/contact-messages', { params }),
  updateContactMessageStatus: (id, status) => api.put(`/admin/contact-messages/${id}/status`, { status }),
  getSettings: () => api.get('/admin/settings'),
  getSystemSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  updateSystemSettings: (data) => api.put('/admin/settings', data),
  getStadiumAvailability: (stadiumId, params) => {
    const p = {};
    if (params?.date) p.date = params.date;
    if (params?.duration !== undefined && params?.duration !== null) p.duration = params.duration;
    if (params?.sport) p.sport = params.sport;
    return api.get(`/stadiums/${stadiumId}/availability`, { params: p });
  },
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data)
};

export default api;
