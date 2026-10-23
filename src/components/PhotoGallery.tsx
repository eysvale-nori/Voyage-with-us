import React, { useState, useMemo } from 'react';
import { TravelMemory, TravelPhoto } from '../types';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Download, 
  ExternalLink, 
  Trash2, 
  X, 
  Filter, 
  Image as ImageIcon,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PhotoGalleryProps {
  memories: TravelMemory[];
  onViewOnMap: (memory: TravelMemory) => void;
  onRequestDeletePhoto?: (memory: TravelMemory, photo: TravelPhoto) => void;
}

interface FlattenedPhotoItem {
  photo: TravelPhoto;
  memory: TravelMemory;
  dateStr: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  memories,
  onViewOnMap,
  onRequestDeletePhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Flatten all photos across all memories
  const allPhotos: FlattenedPhotoItem[] = useMemo(() => {
    const list: FlattenedPhotoItem[] = [];
    memories.forEach((mem) => {
      if (mem.photos && mem.photos.length > 0) {
        mem.photos.forEach((photo) => {
          list.push({
            photo,
            memory: mem,
            dateStr: mem.visitDate || photo.uploadedAt.split('T')[0] || 'Undated',
          });
        });
      }
    });

    // Sort newest to oldest
    return list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [memories]);

  // Extract years and provinces for filtering
  const { availableProvinces, availableYears } = useMemo(() => {
    const provinces = new Set<string>();
    const years = new Set<string>();

    allPhotos.forEach((item) => {
      if (item.memory.province) provinces.add(item.memory.province);
      if (item.dateStr && item.dateStr.length >= 4) {
        const y = item.dateStr.substring(0, 4);
        if (!isNaN(Number(y))) years.add(y);
      }
    });

    return {
      availableProvinces: Array.from(provinces).sort(),
      availableYears: Array.from(years).sort().reverse(),
    };
  }, [allPhotos]);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter((item) => {
      if (selectedProvince !== 'All' && item.memory.province !== selectedProvince) return false;
      if (selectedYear !== 'All' && !item.dateStr.startsWith(selectedYear)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.memory.destination.toLowerCase().includes(q) ||
          item.memory.province.toLowerCase().includes(q) ||
          item.memory.region.toLowerCase().includes(q) ||
          (item.photo.caption && item.photo.caption.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allPhotos, selectedProvince, selectedYear, searchQuery]);

  // Group photos by Year / Month for Google Photos look
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: FlattenedPhotoItem[] } = {};
    filteredPhotos.forEach((item) => {
      const groupKey = item.dateStr.length >= 7 ? item.dateStr.substring(0, 7) : 'Adventures';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredPhotos]);

  const activePhotoItem = activeLightboxIndex !== null ? filteredPhotos[activeLightboxIndex] : null;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && activeLightboxIndex < filteredPhotos.length - 1) {
      setActiveLightboxIndex(activeLightboxIndex + 1);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && activeLightboxIndex > 0) {
      setActiveLightboxIndex(activeLightboxIndex - 1);
    }
  };

  const handleDownload = (photo: TravelPhoto) => {
    const url = photo.driveUrl || photo.localPreviewUrl || photo.thumbnailUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = photo.name || 'philippine_travel_photo.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>Travel Photos Gallery</span>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
              {allPhotos.length} Photos
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Google Photos-style visual memories from all your Philippine destinations
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-5 space-y-2.5">
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos by destination, province, or caption..."
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
          {availableProvinces.length > 0 && (
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none"
            >
              <option value="All">All Provinces ({availableProvinces.length})</option>
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          )}

          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none"
            >
              <option value="All">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Photo Wall */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No photos found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {allPhotos.length === 0
              ? 'Photos you upload to your travel memories will appear in this gallery and sync directly to Google Drive.'
              : 'Try clearing your search query or province filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([monthGroup, items]) => (
            <div key={monthGroup}>
              {/* Sticky Month Header */}
              <div className="sticky top-14 z-10 bg-sky-50/90 backdrop-blur-md py-1.5 mb-2.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {monthGroup}
                </h3>
                <span className="text-[11px] text-gray-400">({items.length} photos)</span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {items.map((item) => {
                  const globalIdx = filteredPhotos.indexOf(item);
                  return (
                    <div
                      key={item.photo.id || globalIdx}
                      onClick={() => setActiveLightboxIndex(globalIdx)}
                      className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square cursor-pointer shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={item.photo.thumbnailUrl || item.photo.localPreviewUrl || item.photo.driveUrl}
                        alt={item.photo.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end text-white">
                        <p className="text-xs font-bold truncate">{item.memory.destination}</p>
                        <p className="text-[10px] text-sky-200 truncate">{item.memory.province}</p>
                        {item.photo.caption && (
                          <p className="text-[10px] text-gray-300 italic truncate mt-0.5">
                            "{item.photo.caption}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-Screen Lightbox */}
      {activePhotoItem && activeLightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-150"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Top Lightbox Bar */}
          <div 
            className="absolute top-3 left-3 right-3 flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                {activeLightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-xs text-gray-300 hidden sm:inline">
                {activePhotoItem.memory.destination} ({activePhotoItem.memory.province})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const mem = activePhotoItem.memory;
                  setActiveLightboxIndex(null);
                  onViewOnMap(mem);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold shadow-sm transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>

              <button
                onClick={() => handleDownload(activePhotoItem.photo)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                title="Download Photo"
              >
                <Download className="w-4 h-4" />
              </button>

              {activePhotoItem.photo.driveUrl && (
                <a
                  href={activePhotoItem.photo.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                  title="Open in Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {onRequestDeletePhoto && (
                <button
                  onClick={() => {
                    const item = activePhotoItem;
                    setActiveLightboxIndex(null);
                    onRequestDeletePhoto(item.memory, item.photo);
                  }}
                  className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setActiveLightboxIndex(null)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {activeLightboxIndex > 0 && (
            <button
              onClick={handlePrevPhoto}
              className="absolute left-3 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {activeLightboxIndex < filteredPhotos.length - 1 && (
            <button
              onClick={handleNextPhoto}
              className="absolute right-3 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Main Photo Center */}
          <div 
            className="max-w-4xl max-h-[82vh] flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                activePhotoItem.photo.thumbnailUrl ||
                activePhotoItem.photo.localPreviewUrl ||
                activePhotoItem.photo.driveUrl
              }
              alt={activePhotoItem.photo.name}
              className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Photo Caption & Location details */}
            <div className="mt-3 text-center text-white max-w-lg">
              <h4 className="text-sm font-bold flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{activePhotoItem.memory.destination}</span>
                <span className="text-gray-400 font-normal">
                  • {activePhotoItem.memory.province}
                </span>
              </h4>

              {activePhotoItem.photo.caption ? (
                <p className="text-xs text-sky-200 mt-1 italic">
                  "{activePhotoItem.photo.caption}"
                </p>
              ) : null}

              {activePhotoItem.dateStr && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Visited on {activePhotoItem.dateStr}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
