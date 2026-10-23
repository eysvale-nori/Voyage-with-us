import React, { useState, useMemo } from 'react';
import { TravelMemory, TravelStatus } from '../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  Camera, 
  Share2, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Coins, 
  Users, 
  Sparkles, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { createPublicShareLink } from '../services/travelService';

interface JournalViewProps {
  memories: TravelMemory[];
  onEditMemory: (memory: TravelMemory) => void;
  onRequestDelete: (memory: TravelMemory) => void;
  onViewOnMap: (memory: TravelMemory) => void;
  onAddNew: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  memories,
  onEditMemory,
  onRequestDelete,
  onViewOnMap,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | TravelStatus>('All');
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedMemoryDetail, setSelectedMemoryDetail] = useState<TravelMemory | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Extract unique provinces present in memories
  const uniqueProvinces = useMemo(() => {
    const set = new Set(memories.map((m) => m.province));
    return Array.from(set).sort();
  }, [memories]);

  // Filter memories
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      if (selectedStatus !== 'All' && m.category !== selectedStatus) return false;
      if (selectedProvince !== 'All' && m.province !== selectedProvince) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.destination.toLowerCase().includes(q) ||
          m.province.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q) ||
          (m.notes && m.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [memories, selectedStatus, selectedProvince, searchQuery]);

  const handleShare = async (e: React.MouseEvent, memory: TravelMemory) => {
    e.stopPropagation();
    try {
      const shareUrl = await createPublicShareLink(memory);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(memory.id);
      setTimeout(() => setCopiedShareId(null), 3000);
    } catch (err) {
      console.error('Failed to create share link:', err);
      alert('Could not generate share link.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>My Travel Journal</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full">
              {memories.length} Entries
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your personal record of adventures across the 7,641 islands
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Memory</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-5 space-y-2.5">
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by destination, province, or stories..."
            className="w-full text-xs md:text-sm bg-transparent outline-none text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'All'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setSelectedStatus('Visited')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'Visited'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Visited
          </button>
          <button
            onClick={() => setSelectedStatus('Want to Visit')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'Want to Visit'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Wishlist
          </button>
          <button
            onClick={() => setSelectedStatus('Favorite')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'Favorite'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Favorites
          </button>

          {uniqueProvinces.length > 0 && (
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none"
            >
              <option value="All">All Provinces ({uniqueProvinces.length})</option>
              {uniqueProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 p-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No travel entries found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            {memories.length === 0
              ? 'Start pinning your Philippine journeys! Tap "Add Memory" to upload photos and save your memories.'
              : 'Try clearing your filters or searching for another destination.'}
          </p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Pin Your First Destination</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMemories.map((memory) => {
            const hasPhotos = memory.photos && memory.photos.length > 0;
            const heroPhoto = hasPhotos ? memory.photos[0] : null;

            return (
              <div
                key={memory.id}
                onClick={() => setSelectedMemoryDetail(memory)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Photo Thumbnail or Gradient Placeholder */}
                  {heroPhoto ? (
                    <div className="relative sm:w-48 h-44 sm:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img
                        src={heroPhoto.thumbnailUrl || heroPhoto.localPreviewUrl || heroPhoto.driveUrl}
                        alt={memory.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {memory.photos.length} photos
                      </span>
                    </div>
                  ) : (
                    <div className="relative sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-8 h-8 text-sky-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      {/* Status badge & Date */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            memory.category === 'Visited'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : memory.category === 'Want to Visit'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {memory.category}
                        </span>

                        {memory.visitDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {memory.visitDate}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-gray-900 group-hover:text-sky-600 transition">
                        {memory.destination}
                      </h3>
                      <p className="text-xs font-medium text-sky-700">
                        {memory.province}, {memory.region}
                      </p>

                      {/* Rating */}
                      {memory.rating ? (
                        <div className="flex items-center gap-0.5 my-1.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (memory.rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}

                      {/* Notes snippet */}
                      {memory.notes && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                          "{memory.notes}"
                        </p>
                      )}

                      {/* Highlight */}
                      {memory.favoriteMemories && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50/70 px-2 py-1 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="truncate">{memory.favoriteMemories}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-gray-500">
                        {memory.companions && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {memory.companions}
                          </span>
                        )}
                        {memory.expenses ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Coins className="w-3.5 h-3.5 text-gray-400" />
                            ₱{memory.expenses.toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOnMap(memory);
                          }}
                          title="Show on Google Map"
                          className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleShare(e, memory)}
                          title="Share Entry Link"
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditMemory(memory);
                          }}
                          title="Edit Memory"
                          className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(memory);
                          }}
                          title="Delete Memory"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Toast */}
      {copiedShareId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Read-only link copied to clipboard!</span>
        </div>
      )}

      {/* Full Travel Entry Detail Modal */}
      {selectedMemoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-sky-600 to-teal-600 text-white p-5">
              <button
                onClick={() => setSelectedMemoryDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 active:scale-95 text-white"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMemoryDetail.category === 'Visited'
                      ? 'bg-emerald-500 text-white'
                      : selectedMemoryDetail.category === 'Want to Visit'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-400 text-amber-950'
                  }`}
                >
                  {selectedMemoryDetail.category}
                </span>
                {selectedMemoryDetail.visitDate && (
                  <span className="text-xs text-sky-100">
                    {selectedMemoryDetail.visitDate}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{selectedMemoryDetail.destination}</h2>
              <p className="text-xs text-sky-100">
                {selectedMemoryDetail.province}, {selectedMemoryDetail.region}
              </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Photo Showcase */}
              {selectedMemoryDetail.photos && selectedMemoryDetail.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    Photos ({selectedMemoryDetail.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedMemoryDetail.photos.map((photo, i) => (
                      <div key={i} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                        <img
                          src={photo.thumbnailUrl || photo.localPreviewUrl || photo.driveUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        {photo.driveUrl && (
                          <a
                            href={photo.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-md text-white text-[10px] flex items-center gap-1"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white text-[10px] truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              {selectedMemoryDetail.rating ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="text-xs font-bold text-amber-900">Experience Rating:</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= (selectedMemoryDetail.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Journal Notes */}
              {selectedMemoryDetail.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Travel Journal Notes
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100 whitespace-pre-wrap">
                    {selectedMemoryDetail.notes}
                  </p>
                </div>
              )}

              {/* Highlight */}
              {selectedMemoryDetail.favoriteMemories && (
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Best Moments
                  </h4>
                  <p className="text-xs text-amber-950 bg-amber-50 p-3 rounded-xl border border-amber-200/80">
                    {selectedMemoryDetail.favoriteMemories}
                  </p>
                </div>
              )}

              {/* Extra details (companions & expenses) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedMemoryDetail.companions && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Companions
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedMemoryDetail.companions}
                    </span>
                  </div>
                )}
                {selectedMemoryDetail.expenses ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Travel Cost
                    </span>
                    <span className="font-semibold text-emerald-700">
                      ₱{selectedMemoryDetail.expenses.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50">
              <button
                onClick={() => {
                  const m = selectedMemoryDetail;
                  setSelectedMemoryDetail(null);
                  onViewOnMap(m);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded-xl transition"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Show on Map</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const m = selectedMemoryDetail;
                    setSelectedMemoryDetail(null);
                    onEditMemory(m);
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    const m = selectedMemoryDetail;
                    setSelectedMemoryDetail(null);
                    onRequestDelete(m);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
