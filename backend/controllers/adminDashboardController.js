const User = require('../models/User');
const Stadium = require('../models/Stadium');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { paiseToRupees } = require('../utils/money');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Execute multiple independent count queries in parallel for efficiency
    const [
      totalUsers,
      adminUsers,
      newUsersToday,
      activeUsers,
      totalStadiums,
      activeStadiums,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      rejectedBookings,
      totalFavorites,
      totalNotifications,
      unreadNotifications,
      failedPayments,
      pendingPayments,
      newReviewsCount,
      paidPayments,
      recentBookings
    ] = await Promise.all([
      // User stats
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.countDocuments({ isActive: true }),
      
      // Stadium stats
      Stadium.countDocuments(),
      Stadium.countDocuments({ isActive: true }),
      
      // Booking stats
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'approved'] } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'rejected' }),
      
      // Favorite stats
      Favorite.countDocuments(),
      
      // Notification stats
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),

      // Payment counts
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'pending' }),

      // Recent reviews count (last 7 days)
      Review.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),

      // Paid payments for revenue aggregation
      Payment.find({ status: { $in: ['paid', 'completed'] } }).select('amount createdAt'),
      
      // Recent bookings
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email mobile')
        .populate('stadium', 'name city')
    ]);

    // Review stats require aggregation for averageRating
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const totalReviews = reviewStats.length > 0 ? reviewStats[0].total : 0;
    const averageRatingRaw = reviewStats.length > 0 ? reviewStats[0].averageRating : 0;
    const averageRating = Math.round(averageRatingRaw * 10) / 10;

    // Derived stats
    const regularUsers = totalUsers - adminUsers;
    const inactiveUsers = totalUsers - activeUsers;
    const inactiveStadiums = totalStadiums - activeStadiums;

    // Calculate revenue totals (Payment.amount is authoritatively in paise)
    let totalRevenue = 0;
    let monthRevenue = 0;
    paidPayments.forEach(p => {
      const val = paiseToRupees(p.amount);
      totalRevenue += val;
      if (new Date(p.createdAt) >= startOfMonth) {
        monthRevenue += val;
      }
    });

    const totalGst = Math.round(totalRevenue * 0.18 * 100) / 100;

    // Build recentBookings array ensuring consistent structure
    const safeRecentBookings = recentBookings.map(b => ({
      _id: b._id,
      bookingReference: b.bookingReference || `#${b._id.toString().slice(-6).toUpperCase()}`,
      customer: b.user?.name || b.bookingPerson?.name || 'Guest User',
      customerEmail: b.user?.email || b.bookingPerson?.email || 'N/A',
      user: b.user ? { name: b.user.name, email: b.user.email, mobile: b.user.mobile } : null,
      stadium: b.stadium ? { name: b.stadium.name, city: b.stadium.city } : null,
      sport: b.sport || 'Sports',
      date: b.date || b.bookingDate,
      bookingDate: b.bookingDate || b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration || 1,
      totalPrice: b.pricing?.totalAmount || b.totalAmount || b.totalPrice || b.amount || 0,
      amount: b.pricing?.totalAmount || b.totalAmount || b.totalPrice || b.amount || 0,
      status: b.status,
      paymentStatus: b.paymentStatus || 'pending',
      createdAt: b.createdAt
    }));

    // Fetch Recent Users (non-admin, up to 5)
    const recentUsersRaw = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email city createdAt isActive');

    const recentUsers = recentUsersRaw.map(u => ({
      _id: u._id,
      name: u.name || 'Athlete',
      email: u.email || 'N/A',
      city: u.city || 'National',
      createdAt: u.createdAt,
      isActive: u.isActive !== false
    }));

    // Aggregate Stadium Performance
    const stadiumAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$stadium',
          bookingsCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $ifNull: ['$pricing.totalAmount', { $ifNull: ['$totalAmount', { $ifNull: ['$totalPrice', 0] }] }]
            }
          }
        }
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'stadiums',
          localField: '_id',
          foreignField: '_id',
          as: 'stadiumDoc'
        }
      },
      { $unwind: { path: '$stadiumDoc', preserveNullAndEmptyArrays: true } }
    ]);

    let topStadiums = stadiumAgg.filter(item => item.stadiumDoc).map(item => ({
      _id: item._id,
      name: item.stadiumDoc.name || 'Arena',
      city: item.stadiumDoc.city || '',
      bookingsCount: item.bookingsCount,
      revenue: item.totalRevenue,
      rating: item.stadiumDoc.averageRating || item.stadiumDoc.rating || 4.8
    }));

    if (topStadiums.length === 0) {
      const fallbackStadiums = await Stadium.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('name city averageRating rating');
      topStadiums = fallbackStadiums.map(s => ({
        _id: s._id,
        name: s.name,
        city: s.city,
        bookingsCount: 0,
        revenue: 0,
        rating: s.averageRating || s.rating || 5.0
      }));
    }

    // Aggregate Sport Performance
    const sportAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$sport',
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 }
    ]);

    const sportPerformance = sportAgg.filter(s => s._id).map(s => ({
      sport: s._id,
      bookingsCount: s.bookingsCount
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminUsers,
        regularUsers,
        newUsersToday,
        activeUsers,
        inactiveUsers,
        
        totalStadiums,
        activeStadiums,
        inactiveStadiums,
        
        totalBookings,
        pendingBookings,
        confirmedBookings,
        approvedBookings: confirmedBookings,
        completedBookings,
        cancelledBookings,
        rejectedBookings,
        
        totalRevenue: Math.round(totalRevenue),
        monthRevenue: Math.round(monthRevenue),
        totalGst,
        successfulPayments: paidPayments.length,
        pendingPayments,
        failedPayments,

        totalReviews,
        averageRating,
        
        totalFavorites,
        
        totalNotifications,
        unreadNotifications
      },
      pendingActions: {
        pendingBookings,
        failedPayments,
        newReviews: newReviewsCount,
        inactiveStadiums
      },
      recentBookings: safeRecentBookings,
      recentUsers,
      topStadiums,
      sportPerformance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Comprehensive Analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res, next) => {
  try {
    const { timeRange } = req.query;
    let days = null;
    if (timeRange === '7d' || timeRange === '7') days = 7;
    else if (timeRange === '30d' || timeRange === '30' || timeRange === '1m') days = 30;
    else if (timeRange === '90d' || timeRange === '3m') days = 90;
    else if (timeRange === '1y' || timeRange === '12m' || timeRange === '365d') days = 365;

    const paymentQuery = { status: 'paid' };
    const bookingMatch = {};
    if (days) {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      paymentQuery.createdAt = { $gte: fromDate };
      const fromDateStr = fromDate.toISOString().split('T')[0];
      bookingMatch.bookingDate = { $gte: fromDateStr };
    }

    // 1. Revenue aggregations
    const paidPayments = await Payment.find(paymentQuery).populate('booking', 'sport stadium totalPrice basePrice gstAmount');
    
    let totalRevenue = 0;
    let totalGst = 0;
    const revenueBySport = {};
    const revenueByStadium = {};

    paidPayments.forEach(p => {
      const amountInRupees = paiseToRupees(p.amount);
      totalRevenue += amountInRupees;
      if (p.booking) {
        if (p.booking.gstAmount) totalGst += p.booking.gstAmount;
        if (p.booking.sport) {
          revenueBySport[p.booking.sport] = (revenueBySport[p.booking.sport] || 0) + amountInRupees;
        }
        if (p.booking.stadium) {
          const stadId = String(p.booking.stadium);
          revenueByStadium[stadId] = (revenueByStadium[stadId] || 0) + amountInRupees;
        }
      }
    });

    // 2. Booking status distribution
    const statusAggPipeline = [];
    if (bookingMatch.bookingDate) {
      statusAggPipeline.push({ $match: bookingMatch });
    }
    statusAggPipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });
    const statusCounts = await Booking.aggregate(statusAggPipeline);
    const bookingStatusMap = {};
    statusCounts.forEach(s => { bookingStatusMap[s._id] = s.count; });

    // 3. Bookings by Sport
    const sportAggPipeline = [];
    const sportMatch = { sport: { $ne: '' } };
    if (bookingMatch.bookingDate) sportMatch.bookingDate = bookingMatch.bookingDate;
    sportAggPipeline.push({ $match: sportMatch });
    sportAggPipeline.push(
      { $group: { _id: '$sport', count: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } },
      { $sort: { count: -1 } }
    );
    const sportCounts = await Booking.aggregate(sportAggPipeline);

    // 4. Daily bookings trend
    const trendDays = days || 14;
    const trendStartDate = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000);
    const trendStartStr = trendStartDate.toISOString().split('T')[0];

    const dailyBookings = await Booking.aggregate([
      { $match: { bookingDate: { $gte: trendStartStr } } },
      { $group: { _id: '$bookingDate', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } }
    ]);

    // 5. Stadium performance ranking
    const topStadiums = await Booking.aggregate([
      { $group: { _id: '$stadium', bookingCount: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'stadiums', localField: '_id', foreignField: '_id', as: 'stadium' } },
      { $unwind: '$stadium' },
      { $project: {
        stadiumId: '$_id',
        name: '$stadium.name',
        city: '$stadium.city',
        bookingCount: 1,
        totalRevenue: 1
      }}
    ]);

    // 6. User metrics
    const [totalUsers, activeUsers, newUsersLast30Days] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } })
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        revenue: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          netRevenue: Math.round((totalRevenue - totalGst) * 100) / 100,
          paidTransactionsCount: paidPayments.length,
          revenueBySport
        },
        bookings: {
          total: Object.values(bookingStatusMap).reduce((a, b) => a + b, 0),
          statusDistribution: bookingStatusMap,
          bySport: sportCounts,
          dailyTrend: dailyBookings
        },
        stadiums: {
          topPerformers: topStadiums
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          newLast30Days: newUsersLast30Days
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Filterable Reports Data
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res, next) => {
  try {
    const category = req.query.category || req.query.type || 'bookings';
    const { startDate, endDate, sport, status } = req.query;
    const stadium = req.query.stadium || req.query.stadiumId;

    let query = {};
    if (stadium) query.stadium = stadium;
    if (sport) query.sport = sport;
    if (status) query.status = status;

    if (category === 'bookings') {
      if (startDate || endDate) {
        query.bookingDate = {};
        if (startDate) query.bookingDate.$gte = startDate;
        if (endDate) query.bookingDate.$lte = endDate;
      }

      const bookings = await Booking.find(query)
        .populate('user', 'name email phone')
        .populate('stadium', 'name city')
        .sort({ bookingDate: -1 })
        .limit(100);

      const totalAmount = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalGst = bookings.reduce((sum, b) => sum + (b.gstAmount || 0), 0);

      return res.status(200).json({
        success: true,
        reportType: 'bookings',
        summary: {
          recordCount: bookings.length,
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100
        },
        data: bookings
      });
    }

    if (category === 'revenue' || category === 'payments') {
      const paymentQuery = {};
      if (status) paymentQuery.status = status;
      if (startDate || endDate) {
        paymentQuery.createdAt = {};
        if (startDate) paymentQuery.createdAt.$gte = new Date(startDate);
        if (endDate) paymentQuery.createdAt.$lte = new Date(endDate);
      }

      const payments = await Payment.find(paymentQuery)
        .populate('user', 'name email')
        .populate({
          path: 'booking',
          select: 'bookingReference sport bookingDate totalPrice basePrice gstAmount stadium',
          populate: { path: 'stadium', select: 'name city' }
        })
        .sort({ createdAt: -1 })
        .limit(100);

      const totalCollected = payments.reduce((sum, p) => p.status === 'paid' ? sum + paiseToRupees(p.amount) : sum, 0);

      return res.status(200).json({
        success: true,
        reportType: 'payments',
        summary: {
          recordCount: payments.length,
          totalCollected: Math.round(totalCollected * 100) / 100
        },
        data: payments
      });
    }

    if (category === 'stadiums') {
      const stadiumQuery = {};
      if (sport) stadiumQuery.sports = sport;
      const stadiums = await Stadium.find(stadiumQuery).sort({ name: 1 });

      return res.status(200).json({
        success: true,
        reportType: 'stadiums',
        summary: {
          recordCount: stadiums.length
        },
        data: stadiums
      });
    }

    // Default users
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      reportType: 'users',
      summary: { recordCount: users.length },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getReports
};

