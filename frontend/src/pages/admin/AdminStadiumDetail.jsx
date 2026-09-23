import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Edit2,
  MapPin,
  Clock,
  Users,
  ShieldAlert,
  Car,
  Maximize2,
  FileText,
  CheckCircle2,
  XCircle,
  Trophy
} from 'lucide-react';
import { stadiumAPI, adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/common/Button';

export default function AdminStadiumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stadium, setStadium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStadium = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stadiumAPI.getById(id);
      if (res.success && res.stadium) {
        setStadium(res.stadium);
      } else {
        setError(res.message || 'Stadium not found');
      }
    } catch (err) {
      console.error('Error fetching stadium:', err);
      setError(err.message || 'Failed to load stadium details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStadium();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
        Loading venue specifications...
      </div>
    );
  }

  if (error || !stadium) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-rose-900">Stadium Not Found</h3>
        <p className="text-xs text-rose-700">{error || 'Requested arena does not exist.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/stadiums')}>
          Return to Stadiums
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/stadiums')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stadiums</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => navigate(`/admin/stadiums/${stadium._id}/edit`)}
          >
            Edit Specifications
          </Button>
        </div>
      </div>

      {/* Main Stadium Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="h-48 lg:h-auto bg-slate-100 relative">
            <img
              src={stadium.image || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80'}
              alt={stadium.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <StatusBadge status={stadium.isActive ? 'active' : 'inactive'} />
            </div>
          </div>

          <div className="p-6 lg:col-span-2 space-y-4">
            <div>
              <div className="flex flex-wrap gap-1 mb-2">
                {stadium.sports?.map((sp, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[10px] font-bold border border-blue-100">
                    {sp}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-black text-[#172554] tracking-tight">{stadium.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{stadium.address || `${stadium.city}, ${stadium.state || ''} ${stadium.country || 'India'}`}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {stadium.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-black text-slate-400 block">Rate</span>
                <span className="font-black text-[#172554]">₹{stadium.pricePerHour?.toLocaleString('en-IN')} / hr</span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-black text-slate-400 block">Operating Hours</span>
                <span className="font-black text-[#172554]">{stadium.openingTime} - {stadium.closingTime}</span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-black text-slate-400 block">Player Cap</span>
                <span className="font-black text-[#2563EB]">{stadium.playerCapacity || stadium.capacity || 22} Athletes</span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-black text-slate-400 block">Audience Cap</span>
                <span className="font-black text-purple-700">
                  {stadium.audienceAllowed === false ? 'None' : (stadium.audienceCapacity ? `${stadium.audienceCapacity} seats` : 'Open')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 px-4 pt-2 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Capacity & Dimensions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'facilities' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Facilities & Parking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'safety' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Safety & Terms
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Athlete Capacity</span>
                  <span className="text-xl font-black text-[#172554]">{stadium.playerCapacity || stadium.capacity || 22}</span>
                  <p className="text-[11px] text-slate-500">Maximum concurrent players permitted on playing turf.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Audience Policy</span>
                  <span className={`text-base font-black ${stadium.audienceAllowed === false ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {stadium.audienceAllowed === false ? 'Audience Not Allowed' : 'Audience Permitted'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {stadium.audiencePassRequired ? 'Entry requires verified audience passes' : 'Open seating gallery'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Pitch Dimensions</span>
                  <span className="text-base font-black text-[#172554]">
                    {stadium.dimensions?.length && stadium.dimensions?.width
                      ? `${stadium.dimensions.length}m × ${stadium.dimensions.width}m`
                      : 'Standard Arena'}
                  </span>
                  <p className="text-[11px] text-slate-500">Playing surface boundary.</p>
                </div>
              </div>

              {stadium.audienceRules && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#172554]">
                  <strong className="block mb-0.5">Audience Guidelines:</strong>
                  <span>{stadium.audienceRules}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Verified Venue Facilities
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stadium.facilities?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-[#172554]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Parking Information
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-[#172554] block mb-1">
                    {stadium.parking?.available ? `Parking Available (${stadium.parking.capacity || 100} vehicles)` : 'No on-site parking'}
                  </span>
                  <p className="text-slate-500">Designated vehicle slots for players and spectators with security monitoring.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Safety Protocols
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {stadium.safetyRules?.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Terms & Conditions
                </h4>
                <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {stadium.termsAndConditions || 'Standard venue terms apply.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
