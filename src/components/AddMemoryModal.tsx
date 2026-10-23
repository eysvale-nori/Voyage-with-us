import React, { useState, useEffect, useRef } from 'react';
import { TravelMemory, TravelPhoto, TravelStatus } from '../types';
import { PHILIPPINE_PROVINCES, PHILIPPINE_REGIONS } from '../data/philippinesData';
import { 
  X, 
  Camera, 
  Upload, 
  MapPin, 
  Star, 
  Calendar, 
  Users, 
  Coins, 
  Heart, 
  Sparkles, 
  Trash2, 
  CloudUpload, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getOrCreateAppFolder, getOrCreateSubfolder, uploadPhotoToDrive } from '../services/driveService';
import { saveTravelMemory, updateTravelMemory } from '../services/travelService';
import confetti from 'canvas-confetti';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  accessToken: string | null;
  initialCoords?: { lat: number; lng: number; destinationName?: string; province?: string } | null;
  editingMemory?: TravelMemory | null;
  onSaved: (savedMemoryId: string, memory?: TravelMemory) => void;
  onRequestGoogleLogin?: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  userId,
  accessToken,
  initialCoords,
  editingMemory,
  onSaved,
  onRequestGoogleLogin,
}) => {
  const [destination, setDestination] = useState('');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState<TravelStatus>('Visited');
  const [latitude, setLatitude] = useState<number>(12.8797);
  const [longitude, setLongitude] = useState<number>(121.7740);
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [companions, setCompanions] = useState('');
  const [expenses, setExpenses] = useState<string>('');
  const [favoriteMemories, setFavoriteMemories] = useState('');
  
  // Photos state
  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string; caption: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editingMemory) {
      setDestination(editingMemory.destination);
      setProvince(editingMemory.province);
      setRegion(editingMemory.region);
      setCategory(editingMemory.category);
      setLatitude(editingMemory.latitude);
      setLongitude(editingMemory.longitude);
      setVisitDate(editingMemory.visitDate || new Date().toISOString().split('T')[0]);
      setRating(editingMemory.rating || 5);
      setNotes(editingMemory.notes || '');
      setCompanions(editingMemory.companions || '');
      setExpenses(editingMemory.expenses ? String(editingMemory.expenses) : '');
      setFavoriteMemories(editingMemory.favoriteMemories || '');
      setPhotos(editingMemory.photos || []);
      setPendingFiles([]);
      setErrorMessage('');
    } else {
      if (initialCoords) {
        setLatitude(initialCoords.lat);
        setLongitude(initialCoords.lng);
        if (initialCoords.destinationName) setDestination(initialCoords.destinationName);
        if (initialCoords.province) {
          setProvince(initialCoords.province);
          const pMatch = PHILIPPINE_PROVINCES.find((p) => p.name.toLowerCase() === initialCoords.province?.toLowerCase());
          if (pMatch) setRegion(pMatch.regionCode);
        }
      } else {
        setDestination('');
        setProvince('Palawan');
        setRegion('MIMAROPA');
        setLatitude(9.8349);
        setLongitude(118.7384);
      }
      setCategory('Visited');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setRating(5);
      setNotes('');
      setCompanions('');
      setExpenses('');
      setFavoriteMemories('');
      setPhotos([]);
      setPendingFiles([]);
      setErrorMessage('');
    }
  }, [editingMemory, initialCoords, isOpen]);

  // Auto-fill region when province changes
  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const match = PHILIPPINE_PROVINCES.find((p) => p.name === newProvince);
    if (match) {
      setRegion(match.regionCode);
    }
  };

  // Handle selected photo files
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const newItems = selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));
    setPendingFiles((prev) => [...prev, ...newItems].slice(0, 20)); // maximum 20 photos
  };

  // Remove existing photo
  const handleRemoveExistingPhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove pending file
  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Save Travel Memory
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setErrorMessage('Please enter a destination name.');
      return;
    }
    if (!province.trim()) {
      setErrorMessage('Please select a province.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setUploadProgress('Preparing your travel memory...');

    try {
      const uploadedPhotos: TravelPhoto[] = [...photos];

      // If user has pending files and an access token, upload to Google Drive!
      if (pendingFiles.length > 0 && accessToken) {
        setUploadProgress('Connecting to your Google Drive...');
        const appFolderId = await getOrCreateAppFolder(accessToken);
        
        setUploadProgress(`Organizing photos in Google Drive / ${province}...`);
        const subfolderId = await getOrCreateSubfolder(accessToken, appFolderId, province || 'General');

        for (let i = 0; i < pendingFiles.length; i++) {
          const item = pendingFiles[i];
          setUploadProgress(`Uploading photo ${i + 1} of ${pendingFiles.length} to Google Drive...`);
          
          try {
            const driveResult = await uploadPhotoToDrive(accessToken, item.file, subfolderId, item.caption);
            uploadedPhotos.push({
              id: `photo_${Date.now()}_${i}`,
              name: item.file.name,
              caption: item.caption,
              driveFileId: driveResult.fileId,
              driveUrl: driveResult.webViewLink,
              thumbnailUrl: driveResult.thumbnailUrl,
              localPreviewUrl: item.previewUrl,
              uploadedAt: new Date().toISOString(),
              sizeBytes: item.file.size,
            });
          } catch (uploadErr) {
            console.error('Drive upload error:', uploadErr);
            // Fallback to storing local preview so user does not lose their photos
            uploadedPhotos.push({
              id: `photo_${Date.now()}_${i}`,
              name: item.file.name,
              caption: item.caption,
              localPreviewUrl: item.previewUrl,
              uploadedAt: new Date().toISOString(),
              sizeBytes: item.file.size,
            });
          }
        }
      } else if (pendingFiles.length > 0 && !accessToken) {
        // User not logged in to Google Drive yet; store preview URLs locally
        pendingFiles.forEach((item, i) => {
          uploadedPhotos.push({
            id: `photo_${Date.now()}_${i}`,
            name: item.file.name,
            caption: item.caption,
            localPreviewUrl: item.previewUrl,
            uploadedAt: new Date().toISOString(),
            sizeBytes: item.file.size,
          });
        });
      }

      setUploadProgress('Saving to your Philippine Travel Journal...');

      const memoryPayload = {
        userId,
        destination: destination.trim(),
        province: province.trim(),
        region: region.trim() || 'NCR',
        category,
        latitude: Number(latitude),
        longitude: Number(longitude),
        visitDate,
        rating: Number(rating),
        notes: notes.trim(),
        companions: companions.trim(),
        expenses: expenses ? Number(expenses) : 0,
        favoriteMemories: favoriteMemories.trim(),
        photos: uploadedPhotos,
      };

      let resultId = editingMemory?.id || '';
      let finalMemory: TravelMemory;

      if (editingMemory) {
        resultId = editingMemory.id;
        finalMemory = {
          ...editingMemory,
          ...memoryPayload,
          id: resultId,
        };
        if (userId && userId !== 'guest') {
          await updateTravelMemory(userId, editingMemory.id, memoryPayload);
        }
      } else {
        if (userId && userId !== 'guest') {
          resultId = await saveTravelMemory(userId, memoryPayload);
        } else {
          resultId = `local_${Date.now()}`;
        }
        finalMemory = {
          ...memoryPayload,
          id: resultId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Confetti burst for new visited destination!
        if (category === 'Visited' || category === 'Favorite') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0284c7', '#10b981', '#f59e0b', '#ec4899'],
          });
        }
      }

      setIsSaving(false);
      onSaved(resultId, finalMemory);
      onClose();
    } catch (err: any) {
      console.error('Failed to save memory:', err);
      setIsSaving(false);
      setErrorMessage(err.message || 'Failed to save travel memory. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-600 to-teal-600 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇵🇭</span>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {editingMemory ? 'Edit Travel Memory' : 'Add Travel Memory'}
              </h2>
              <p className="text-xs text-sky-100">
                {editingMemory ? 'Update your pinned adventure' : 'Pin a place & upload to Google Drive'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account & Google Drive Status Notice */}
          {!accessToken ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
              <div>
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>💡</span> Guest Mode
                </span>
                <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
                  Anyone can add pins and test photos in this session. Sign in with Google to permanently save photos to your personal Google Drive and sync across all your phones & devices.
                </p>
              </div>
              {onRequestGoogleLogin && (
                <button
                  type="button"
                  onClick={onRequestGoogleLogin}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm transition"
                >
                  Sign In
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
              <CloudUpload className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-[11px] font-medium">
                Google Drive connected. Photos will be saved to your personal Drive in <strong>My Philippine Travel Map / {province || 'General'}</strong>.
              </span>
            </div>
          )}

          {/* Category Selector (Visited / Want to Visit / Favorite) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Travel Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('Visited')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                  category === 'Visited'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Visited</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('Want to Visit')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                  category === 'Want to Visit'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Wishlist</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('Favorite')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                  category === 'Favorite'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Favorite</span>
              </button>
            </div>
          </div>

          {/* Destination Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Destination / Spot Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. El Nido Hidden Beach, Boracay White Beach"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
              />
            </div>
          </div>

          {/* Province & Region Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Province (82 Provinces) *
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white transition"
              >
                {PHILIPPINE_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.islandGroup})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Administrative Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white transition"
              >
                {PHILIPPINE_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates (with manual tweak option) */}
          <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
            <div className="flex items-center justify-between text-xs text-sky-900 font-semibold mb-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Map Coordinates
              </span>
              <span className="text-[11px] text-sky-600 font-normal">
                Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                placeholder="Latitude"
                className="bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 text-gray-700"
              />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                placeholder="Longitude"
                className="bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 text-gray-700"
              />
            </div>
          </div>

          {/* Visit Date & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {category === 'Want to Visit' ? 'Target Date / Year' : 'Date Visited'}
              </label>
              <div className="flex items-center px-3 py-2 rounded-xl border border-gray-200 bg-white">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full text-xs text-gray-700 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Personal Rating ({rating} Stars)
              </label>
              <div className="flex items-center gap-1.5 py-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Upload Section (Connected to Google Drive) */}
          <div className="border border-sky-100 bg-sky-50/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold text-sky-950">
                  Travel Photos & Memories
                </label>
                <p className="text-[11px] text-sky-700">
                  {accessToken
                    ? `Photos will be saved to Google Drive / My Philippine Travel Map / ${province}`
                    : 'Connect Google Drive in Profile to enable direct Drive syncing'}
                </p>
              </div>
              <CloudUpload className="w-5 h-5 text-sky-600" />
            </div>

            {/* Action buttons: Pick from Gallery or Camera */}
            <div className="grid grid-cols-2 gap-2 my-2.5">
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200 active:scale-95 shadow-sm transition"
              >
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Upload Gallery</span>
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200 active:scale-95 shadow-sm transition"
              >
                <Camera className="w-4 h-4 text-sky-600" />
                <span>Take Photo</span>
              </button>
            </div>

            {/* Photo Previews List */}
            {(photos.length > 0 || pendingFiles.length > 0) && (
              <div className="mt-3 space-y-2">
                {/* Existing photos */}
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <img
                      src={photo.thumbnailUrl || photo.localPreviewUrl || photo.driveUrl}
                      alt={photo.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{photo.name}</p>
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhotos((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, caption: val } : p))
                          );
                        }}
                        placeholder="Add caption..."
                        className="w-full text-[11px] text-gray-600 mt-1 px-1.5 py-0.5 border-b border-gray-200 focus:border-sky-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Pending files to upload */}
                {pendingFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 bg-sky-50/80 rounded-xl border border-sky-200 shadow-sm"
                  >
                    <img
                      src={item.previewUrl}
                      alt="New preview"
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                          New
                        </span>
                        <p className="text-xs font-medium text-gray-800 truncate">{item.file.name}</p>
                      </div>
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingFiles((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, caption: val } : p))
                          );
                        }}
                        placeholder="Add photo caption..."
                        className="w-full text-[11px] text-gray-600 mt-1 px-1.5 py-0.5 border-b border-sky-300 focus:border-sky-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Travel Journal Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Travel Notes & Memories
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What made this place unforgettable? Stories, best food, local people, advice..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
            />
          </div>

          {/* Optional: Companions, Expenses, Favorite Moments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                Travel Companions (Optional)
              </label>
              <input
                type="text"
                value={companions}
                onChange={(e) => setCompanions(e.target.value)}
                placeholder="Solo, Family, Barkada, Partner"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-gray-400" />
                Expenses (Optional in PHP ₱)
              </label>
              <input
                type="number"
                min="0"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Highlight / Best Memory
            </label>
            <input
              type="text"
              value={favoriteMemories}
              onChange={(e) => setFavoriteMemories(e.target.value)}
              placeholder="e.g. Swimming with sea turtles at sunrise, sunset at Basco"
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 outline-none"
            />
          </div>

          {/* Submit Button & Progress Indicator */}
          <div className="pt-2 sticky bottom-0 bg-white">
            {isSaving && (
              <div className="mb-2 p-2.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2 text-xs font-medium text-sky-800">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 flex-shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Memory...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingMemory ? 'Update Travel Memory' : 'Save Memory 🇵🇭'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
