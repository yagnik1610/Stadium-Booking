import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Save
} from 'lucide-react';
import { sportAPI } from '../../services/api';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/common/Button';

export default function AdminSports() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultMinDuration: 1,
    defaultMaxDuration: 3,
    minPlayers: 2,
    maxPlayers: 22,
    teamRequired: false,
    equipmentRentalAvailable: true,
    safetyRules: 'Proper athletic footwear required',
    terms: 'Follow all standard sports regulations.',
    isActive: true
  });

  // Deactivate/Delete confirmation
  const [deactivatingSport, setDeactivatingSport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sportAPI.getAll({ all: true });
      if (res.success && Array.isArray(res.sports)) {
        setSports(res.sports);
      } else {
        setError(res.message || 'Failed to retrieve sports.');
      }
    } catch (err) {
      console.error('Error fetching sports:', err);
      setError(err.message || 'Network error loading sports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const handleOpenAdd = () => {
    setEditingSport(null);
    setFormData({
      name: '',
      description: '',
      defaultMinDuration: 1,
      defaultMaxDuration: 3,
      minPlayers: 2,
      maxPlayers: 22,
      teamRequired: false,
      equipmentRentalAvailable: true,
      safetyRules: 'Proper athletic footwear required',
      terms: 'Follow all standard sports regulations.',
      isActive: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sport) => {
    setEditingSport(sport);
    setFormData({
      name: sport.name || '',
      description: sport.description || '',
      defaultMinDuration: sport.defaultMinDuration || 1,
      defaultMaxDuration: sport.defaultMaxDuration || 3,
      minPlayers: sport.minPlayers || 2,
      maxPlayers: sport.maxPlayers || 22,
      teamRequired: Boolean(sport.teamRequired),
      equipmentRentalAvailable: sport.equipmentRentalAvailable !== false,
      safetyRules: Array.isArray(sport.safetyRules) ? sport.safetyRules.join('\n') : (sport.safetyRules || ''),
      terms: sport.terms || '',
      isActive: sport.isActive !== false
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        defaultMinDuration: Number(formData.defaultMinDuration) || 1,
        defaultMaxDuration: Number(formData.defaultMaxDuration) || 3,
        minPlayers: Number(formData.minPlayers) || 2,
        maxPlayers: Number(formData.maxPlayers) || 22,
        teamRequired: Boolean(formData.teamRequired),
        equipmentRentalAvailable: Boolean(formData.equipmentRentalAvailable),
        safetyRules: formData.safetyRules.split('\n').map(r => r.trim()).filter(Boolean),
        terms: formData.terms.trim(),
        isActive: Boolean(formData.isActive)
      };

      let res;
      if (editingSport) {
        res = await sportAPI.update(editingSport._id, payload);
      } else {
        res = await sportAPI.create(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchSports();
      } else {
        setFormError(res.message || 'Failed to save sport.');
      }
    } catch (err) {
      console.error('Error saving sport:', err);
      setFormError(err.message || 'Error occurred while saving sport.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!deactivatingSport) return;
    setActionLoading(true);
    try {
      const newStatus = !deactivatingSport.isActive;
      const res = await sportAPI.update(deactivatingSport._id, { isActive: newStatus });
      if (res.success) {
        setSports(prev => prev.map(s => s._id === deactivatingSport._id ? { ...s, isActive: newStatus } : s));
        setDeactivatingSport(null);
      } else {
        alert(res.message || 'Failed to update sport status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update sport status.');
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
            Discipline Management
          </span>
          <h2 className="text-xl font-black text-[#172554] tracking-tight mt-1">
            Supported Sports & Disciplines
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sport-specific participant requirements, duration windows, and equipment options.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          Add New Sport
        </Button>
      </div>

      {/* Sports Grid Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading sports disciplines...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
          {error}
        </div>
      ) : sports.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          No sports registered yet. Click "Add New Sport" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sports.map((sport) => (
            <div
              key={sport._id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-[#172554] tracking-tight">
                      {sport.name}
                    </h3>
                  </div>
                  <StatusBadge status={sport.isActive ? 'active' : 'inactive'} />
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {sport.description || 'No description configured.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-slate-200/80">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Players</span>
                    <span className="font-bold text-[#172554]">{sport.minPlayers} - {sport.maxPlayers}</span>
                  </div>
                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-slate-200/80">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Duration</span>
                    <span className="font-bold text-[#172554]">{sport.defaultMinDuration} - {sport.defaultMaxDuration}h</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-600">
                  <span className={`font-semibold ${sport.teamRequired ? 'text-[#2563EB]' : 'text-slate-500'}`}>
                    {sport.teamRequired ? '• Team Name Mandatory' : '• Individual / Friendly'}
                  </span>
                  {sport.equipmentRentalAvailable && (
                    <span className="text-emerald-700 font-semibold">• Equipment Rental</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="xs"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(sport)}
                >
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => setDeactivatingSport(sport)}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    sport.isActive
                      ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={sport.isActive ? 'Deactivate sport' : 'Activate sport'}
                >
                  {sport.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sport Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
                  {editingSport ? 'Update Sport' : 'New Sport Discipline'}
                </span>
                <h3 className="font-bold text-sm text-[#172554] mt-0.5">
                  {editingSport ? `Edit ${editingSport.name}` : 'Register Sport Specifications'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sport Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cricket, Football, Tennis"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Pitch and equipment details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Players</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minPlayers}
                    onChange={(e) => setFormData({ ...formData, minPlayers: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Players</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Duration (Hrs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultMinDuration}
                    onChange={(e) => setFormData({ ...formData, defaultMinDuration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Duration (Hrs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultMaxDuration}
                    onChange={(e) => setFormData({ ...formData, defaultMaxDuration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.teamRequired}
                    onChange={(e) => setFormData({ ...formData, teamRequired: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Team Name Required</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.equipmentRentalAvailable}
                    onChange={(e) => setFormData({ ...formData, equipmentRentalAvailable: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Equipment Rental</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Safety Guidelines (One per line)</label>
                <textarea
                  rows={2}
                  value={formData.safetyRules}
                  onChange={(e) => setFormData({ ...formData, safetyRules: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={Save} disabled={submitting}>
                  {submitting ? 'Saving...' : editingSport ? 'Update Sport' : 'Create Sport'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivatingSport}
        title={deactivatingSport?.isActive ? 'Deactivate Sport' : 'Activate Sport'}
        message={
          deactivatingSport?.isActive
            ? `Are you sure you want to deactivate ${deactivatingSport?.name}? It will be hidden from new arena configurations.`
            : `Are you sure you want to activate ${deactivatingSport?.name}?`
        }
        confirmLabel={deactivatingSport?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={deactivatingSport?.isActive ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleToggleActive}
        onClose={() => setDeactivatingSport(null)}
      />

    </div>
  );
}
