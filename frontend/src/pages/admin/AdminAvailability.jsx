import React, { useState, useEffect } from 'react';
import { adminAPI, stadiumAPI, sportAPI } from '../../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';

const AdminAvailability = () => {
  const [stadiums, setStadiums] = useState([]);
  const [sports, setSports] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Selector state
  const [selectedStadiumId, setSelectedStadiumId] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDuration, setSelectedDuration] = useState(1);

  // Availability result
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);

  // Load stadiums and sports
  useEffect(() => {
    const loadInitial = async () => {
      setLoadingMetadata(true);
      try {
        const [stdRes, sptRes] = await Promise.all([
          stadiumAPI.getAll({ limit: 100 }),
          sportAPI.getAll({ limit: 100 })
        ]);
        const stdList = stdRes.stadiums || stdRes.data?.stadiums || (Array.isArray(stdRes.data) ? stdRes.data : []);
        setStadiums(stdList);
        if (stdList.length > 0) {
          setSelectedStadiumId(stdList[0]._id);
        }

        const sptList = sptRes.sports || sptRes.data?.sports || (Array.isArray(sptRes.data) ? sptRes.data : []);
        setSports(sptList);
        if (sptList.length > 0) {
          setSelectedSport(sptList[0].name);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
        setError('Failed to load stadiums/sports list');
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadInitial();
  }, []);

  const fetchAvailability = async () => {
    if (!selectedStadiumId || !selectedDate) return;
    setLoadingAvailability(true);
    setError(null);
    try {
      const res = await stadiumAPI.getAvailability(
        selectedStadiumId,
        selectedDate,
        selectedDuration,
        selectedSport || undefined
      );
      if (res && res.success) {
        const rawSlots = res.slots || res.data?.slots || [];
        const availableSlots = rawSlots.filter(s => (s.available !== false && s.isAvailable !== false));
        const bookedSlots = rawSlots.filter(s => (s.available === false || s.isAvailable === false));
        setAvailability({
          ...res,
          slots: rawSlots,
          availableSlots: res.availableSlots || availableSlots,
          bookedSlots: res.bookedSlots || bookedSlots
        });
      } else {
        setError(res?.message || 'Unable to retrieve availability');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err.message || 'Failed to fetch backend availability');
      setAvailability(null);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    if (selectedStadiumId && selectedDate) {
      fetchAvailability();
    }
  }, [selectedStadiumId, selectedSport, selectedDate, selectedDuration]);

  const selectedStadium = stadiums.find((s) => s._id === selectedStadiumId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Facility Availability Inspector</h1>
        <p className="text-sm text-slate-500">
          Verify backend slot generation, operating windows, and active booking conflict resolution in real-time.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Availability Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stadium Select */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Stadium / Facility</label>
            <select
              value={selectedStadiumId}
              onChange={(e) => setSelectedStadiumId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            >
              {stadiums.map((std) => (
                <option key={std._id} value={std._id}>
                  {std.name} ({std.city || 'Facility'})
                </option>
              ))}
            </select>
          </div>

          {/* Sport Select */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Sport Discipline</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            >
              <option value="">Any Configured Sport</option>
              {sports.map((sp) => (
                <option key={sp._id} value={sp.name}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            />
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Session Duration (Hours)
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-blue focus:bg-white text-slate-800"
            >
              <option value={1}>1 Hour Session</option>
              <option value={2}>2 Hours Session</option>
              <option value={3}>3 Hours Session</option>
              <option value={4}>4 Hours Session</option>
              <option value={5}>5 Hours Session</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-royal-blue font-medium">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              Backend Rule: Duration is applied BEFORE start time to eliminate invalid overflow slots.
            </span>
          </div>

          <button
            onClick={fetchAvailability}
            className="inline-flex items-center gap-1 text-slate-700 hover:text-royal-blue font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAvailability ? 'animate-spin' : ''}`} />
            Re-check Availability
          </button>
        </div>
      </div>

      {/* Results View */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : loadingAvailability ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-royal-blue mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">Calculating valid schedule slots from MongoDB...</p>
        </div>
      ) : availability ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-r border-slate-100 pr-4">
                <span className="text-xs text-slate-400">Facility Operating Hours</span>
                <p className="text-sm font-bold text-navy mt-0.5">
                  {availability.openingTime || selectedStadium?.openingTime || '06:00'} -{' '}
                  {availability.closingTime || selectedStadium?.closingTime || '22:00'}
                </p>
                <span className="text-[11px] text-slate-500">Standard operating window</span>
              </div>

              <div className="border-r border-slate-100 pr-4">
                <span className="text-xs text-slate-400">Available Slots</span>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  {availability.availableSlots?.length || 0} Slots Available
                </p>
                <span className="text-[11px] text-slate-500">For {selectedDuration}h duration</span>
              </div>

              <div className="border-r border-slate-100 pr-4">
                <span className="text-xs text-slate-400">Booked / Blocked Intervals</span>
                <p className="text-sm font-bold text-rose-600 mt-0.5">
                  {availability.bookedSlots?.length || 0} Slots Reserved
                </p>
                <span className="text-[11px] text-slate-500">Conflict prevented</span>
              </div>

              <div>
                <span className="text-xs text-slate-400">Rate for Selection</span>
                <p className="text-sm font-bold text-royal-blue mt-0.5">
                  ₹{((selectedStadium?.pricePerHour || 1000) * selectedDuration).toLocaleString()} + GST
                </p>
                <span className="text-[11px] text-slate-500">Base rate: ₹{selectedStadium?.pricePerHour || 1000}/hr</span>
              </div>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center justify-between">
              <span>Time Slot Breakdown for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-xs text-slate-400 font-normal">
                Green = Open for user booking | Red = Confirmed reservation in MongoDB
              </span>
            </h3>

            {availability.slots && availability.slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availability.slots.map((slot, index) => {
                  const isAvail = slot.available !== undefined ? slot.available : (slot.isAvailable !== false);
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isAvail
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                          : 'bg-rose-50/60 border-rose-200 text-rose-800 opacity-80'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
                        {isAvail ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span className="text-rose-700 font-medium">Booked</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : availability.availableSlots ? (
              /* Fallback if backend returns availableSlots array */
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-500">Available Starting Times:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availability.availableSlots.map((time, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-center"
                    >
                      <div className="text-xs font-bold text-slate-800">{time}</div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Open Slot</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No slot data returned for this configuration.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminAvailability;
