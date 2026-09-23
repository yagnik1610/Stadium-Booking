import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, CreditCard, CheckCircle2, 
  XCircle, AlertCircle, Plus, Search, RefreshCw, Eye, 
  MapPin, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'stadiums' | 'users'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState(null);

  // Filter & Search
  const [bookingFilter, setBookingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isStadiumModalOpen, setIsStadiumModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // New Stadium Form State
  const [newStadium, setNewStadium] = useState({
    name: '',
    description: 'High-quality verified sports arena with professional turf and lighting.',
    location: 'Central Sports District',
    address: 'Arena Road, Sector 5',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: 'Cricket, Football',
    capacity: 22,
    playerCapacity: 22,
    audienceCapacity: 500,
    audienceAllowed: true,
    audiencePassRequired: false,
    audienceRules: '',
    pricePerHour: 1500,
    openingTime: '06:00',
    closingTime: '22:00',
    minDuration: 1,
    maxDuration: 4,
    gstRate: 18,
    length: 105,
    width: 68,
    parkingCapacity: 100,
    facilities: 'Floodlights, Changing Rooms, Parking, First Aid',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, bookRes, stadRes, userRes] = await Promise.all([
        adminAPI.getDashboard().catch(() => ({ success: false })),
        adminAPI.getAllBookings().catch(() => ({ success: true, bookings: [] })),
        adminAPI.getStadiums().catch(() => ({ success: true, stadiums: [] })),
        adminAPI.getUsers().catch(() => ({ success: true, users: [] }))
      ]);

      if (dashRes.success && dashRes.stats) {
        setStats(dashRes.stats);
      }
      if (bookRes.success && Array.isArray(bookRes.bookings)) {
        setBookings(bookRes.bookings);
      }
      if (stadRes.success && Array.isArray(stadRes.stadiums)) {
        setStadiums(stadRes.stadiums);
      }
      if (userRes.success && Array.isArray(userRes.users)) {
        setUsersList(userRes.users);
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError(err.message || 'Failed to load administrative console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Booking Approval / Rejection
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    let rejectionReason = undefined;
    if (newStatus === 'cancelled') {
      rejectionReason = window.prompt('Enter reason for administrative rejection / cancellation (optional):') || 'Venue maintenance conflict';
    }

    setActionLoading(bookingId);
    try {
      const res = await adminAPI.updateBookingStatus(bookingId, { 
        status: newStatus, 
        rejectionReason 
      });
      if (res.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus, rejectionReason } : b));
      }
    } catch (err) {
      alert(err.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle User Status Toggle
  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await adminAPI.updateUserStatus(userId, { isActive: !currentActive });
      if (res.success) {
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentActive } : u));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  // Handle Create Stadium
  const handleCreateStadium = async (e) => {
    e.preventDefault();
    try {
      const minDur = Number(newStadium.minDuration) || 1;
      const maxDur = Number(newStadium.maxDuration) || 4;
      const allowedDurs = [];
      for (let d = minDur; d <= maxDur; d++) allowedDurs.push(d);

      const payload = {
        name: newStadium.name.trim(),
        description: newStadium.description.trim(),
        location: newStadium.location.trim(),
        address: newStadium.address.trim(),
        city: newStadium.city.trim(),
        state: newStadium.state.trim(),
        country: newStadium.country.trim(),
        sports: newStadium.sports.split(',').map(s => s.trim()).filter(Boolean),
        capacity: Number(newStadium.capacity) || 22,
        playerCapacity: Number(newStadium.playerCapacity) || Number(newStadium.capacity) || 22,
        audienceCapacity: Number(newStadium.audienceCapacity) || 0,
        audienceAllowed: Boolean(newStadium.audienceAllowed),
        audiencePassRequired: Boolean(newStadium.audiencePassRequired),
        audienceRules: newStadium.audienceRules.trim(),
        pricePerHour: Number(newStadium.pricePerHour) || 1000,
        openingTime: newStadium.openingTime,
        closingTime: newStadium.closingTime,
        minDuration: minDur,
        maxDuration: maxDur,
        allowedDurations: allowedDurs,
        gstRate: Number(newStadium.gstRate) || 0,
        dimensions: { length: Number(newStadium.length) || 105, width: Number(newStadium.width) || 68, unit: 'm' },
        parking: { available: true, capacity: Number(newStadium.parkingCapacity) || 100 },
        facilities: newStadium.facilities.split(',').map(s => s.trim()).filter(Boolean),
        image: newStadium.image.trim()
      };

      const res = await adminAPI.createStadium(payload);
      if (res.success) {
        alert('New stadium created successfully! Users can now discover and book it.');
        setIsStadiumModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create stadium.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const refMatch = b.bookingReference?.toLowerCase().includes(q);
      const stadiumMatch = b.stadium?.name?.toLowerCase().includes(q);
      const userMatch = b.user?.name?.toLowerCase().includes(q);
      return refMatch || stadiumMatch || userMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Administrator Control Center
              </span>
              <span className="text-xs text-slate-400">
                Authorized: {user?.email}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#172554] tracking-tight">
              Stadium Booking Administrative Console
            </h1>
            <p className="text-xs text-slate-500">
              Manage live user bookings, venue approvals, facility catalog, and user accounts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={ArrowLeft}
            >
              User Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              icon={RefreshCw}
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStadiumModalOpen(true)}
              icon={Plus}
            >
              Add New Stadium
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Bookings</span>
              <Calendar className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-black text-[#172554]">{bookings.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{bookings.filter(b => b.status === 'pending').length} pending review</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Stadiums</span>
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#172554]">{stadiums.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active sports venues</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Registered Users</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-[#172554]">{usersList.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Customer accounts</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-[#2563EB]">
              ₹{bookings.filter(b => b.paymentStatus === 'paid').reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified payments</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Manage User Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stadiums')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stadiums'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Stadiums Catalog ({stadiums.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Users ({usersList.length})
          </button>
        </div>

        {/* TAB 1: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      bookingFilter === st
                        ? 'bg-[#172554] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ref, stadium, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Stadium</th>
                    <th className="px-4 py-3">Date & Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No bookings matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#172554]">
                          {b.bookingReference}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#172554]">{b.user?.name || 'Customer'}</div>
                          <div className="text-[10px] text-slate-400">{b.user?.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#172554]">{b.stadium?.name}</div>
                          <div className="text-[10px] text-slate-400">{b.sport || 'Sport'}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold">{b.bookingDate}</div>
                          <div className="text-[10px] text-slate-400">{b.startTime} - {b.endTime}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#2563EB]">
                          ₹{b.totalPrice?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          {b.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading === b._id}
                                onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === b._id}
                                onClick={() => handleUpdateBookingStatus(b._id, 'cancelled')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              disabled={actionLoading === b._id}
                              onClick={() => handleUpdateBookingStatus(b._id, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: STADIUMS CATALOG */}
        {activeTab === 'stadiums' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stadiums.map((s) => (
              <div key={s._id} className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
                      {s.sports?.[0] || 'Sport'}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#172554] mt-0.5">{s.name}</h3>
                    <p className="text-xs text-slate-500">{s.city}, {s.country || 'India'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl p-2.5 text-xs grid grid-cols-2 gap-2 text-slate-600">
                  <div>Price: <strong className="text-[#172554]">₹{s.pricePerHour}/hr</strong></div>
                  <div>Capacity: <strong className="text-[#172554]">{s.capacity}</strong></div>
                  <div>Hours: <strong className="text-[#172554]">{s.openingTime}-{s.closingTime}</strong></div>
                  <div>Sports: <strong className="text-[#172554]">{s.sports?.length || 1}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: USERS LIST */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Country / City</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#172554]">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.city || u.country || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          className="text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add Stadium Modal */}
      {isStadiumModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#172554]">Add New Stadium Facility</h3>
              <button onClick={() => setIsStadiumModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStadium} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stadium Name *</label>
                <input
                  required
                  type="text"
                  value={newStadium.name}
                  onChange={(e) => setNewStadium({ ...newStadium, name: e.target.value })}
                  placeholder="e.g. Ahmedabad Cricket Arena"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={newStadium.city}
                    onChange={(e) => setNewStadium({ ...newStadium, city: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newStadium.state}
                    onChange={(e) => setNewStadium({ ...newStadium, state: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={newStadium.country}
                    onChange={(e) => setNewStadium({ ...newStadium, country: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supported Sports (comma separated) *</label>
                  <input
                    required
                    type="text"
                    value={newStadium.sports}
                    onChange={(e) => setNewStadium({ ...newStadium, sports: e.target.value })}
                    placeholder="Cricket, Football"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Per Hour (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newStadium.pricePerHour}
                    onChange={(e) => setNewStadium({ ...newStadium, pricePerHour: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Player Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={newStadium.playerCapacity}
                    onChange={(e) => setNewStadium({ ...newStadium, playerCapacity: e.target.value, capacity: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audience Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={newStadium.audienceCapacity}
                    onChange={(e) => setNewStadium({ ...newStadium, audienceCapacity: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={newStadium.openingTime}
                    onChange={(e) => setNewStadium({ ...newStadium, openingTime: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={newStadium.closingTime}
                    onChange={(e) => setNewStadium({ ...newStadium, closingTime: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={newStadium.audienceAllowed}
                    onChange={(e) => setNewStadium({ ...newStadium, audienceAllowed: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Audience Allowed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={newStadium.audiencePassRequired}
                    onChange={(e) => setNewStadium({ ...newStadium, audiencePassRequired: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Audience Pass Required</span>
                </label>
                <div className="col-span-2 sm:col-span-1">
                  <input
                    type="text"
                    placeholder="Audience entry rules..."
                    value={newStadium.audienceRules}
                    onChange={(e) => setNewStadium({ ...newStadium, audienceRules: e.target.value })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Duration (h)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newStadium.minDuration}
                    onChange={(e) => setNewStadium({ ...newStadium, minDuration: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Duration (h)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newStadium.maxDuration}
                    onChange={(e) => setNewStadium({ ...newStadium, maxDuration: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={newStadium.gstRate}
                    onChange={(e) => setNewStadium({ ...newStadium, gstRate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parking Spots</label>
                  <input
                    type="number"
                    min="0"
                    value={newStadium.parkingCapacity}
                    onChange={(e) => setNewStadium({ ...newStadium, parkingCapacity: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">High-Res Photo URL</label>
                <input
                  type="url"
                  value={newStadium.image}
                  onChange={(e) => setNewStadium({ ...newStadium, image: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsStadiumModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Stadium
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
