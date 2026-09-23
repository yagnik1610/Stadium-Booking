import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { stadiumAPI, bookingAPI } from '../../services/api';
import { 
  X, Calendar, Clock, Users, ShieldAlert, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, FileText, Info, 
  Check, Sparkles, AlertTriangle, ChevronDown, ChevronUp, UserCheck, ShieldCheck
} from 'lucide-react';
import Button from '../ui/Button';

export default function DynamicBookingModal({ stadium, isOpen, onClose, onBookingSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Wizard Step: 1 = Date & Duration, 2 = Time Slot, 3 = Booking Person, 4 = Game Details, 5 = Safety, Terms & Summary
  const [step, setStep] = useState(1);

  // Selected Sport
  const [selectedSport, setSelectedSport] = useState('General');

  // Step 1: Date & Duration
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [duration, setDuration] = useState(1);

  // Step 2: Available Time Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Step 3: Booking Person Details
  const [bookingFor, setBookingFor] = useState('myself'); // 'myself' | 'someone_else'
  const [bookingPerson, setBookingPerson] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: 'Prefer not to say'
  });

  // Step 4: Game-Specific Dynamic Details
  const [gameDetails, setGameDetails] = useState({
    teamName: '',
    matchType: 'Practice',
    playerCount: 10,
    captainName: '',
    equipmentRental: false,
    additionalNotes: ''
  });

  // Step 5: Accordions & Consents
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Initialize or reset when modal opens or stadium changes
  useEffect(() => {
    if (stadium && isOpen) {
      const initialSport = stadium.sports && stadium.sports.length > 0 ? stadium.sports[0] : 'General';
      setSelectedSport(initialSport);
      
      const allowed = (stadium.allowedDurations && stadium.allowedDurations.length > 0)
        ? stadium.allowedDurations
        : [1, 2, 3, 4];
      setDuration(allowed[0] || stadium.minDuration || 1);

      setSelectedDate(todayStr);
      setStep(1);
      setSelectedSlot(null);
      setSafetyAcknowledged(false);
      setTermsAccepted(false);
      setIsSafetyOpen(false);
      setIsTermsOpen(false);
      setSubmitError(null);

      // Pre-fill user data for "Myself"
      if (user) {
        setBookingPerson({
          name: user.name || '',
          email: user.email || '',
          mobile: user.phone || user.mobile || '+91 ',
          age: user.age || '',
          gender: user.gender || 'Prefer not to say'
        });
      }

      // Initialize game details for sport
      initGameDetails(initialSport);
    }
  }, [stadium, isOpen, user]);

  // Handle Sport Switching
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    initGameDetails(sport);
    setSelectedSlot(null);
  };

  const initGameDetails = (sport) => {
    const s = (sport || '').toLowerCase();
    if (s.includes('cricket')) {
      setGameDetails({
        teamName: '',
        matchType: 'T20 Match',
        playerCount: 22,
        captainName: user?.name || '',
        equipmentRental: false,
        additionalNotes: ''
      });
    } else if (s.includes('football')) {
      setGameDetails({
        teamName: '',
        matchType: '7v7 Turf Match',
        playerCount: 14,
        captainName: user?.name || '',
        equipmentRental: false,
        additionalNotes: ''
      });
    } else if (s.includes('tennis')) {
      setGameDetails({
        teamName: '',
        matchType: 'Singles',
        playerCount: 2,
        captainName: user?.name || '',
        equipmentRental: true,
        additionalNotes: ''
      });
    } else {
      setGameDetails({
        teamName: '',
        matchType: 'Recreational Practice',
        playerCount: 10,
        captainName: user?.name || '',
        equipmentRental: false,
        additionalNotes: ''
      });
    }
  };

  // Fetch available slots from backend whenever Date, Duration, or Sport changes
  const fetchSlots = useCallback(async () => {
    if (!isOpen || !stadium?._id || !selectedDate) return;
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const res = await stadiumAPI.getAvailability(stadium._id, selectedDate, duration, selectedSport);
      if (res.success && Array.isArray(res.slots)) {
        setSlots(res.slots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      setSlotsError(err.message || 'Failed to check venue availability for this duration and date.');
    } finally {
      setLoadingSlots(false);
    }
  }, [isOpen, stadium?._id, selectedDate, duration, selectedSport]);

  useEffect(() => {
    setSelectedSlot(null);
    fetchSlots();
  }, [fetchSlots]);

  if (!isOpen || !stadium) return null;

  // Pricing calculations
  const pricePerHour = stadium.pricePerHour || 0;
  const basePrice = Math.round(duration * pricePerHour);
  const gstRate = stadium.gstRate !== undefined ? stadium.gstRate : 0;
  const gstAmount = Math.round(basePrice * (gstRate / 100) * 100) / 100;
  const totalPrice = Math.round((basePrice + gstAmount) * 100) / 100;

  // Allowed duration options (data-driven from stadium or sport config)
  const availableDurations = (stadium.allowedDurations && stadium.allowedDurations.length > 0)
    ? stadium.allowedDurations
    : [1, 2, 3, 4];

  // Submission handler
  const handleSubmitBooking = async () => {
    if (!user) {
      navigate(`/login?redirect=/stadiums/${stadium._id}`);
      return;
    }

    if (!termsAccepted) {
      setSubmitError('You must read and accept the Stadium & Game Terms to proceed.');
      return;
    }

    if (!safetyAcknowledged) {
      setSubmitError('Please acknowledge the Safety & Venue Requirements before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        stadium: stadium._id,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        duration: Number(duration),
        sport: selectedSport,
        bookingFor,
        bookingPerson: {
          name: bookingPerson.name.trim(),
          email: bookingPerson.email.trim(),
          mobile: bookingPerson.mobile.trim(),
          age: bookingPerson.age ? Number(bookingPerson.age) : undefined,
          gender: bookingPerson.gender
        },
        gameDetails,
        safetyAcknowledged: true,
        termsAccepted: true,
        status: 'pending' // Enters administrative review lifecycle
      };

      const res = await bookingAPI.create(payload);

      if (res.success && res.booking) {
        if (onBookingSuccess) onBookingSuccess(res.booking);
        onClose();
        navigate(`/dashboard/bookings/${res.booking._id}?new=true`);
      } else {
        setSubmitError(res.message || 'Failed to submit booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      const isConflict =
        err.status === 409 ||
        err.statusCode === 409 ||
        (err.message && err.message.toLowerCase().includes('conflict')) ||
        (err.message && err.message.toLowerCase().includes('already booked')) ||
        (err.message && err.message.toLowerCase().includes('overlapping'));

      if (isConflict) {
        setSubmitError('This slot is no longer available. Availability has been refreshed.');
        setSelectedSlot(null);
        await fetchSlots();
        setStep(2); // Direct user back to slot selection
      } else {
        setSubmitError(err.message || 'Failed to submit booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                Step {step} of 5
              </span>
              <span className="text-xs font-bold text-slate-500">
                {step === 1 && 'Sport, Date & Duration'}
                {step === 2 && 'Select Start Time Slot'}
                {step === 3 && 'Booking Person Details'}
                {step === 4 && 'Game-Specific Specifications'}
                {step === 5 && 'Safety, Terms & Review'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#172554] tracking-tight mt-1">
              Book {stadium.name}
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

        {/* Stepper Progress Indicator */}
        <div className="grid grid-cols-5 h-1.5 bg-slate-100 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`transition-all duration-300 ${
                s <= step ? 'bg-[#2563EB]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">{submitError}</p>
                <p className="text-[11px] text-rose-600">Please adjust your selection or refresh availability.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Sport, Date & Duration Selection                                  */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              
              {/* Sport Selector */}
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-2">
                  1. Select Sport / Activity *
                </label>
                <div className="flex flex-wrap gap-2">
                  {(stadium.sports || ['General']).map((sport) => {
                    const isSelected = selectedSport.toLowerCase() === sport.toLowerCase();
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => handleSportChange(sport)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  2. Select Reservation Date *
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="w-full p-2.5 pl-9 text-xs rounded-xl border border-slate-300 bg-white font-medium text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Past dates cannot be reserved. Availability updates dynamically.
                </span>
              </div>

              {/* Duration Selector (CRITICAL: DURATION COMES BEFORE TIME) */}
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  3. How many hours do you want to book? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableDurations.map((dur) => {
                    const isSelected = duration === dur;
                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => {
                          setDuration(dur);
                          setSelectedSlot(null);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-black ring-1 ring-[#2563EB]'
                            : 'bg-white border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm block font-black">
                          {dur} {dur === 1 ? 'Hour' : 'Hours'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ₹{(dur * pricePerHour).toLocaleString('en-IN')} base
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Duration options are governed by venue configuration ({stadium.minDuration || 1} to {stadium.maxDuration || 4} hours).
                </p>
              </div>

              {/* Summary Card for Step 1 */}
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Criteria</span>
                  <span className="font-bold text-[#172554] text-xs">
                    {selectedSport} • {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {duration} {duration === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hourly Base Rate</span>
                  <span className="font-black text-[#2563EB] text-xs">₹{pricePerHour.toLocaleString('en-IN')}/hr</span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Time Slot Selection (Backend-Calculated)                          */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172554]">
                    Select Start Time ({duration} {duration === 1 ? 'Hour' : 'Hours'} Session)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Operating Hours: {stadium.openingTime} to {stadium.closingTime}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Booked
                  </span>
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center space-y-2 bg-[#F8FAFC] rounded-xl border border-slate-100">
                  <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[#172554]">
                    Checking real-time venue availability for {duration} {duration === 1 ? 'hour' : 'hours'}...
                  </p>
                </div>
              ) : slotsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <p className="font-bold">{slotsError}</p>
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Change Date or Duration
                  </Button>
                </div>
              ) : slots.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-[#172554]">No slots available for {duration} hours on this date.</p>
                  <p className="text-[11px] text-slate-400">The requested duration exceeds remaining open operating hours or all slots are booked.</p>
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Modify Selection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {slots.map((slot, idx) => {
                    const isAvailable = slot.available !== false && slot.isAvailable !== false;
                    const isSelected = selectedSlot?.startTime === slot.startTime;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          !isAvailable
                            ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] ring-2 ring-[#2563EB] shadow-xs'
                            : 'bg-white border-slate-200 text-[#172554] hover:border-[#2563EB] hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">
                            {slot.startTime}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB]" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Ends: <strong className="text-slate-700">{slot.endTime}</strong>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Automatic End Time Confirmation Preview */}
              {selectedSlot && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800">
                      Confirmed Session: {selectedSlot.startTime} to {selectedSlot.endTime} ({duration} {duration === 1 ? 'Hour' : 'Hours'})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">Auto-Calculated</span>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Basic Booking Person Details                                      */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-2">
                  Who are you booking for? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    bookingFor === 'myself'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="bookingFor"
                      value="myself"
                      checked={bookingFor === 'myself'}
                      onChange={() => {
                        setBookingFor('myself');
                        if (user) {
                          setBookingPerson({
                            name: user.name || '',
                            email: user.email || '',
                            mobile: user.phone || user.mobile || '+91 ',
                            age: user.age || '',
                            gender: user.gender || 'Prefer not to say'
                          });
                        }
                      }}
                      className="text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Myself (Account Holder)</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    bookingFor === 'someone_else'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="bookingFor"
                      value="someone_else"
                      checked={bookingFor === 'someone_else'}
                      onChange={() => {
                        setBookingFor('someone_else');
                        setBookingPerson({
                          name: '',
                          email: '',
                          mobile: '+91 ',
                          age: '',
                          gender: 'Prefer not to say'
                        });
                      }}
                      className="text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Someone Else (Nominee)</span>
                  </label>
                </div>
              </div>

              {bookingFor === 'someone_else' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Your account remains the booking owner for payments and notifications, but reception check-in and billing will be issued in the nominee's name.
                  </span>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Patel"
                    value={bookingPerson.name}
                    onChange={(e) => setBookingPerson({ ...bookingPerson, name: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mobile Number (International format) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210 or +1 4155552671"
                    value={bookingPerson.mobile}
                    onChange={(e) => setBookingPerson({ ...bookingPerson, mobile: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={bookingPerson.email}
                    onChange={(e) => setBookingPerson({ ...bookingPerson, email: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    placeholder="e.g. 24"
                    value={bookingPerson.age}
                    onChange={(e) => setBookingPerson({ ...bookingPerson, age: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: Game-Specific Dynamic Requirements                                */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2563EB] uppercase block">Selected Sport Configuration</span>
                  <span className="font-black text-[#172554] text-xs">{selectedSport} Requirements</span>
                </div>
                <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-[#DBEAFE] text-[#2563EB]">
                  Capacity: {stadium.capacity || 50} Players
                </span>
              </div>

              {/* Dynamic Game Form based on Selected Sport */}
              <div className="space-y-3.5">
                
                {/* Match Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Match / Session Type *
                  </label>
                  <select
                    value={gameDetails.matchType}
                    onChange={(e) => setGameDetails({ ...gameDetails, matchType: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {selectedSport.toLowerCase().includes('cricket') ? (
                      <>
                        <option value="T20 Match">T20 Full Match</option>
                        <option value="Net Session Practice">Net Practice & Batting Session</option>
                        <option value="Box Cricket Tournament">Box Cricket League</option>
                        <option value="Recreational Friendly">Recreational Friendly</option>
                      </>
                    ) : selectedSport.toLowerCase().includes('football') ? (
                      <>
                        <option value="5v5 Turf Match">5v5 Turf Match</option>
                        <option value="7v7 Match">7v7 Turf Match</option>
                        <option value="11v11 Full Pitch">11v11 Full Pitch</option>
                        <option value="Team Tactical Practice">Team Tactical Practice</option>
                      </>
                    ) : selectedSport.toLowerCase().includes('tennis') ? (
                      <>
                        <option value="Singles (1v1)">Singles (1 on 1)</option>
                        <option value="Doubles (2v2)">Doubles (2 on 2)</option>
                        <option value="Coaching Drill">Coaching Drill & Rally Session</option>
                      </>
                    ) : (
                      <>
                        <option value="Recreational Match">Recreational Match</option>
                        <option value="Tournament Game">Tournament Game</option>
                        <option value="Training Session">Training Session</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Team & Captain Details (for team sports) */}
                {!selectedSport.toLowerCase().includes('tennis') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Team Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Strikers FC"
                        value={gameDetails.teamName}
                        onChange={(e) => setGameDetails({ ...gameDetails, teamName: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Captain / Coordinator Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Patel"
                        value={gameDetails.captainName}
                        onChange={(e) => setGameDetails({ ...gameDetails, captainName: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                )}

                {/* Player Count */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Estimated Number of Players *
                    </label>
                    <span className="text-[11px] font-black text-[#2563EB]">
                      {gameDetails.playerCount} Players
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedSport.toLowerCase().includes('tennis') ? 2 : 2}
                    max={stadium.playerCapacity || stadium.capacity || 22}
                    value={gameDetails.playerCount}
                    onChange={(e) => setGameDetails({ ...gameDetails, playerCount: Number(e.target.value) })}
                    className="w-full accent-[#2563EB]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Min: 2</span>
                    <span>Max Player Capacity: {stadium.playerCapacity || stadium.capacity || 22}</span>
                  </div>
                </div>

                {/* Audience / Spectators Section (Section 24, 37) */}
                {stadium.audienceAllowed !== false && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-[#172554] block">
                          Audience / Spectator Passes
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {stadium.audiencePassRequired ? 'Venue requires verified audience entry passes' : 'Spectator seating available'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Max: {stadium.audienceCapacity || 'Open'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max={stadium.audienceCapacity || 5000}
                        value={gameDetails.audienceCount || 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setGameDetails({ ...gameDetails, audienceCount: val, audiencePasses: val });
                        }}
                        className="w-28 p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <span className="text-xs text-slate-600 font-medium">Spectators attending</span>
                    </div>
                    {stadium.audienceRules && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                        Pass Rules: {stadium.audienceRules}
                      </p>
                    )}
                  </div>
                )}

                {/* Equipment Rental Checkbox */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameDetails.equipmentRental}
                    onChange={(e) => setGameDetails({ ...gameDetails, equipmentRental: e.target.checked })}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#172554] block">Request On-Site Sports Equipment Kit</span>
                    <span className="text-[11px] text-slate-500">Venue supervisor provides official match balls, cones, and vests upon arrival.</span>
                  </div>
                </label>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: Safety Accordion, Terms Accordion & Complete Booking Summary       */}
          {/* ========================================================================= */}
          {step === 5 && (
            <div className="space-y-4">
              
              {/* Expandable Safety Requirements Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-xs text-[#172554]">
                      Safety & Venue Requirements
                    </span>
                  </div>
                  {isSafetyOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isSafetyOpen && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-xs text-slate-600">
                    <ul className="space-y-1.5">
                      {(stadium.safetyRules && stadium.safetyRules.length > 0 ? stadium.safetyRules : [
                        'Proper non-marking sports footwear is mandatory on the playing surface.',
                        'First aid kit is available on-site with ground management.',
                        'Glass containers, alcohol, and hazardous objects are strictly prohibited.'
                      ]).map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Mandatory Safety Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={safetyAcknowledged}
                  onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] mt-0.5"
                />
                <span className="text-xs font-bold text-[#172554]">
                  I confirm that I have read and understood the safety requirements for this venue. *
                </span>
              </label>

              {/* Expandable Terms & Conditions Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(!isTermsOpen)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-xs text-[#172554]">
                      Stadium & Sport Terms & Conditions
                    </span>
                  </div>
                  {isTermsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isTermsOpen && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {stadium.termsAndConditions || '1. Arrive 15 minutes prior to scheduled slot for administrative check-in.\n2. Cancellations made at least 24 hours in advance are eligible for rescheduling.\n3. Damage to turf, lighting, or equipment is subject to venue assessment fees.'}
                  </div>
                )}
              </div>

              {/* Mandatory Terms Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] mt-0.5"
                />
                <span className="text-xs font-bold text-[#172554]">
                  I agree to the Stadium & Game Terms and Conditions. *
                </span>
              </label>

              {/* Authoritative Financial Booking Summary */}
              <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                  <span className="text-xs font-black text-[#172554] uppercase tracking-wider">
                    Reservation Summary
                  </span>
                  <span className="text-[11px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    {selectedSport}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Venue:</span>
                    <strong className="text-[#172554]">{stadium.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Date:</span>
                    <strong className="text-[#172554]">{selectedDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Scheduled Time:</span>
                    <strong className="text-[#172554]">{selectedSlot?.startTime} – {selectedSlot?.endTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Duration:</span>
                    <strong className="text-[#172554]">{duration} {duration === 1 ? 'Hour' : 'Hours'}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-blue-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Booked For:</span>
                      <strong className="text-[#172554]">{bookingPerson.name} ({bookingPerson.mobile})</strong>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Players: <strong className="text-[#172554]">{gameDetails.playerCount || 2}</strong></span>
                      {gameDetails.audienceCount > 0 && (
                        <span>Audience: <strong className="text-[#172554]">{gameDetails.audienceCount} Passes</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* GST Breakdown */}
                <div className="border-t border-blue-200/60 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Facility Amount ({duration} hrs @ ₹{pricePerHour}/hr):</span>
                    <span className="font-semibold">₹{basePrice.toLocaleString('en-IN')}</span>
                  </div>

                  {gstRate > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({gstRate}%):</span>
                      <span className="font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-[#172554] pt-1.5 border-t border-blue-200">
                    <span>Grand Total:</span>
                    <span className="text-[#2563EB] text-base">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              icon={ChevronLeft}
            >
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={
                (step === 1 && (!selectedDate || !duration)) ||
                (step === 2 && !selectedSlot) ||
                (step === 3 && (!bookingPerson.name || !bookingPerson.email || !bookingPerson.mobile))
              }
              onClick={() => setStep(step + 1)}
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!termsAccepted || !safetyAcknowledged || submitting}
              onClick={handleSubmitBooking}
              icon={CheckCircle2}
              className="shadow-md shadow-blue-500/20"
            >
              Confirm & Submit Booking
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
