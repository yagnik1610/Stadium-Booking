import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/common/Button';

export default function AdminStadiums() {
  const navigate = useNavigate();
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Delete/Deactivate Confirmation
  const [deactivatingStadium, setDeactivatingStadium] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStadiums = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (sport) params.sport = sport;
      if (isActive !== '') params.isActive = isActive;

      const res = await adminAPI.getStadiums(params);
      if (res.success && Array.isArray(res.stadiums)) {
        setStadiums(res.stadiums);
        setPagination({
          totalPages: res.pagination?.totalPages || 1,
          total: res.total || res.stadiums.length
        });
      } else {
        setError(res.message || 'Failed to retrieve stadiums.');
      }
    } catch (err) {
      console.error('Error fetching admin stadiums:', err);
      setError(err.message || 'Network error fetching stadiums.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStadiums();
  }, [page, sport, isActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStadiums();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSport('');
    setIsActive('');
    setPage(1);
  };

  const handleToggleActive = async () => {
    if (!deactivatingStadium) return;
    setActionLoading(true);
    try {
      const newStatus = !deactivatingStadium.isActive;
      const res = await adminAPI.updateStadium(deactivatingStadium._id, { isActive: newStatus });
      if (res.success) {
        setStadiums(prev => prev.map(s => s._id === deactivatingStadium._id ? { ...s, isActive: newStatus } : s));
        setDeactivatingStadium(null);
      } else {
        alert(res.message || 'Failed to update arena status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update arena status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
            Arena Inventory
          </span>
          <h2 className="text-xl font-black text-[#172554] tracking-tight mt-1">
            Stadiums & Sports Arenas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure playing venues, player & audience limits, operating hours, and facilities.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => navigate('/admin/stadiums/new')}
        >
          Add New Stadium
        </Button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by venue name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <select
              value={sport}
              onChange={(e) => { setSport(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Sports</option>
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Tennis">Tennis</option>
              <option value="Basketball">Basketball</option>
              <option value="Badminton">Badminton</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Visibility</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive / Hidden Only</option>
            </select>

            {(search || sport || isActive) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                title="Clear filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Stadiums Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
            Loading stadiums inventory...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50">
            {error}
          </div>
        ) : stadiums.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No stadiums found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Stadium & Location</th>
                  <th className="py-3 px-4">Sports</th>
                  <th className="py-3 px-4">Player / Audience Cap</th>
                  <th className="py-3 px-4">Rate & Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stadiums.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172554] text-xs block">{s.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#2563EB]" />
                        <span>{s.city}, {s.state ? `${s.state}, ` : ''}{s.country || 'India'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.sports?.map((sp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[10px] font-bold border border-blue-100">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172554]">
                        Players: {s.playerCapacity || s.capacity || 22}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Audience: {s.audienceAllowed === false ? 'No' : (s.audienceCapacity ? `${s.audienceCapacity} seats` : 'Open')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172554]">
                        ₹{s.pricePerHour ? s.pricePerHour.toLocaleString('en-IN') : 0} / hr
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {s.openingTime} - {s.closingTime}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Eye}
                          onClick={() => navigate(`/admin/stadiums/${s._id}`)}
                          title="Inspect stadium configuration"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Edit2}
                          onClick={() => navigate(`/admin/stadiums/${s._id}/edit`)}
                          title="Edit stadium details"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeactivatingStadium(s)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            s.isActive
                              ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.isActive ? 'Deactivate venue' : 'Activate venue'}
                        >
                          {s.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivatingStadium}
        title={deactivatingStadium?.isActive ? 'Deactivate Stadium' : 'Activate Stadium'}
        message={
          deactivatingStadium?.isActive
            ? `Are you sure you want to deactivate ${deactivatingStadium?.name}? It will be hidden from public search and cannot be booked by users.`
            : `Are you sure you want to activate ${deactivatingStadium?.name}? It will become immediately discoverable and bookable.`
        }
        confirmLabel={deactivatingStadium?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={deactivatingStadium?.isActive ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleToggleActive}
        onClose={() => setDeactivatingStadium(null)}
      />

    </div>
  );
}
