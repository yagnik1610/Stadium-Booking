import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Save,
  Users,
  ShieldAlert,
  Car,
  Maximize2,
  Clock,
  FileText,
  DollarSign,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { adminAPI, stadiumAPI } from '../../services/api';
import Button from '../../components/common/Button';

export default function AdminStadiumForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Phase 2C Media Upload States
  const [galleryImages, setGalleryImages] = useState([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: 'High-quality sports arena with professional turf and lighting.',
    location: 'Central Sports District',
    address: 'Stadium Boulevard, Sector 5',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380001',
    currency: 'INR',
    sports: 'Cricket, Football',
    pricePerHour: 1500,
    openingTime: '06:00',
    closingTime: '22:00',
    capacity: 22,
    playerCapacity: 22,
    audienceCapacity: 500,
    audienceAllowed: true,
    audiencePassRequired: false,
    audienceRules: 'Spectators must enter through Gate 2 with valid passes.',
    minDuration: 1,
    maxDuration: 4,
    gstRate: 18,
    length: 105,
    width: 68,
    parkingAvailable: true,
    parkingCapacity: 100,
    facilities: 'Floodlights, Changing Rooms, Parking, First Aid, Drinking Water, CCTV Security',
    safetyRules: 'Proper sports gear and athletic footwear required on playing surface\nFirst aid kit available with facility manager\nNo food or glass containers on turf',
    termsAndConditions: '1. Arrive 15 minutes before scheduled slot.\n2. Cancellations made at least 24 hours prior are eligible for rescheduling.\n3. Appropriate non-marking footwear mandatory.',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    isActive: true
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchExisting = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await stadiumAPI.getById(id);
        if (res.success && res.stadium) {
          const s = res.stadium;
          setFormData({
            name: s.name || '',
            description: s.description || '',
            location: s.location || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || 'India',
            postalCode: s.postalCode || '',
            currency: s.currency || 'INR',
            sports: Array.isArray(s.sports) ? s.sports.join(', ') : (s.sports || ''),
            pricePerHour: s.pricePerHour || 1000,
            openingTime: s.openingTime || '06:00',
            closingTime: s.closingTime || '22:00',
            capacity: s.capacity || 22,
            playerCapacity: s.playerCapacity || s.capacity || 22,
            audienceCapacity: s.audienceCapacity || 0,
            audienceAllowed: s.audienceAllowed !== false,
            audiencePassRequired: Boolean(s.audiencePassRequired),
            audienceRules: s.audienceRules || '',
            minDuration: s.minDuration || 1,
            maxDuration: s.maxDuration || 4,
            gstRate: s.gstRate !== undefined ? s.gstRate : 18,
            length: s.dimensions?.length || 105,
            width: s.dimensions?.width || 68,
            parkingAvailable: s.parking?.available !== false,
            parkingCapacity: s.parking?.capacity || 100,
            facilities: Array.isArray(s.facilities) ? s.facilities.join(', ') : '',
            safetyRules: Array.isArray(s.safetyRules) ? s.safetyRules.join('\n') : (s.safetyRules || ''),
            termsAndConditions: s.termsAndConditions || '',
            image: s.image || '',
            isActive: s.isActive !== false
          });
          setGalleryImages(Array.isArray(s.images) ? s.images : []);
        } else {
          setError(res.message || 'Stadium not found');
        }
      } catch (err) {
        console.error('Error fetching stadium for edit:', err);
        setError(err.message || 'Failed to load stadium details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExisting();
  }, [id, isEditMode]);

  // Handle Cover Image File Upload (Cloudinary)
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const data = new FormData();
      data.append('image', file);
      const res = await adminAPI.uploadStadiumCover(id, data);
      if (res.success && res.image) {
        setFormData(prev => ({ ...prev, image: res.image }));
        setUploadSuccess('Cover image uploaded successfully to Cloudinary!');
      } else {
        setUploadError(res.message || 'Failed to upload cover image.');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      setUploadError(err.message || 'Failed to upload cover image.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  // Handle Cover Image Deletion
  const handleCoverRemove = async () => {
    if (!window.confirm('Are you sure you want to remove the cover image?')) return;
    setCoverUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await adminAPI.deleteStadiumCover(id);
      setFormData(prev => ({ ...prev, image: '' }));
      setUploadSuccess('Cover image removed successfully.');
    } catch (err) {
      console.error('Cover removal error:', err);
      setUploadError(err.message || 'Failed to remove cover image.');
    } finally {
      setCoverUploading(false);
    }
  };

  // Handle Gallery Images File Upload (Cloudinary)
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 8) {
      setUploadError(`Maximum 8 gallery images allowed. Current: ${galleryImages.length}, attempting to add: ${files.length}.`);
      e.target.value = '';
      return;
    }

    setGalleryUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const data = new FormData();
      files.forEach(file => data.append('images', file));
      const res = await adminAPI.uploadStadiumGallery(id, data);
      if (res.success && res.images) {
        setGalleryImages(res.images);
        setUploadSuccess(`Uploaded ${files.length} gallery image(s) successfully!`);
      } else {
        setUploadError(res.message || 'Failed to upload gallery images.');
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setUploadError(err.message || 'Failed to upload gallery images.');
    } finally {
      setGalleryUploading(false);
      e.target.value = '';
    }
  };

  // Handle Single Gallery Image Deletion
  const handleGalleryDelete = async (imgIdentifier) => {
    if (!window.confirm('Are you sure you want to delete this gallery image?')) return;
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await adminAPI.deleteStadiumGalleryImage(id, imgIdentifier);
      if (res.success && res.images) {
        setGalleryImages(res.images);
        setUploadSuccess('Gallery image deleted successfully.');
      } else {
        setUploadError(res.message || 'Failed to delete gallery image.');
      }
    } catch (err) {
      console.error('Gallery delete error:', err);
      setUploadError(err.message || 'Failed to delete gallery image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const minDur = Number(formData.minDuration) || 1;
      const maxDur = Number(formData.maxDuration) || 4;
      const allowedDurs = [];
      for (let d = minDur; d <= maxDur; d++) allowedDurs.push(d);

      const sportsArray = formData.sports.split(',').map(s => s.trim()).filter(Boolean);
      const facilitiesArray = formData.facilities.split(',').map(s => s.trim()).filter(Boolean);
      const safetyArray = formData.safetyRules.split('\n').map(s => s.trim()).filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode ? formData.postalCode.trim() : undefined,
        currency: formData.currency ? formData.currency.trim() : 'INR',
        sports: sportsArray,
        pricePerHour: Number(formData.pricePerHour) || 1000,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        capacity: Number(formData.capacity) || Number(formData.playerCapacity) || 22,
        playerCapacity: Number(formData.playerCapacity) || 22,
        audienceCapacity: Number(formData.audienceCapacity) || 0,
        audienceAllowed: Boolean(formData.audienceAllowed),
        audiencePassRequired: Boolean(formData.audiencePassRequired),
        audienceRules: formData.audienceRules.trim(),
        minDuration: minDur,
        maxDuration: maxDur,
        allowedDurations: allowedDurs,
        durationIncrement: 1,
        gstRate: Number(formData.gstRate) || 0,
        dimensions: {
          length: Number(formData.length) || 105,
          width: Number(formData.width) || 68,
          unit: 'm'
        },
        parking: {
          available: Boolean(formData.parkingAvailable),
          capacity: Number(formData.parkingCapacity) || 0
        },
        facilities: facilitiesArray,
        safetyRules: safetyArray,
        termsAndConditions: formData.termsAndConditions.trim(),
        image: formData.image.trim(),
        isActive: Boolean(formData.isActive)
      };

      let res;
      if (isEditMode) {
        res = await adminAPI.updateStadium(id, payload);
      } else {
        res = await adminAPI.createStadium(payload);
      }

      if (res.success) {
        navigate('/admin/stadiums');
      } else {
        setError(res.message || 'Failed to save stadium.');
      }
    } catch (err) {
      console.error('Error saving stadium:', err);
      setError(err.message || 'An error occurred while saving stadium.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
        Loading stadium configuration form...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/stadiums')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stadiums</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-[#F8FAFC]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
            {isEditMode ? 'Modify Stadium Record' : 'Create New Stadium'}
          </span>
          <h2 className="text-xl font-black text-[#172554] tracking-tight mt-0.5">
            {isEditMode ? `Edit: ${formData.name}` : 'Register Arena & Facility Specifications'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure playing fields, audience capacities, operating hours, and billing rules.
          </p>
        </div>

        {error && (
          <div className="m-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Basic Identity & Location
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Stadium Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. National Sports Arena"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">General Location *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Central Sports District"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Street Address *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Gate 4, Stadium Boulevard"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ahmedabad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="e.g. 380001"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe turf, lighting, amenities, and accessibility..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sports, Timings & Pricing */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              2. Sports, Operating Hours & Pricing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">Supported Sports (comma separated) *</label>
                <input
                  required
                  type="text"
                  placeholder="Cricket, Football, Tennis"
                  value={formData.sports}
                  onChange={(e) => setFormData({ ...formData, sports: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Price Per Hour *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency</label>
                <input
                  type="text"
                  placeholder="e.g. INR"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Time (24h) *</label>
                <input
                  required
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Closing Time (24h) *</label>
                <input
                  required
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Min Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.minDuration}
                  onChange={(e) => setFormData({ ...formData, minDuration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.maxDuration}
                  onChange={(e) => setFormData({ ...formData, maxDuration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GST Billing Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={formData.gstRate}
                  onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Player Capacity vs Audience Spectator Management */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              3. Player & Audience Capacity Separation (Section 18–25)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Player Capacity (Turf Athletes) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.playerCapacity}
                  onChange={(e) => setFormData({ ...formData, playerCapacity: e.target.value, capacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
                <span className="text-[10px] text-slate-400">Strict maximum athletes permitted on playing turf.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audience Capacity (Spectator Seating)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.audienceCapacity}
                  onChange={(e) => setFormData({ ...formData, audienceCapacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
                <span className="text-[10px] text-slate-400">Total spectator gallery capacity.</span>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.audienceAllowed}
                    onChange={(e) => setFormData({ ...formData, audienceAllowed: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Audience / Spectators Permitted</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.audiencePassRequired}
                    onChange={(e) => setFormData({ ...formData, audiencePassRequired: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Audience Pass Required for Entry</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Audience Entry Guidelines & Restrictions</label>
                <input
                  type="text"
                  placeholder="e.g. Spectators must enter through Gate 2 with verified QR pass. Bags checked at security."
                  value={formData.audienceRules}
                  onChange={(e) => setFormData({ ...formData, audienceRules: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Physical Specs, Parking & Facilities */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              4. Dimensions, Parking & Facilities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pitch Length (m)</label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pitch Width (m)</label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parking Vehicle Capacity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.parkingCapacity}
                  onChange={(e) => setFormData({ ...formData, parkingCapacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Facilities List (comma separated)</label>
                <input
                  type="text"
                  placeholder="Floodlights, Changing Rooms, Parking, First Aid, Washrooms, Drinking Water"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Safety Rules & Terms */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              5. Safety Rules, Terms & Media
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Safety Guidelines (One per line)</label>
                <textarea
                  rows={3}
                  value={formData.safetyRules}
                  onChange={(e) => setFormData({ ...formData, safetyRules: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Media Management Section (Phase 2C) */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-black text-slate-800 text-sm">
                      Venue Media & Visual Assets
                    </label>
                    <p className="text-xs text-slate-500">
                      Upload high-resolution images to Cloudinary or specify external image URLs.
                    </p>
                  </div>
                </div>

                {uploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Cover Image Upload Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#2563EB]" />
                      Stadium Cover Image (Primary Display)
                    </span>
                    {formData.image && isEditMode && (
                      <button
                        type="button"
                        onClick={handleCoverRemove}
                        disabled={coverUploading}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Cover
                      </button>
                    )}
                  </div>

                  {formData.image && (
                    <div className="relative aspect-[16/9] max-h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={formData.image}
                        alt="Stadium Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {isEditMode ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Upload New Cover (Cloudinary)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleCoverUpload}
                          disabled={coverUploading}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2563EB] file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        {coverUploading && (
                          <span className="text-[11px] text-blue-600 animate-pulse block mt-1">
                            Uploading to Cloudinary...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic flex items-center">
                        Save stadium first to upload media via Cloudinary.
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Or External Cover URL (HTTPS)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery Images Upload Card (Edit Mode) */}
                {isEditMode && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Stadium Gallery ({galleryImages.length} / 8 Images)
                      </span>
                      {galleryImages.length < 8 && (
                        <label className="text-xs text-[#2563EB] hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Gallery Images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={handleGalleryUpload}
                            disabled={galleryUploading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {galleryUploading && (
                      <p className="text-xs text-blue-600 animate-pulse">
                        Uploading gallery images to Cloudinary...
                      </p>
                    )}

                    {galleryImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {galleryImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-100">
                            <img
                              src={imgUrl}
                              alt={`Gallery Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleGalleryDelete(imgUrl)}
                              title="Delete this image"
                              className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md opacity-80 group-hover:opacity-100 hover:bg-rose-700 shadow-xs transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No gallery images uploaded yet. You can add up to 8 photos.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Active & Discoverable by Public Athletes</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/admin/stadiums')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Stadium' : 'Register Stadium'}
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
