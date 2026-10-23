import React, { useState, useCallback, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { TravelMemory, CuratedDestination } from '../types';
import { PHILIPPINES_CENTER, DEFAULT_ZOOM, ISLAND_GROUPS, TOP_DESTINATIONS } from '../data/philippinesData';
import { 
  Navigation, 
  Search, 
  MapPin, 
  Star, 
  Plus, 
  CheckCircle, 
  Heart, 
  Bookmark, 
  Layers, 
  Camera,
  ExternalLink,
  LocateFixed
} from 'lucide-react';

interface TravelMapProps {
  memories: TravelMemory[];
  onSelectMemory: (memory: TravelMemory) => void;
  onAddNewAtLocation: (coords: { lat: number; lng: number; destinationName?: string; province?: string }) => void;
  focusedMemoryId?: string | null;
}

// Map Controller for smooth panning and zooming
const MapController: React.FC<{ targetCoords: { lat: number; lng: number } | null; zoom?: number }> = ({
  targetCoords,
  zoom,
}) => {
  const map = useMap();

  React.useEffect(() => {
    if (map && targetCoords) {
      map.panTo(targetCoords);
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, targetCoords, zoom]);

  return null;
};

export const TravelMap: React.FC<TravelMapProps> = ({
  memories,
  onSelectMemory,
  onAddNewAtLocation,
  focusedMemoryId,
}) => {
  const [activeIslandGroup, setActiveIslandGroup] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'All' | 'Visited' | 'Want to Visit' | 'Favorite'>('All');
  const [selectedPin, setSelectedPin] = useState<{
    type: 'memory' | 'curated' | 'custom_dropped';
    memory?: TravelMemory;
    curated?: CuratedDestination;
    coords: { lat: number; lng: number };
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [targetView, setTargetView] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);

  // Filter memories by category
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      if (filterCategory !== 'All' && m.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.destination.toLowerCase().includes(q) ||
          m.province.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [memories, filterCategory, searchQuery]);

  // Curated tourist destinations that don't already have a user memory
  const availableCuratedSpots = useMemo(() => {
    const memoryKeys = new Set(
      memories.map((m) => `${m.latitude.toFixed(3)}_${m.longitude.toFixed(3)}`)
    );
    return TOP_DESTINATIONS.filter((spot) => {
      const key = `${spot.latitude.toFixed(3)}_${spot.longitude.toFixed(3)}`;
      const matchesSearch = searchQuery.trim()
        ? spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          spot.province.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return !memoryKeys.has(key) && matchesSearch;
    });
  }, [memories, searchQuery]);

  // When focusedMemoryId changes from another tab (e.g. Gallery 'Show on Map')
  React.useEffect(() => {
    if (focusedMemoryId) {
      const match = memories.find((m) => m.id === focusedMemoryId);
      if (match) {
        setTargetView({ lat: match.latitude, lng: match.longitude, zoom: 12 });
        setSelectedPin({
          type: 'memory',
          memory: match,
          coords: { lat: match.latitude, lng: match.longitude },
        });
      }
    }
  }, [focusedMemoryId, memories]);

  // Island group quick switch
  const handleIslandSelect = (group: typeof ISLAND_GROUPS[0]) => {
    setActiveIslandGroup(group.id);
    setTargetView({ lat: group.center.lat, lng: group.center.lng, zoom: group.zoom });
  };

  // Get current device location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTargetView({ ...coords, zoom: 13 });
        setDroppedPin(coords);
        setSelectedPin({
          type: 'custom_dropped',
          coords,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not determine your location. Please check your location permission settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle map click to drop a new custom pin
  const handleMapClick = useCallback((e: any) => {
    if (e.detail?.latLng) {
      const coords = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
      setDroppedPin(coords);
      setSelectedPin({
        type: 'custom_dropped',
        coords,
      });
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-130px)] md:h-[calc(100vh-80px)] overflow-hidden bg-sky-50">
      {/* Top Floating Mobile Search & Filters */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 max-w-md mx-auto pointer-events-none">
        {/* Search bar */}
        <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-sky-100 px-3.5 py-2.5 transition focus-within:ring-2 focus-within:ring-sky-500">
          <Search className="w-4 h-4 text-sky-600 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Palawan, Boracay, Batanes..."
            className="w-full text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-1 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Island Group Switcher & Category Filter Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* Island Pills */}
          {ISLAND_GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={() => handleIslandSelect(group)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                activeIslandGroup === group.id
                  ? 'bg-sky-600 text-white shadow-sky-200'
                  : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/80'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Pin Status Legend Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterCategory('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filterCategory === 'All'
                ? 'bg-gray-800 text-white'
                : 'bg-white/90 text-gray-600 border border-gray-200'
            }`}
          >
            All Pins
          </button>
          <button
            onClick={() => setFilterCategory('Visited')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'Visited'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/90 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Visited ({memories.filter((m) => m.category === 'Visited').length})
          </button>
          <button
            onClick={() => setFilterCategory('Want to Visit')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'Want to Visit'
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            Want to Visit ({memories.filter((m) => m.category === 'Want to Visit').length})
          </button>
          <button
            onClick={() => setFilterCategory('Favorite')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'Favorite'
                ? 'bg-amber-500 text-white'
                : 'bg-white/90 text-amber-800 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Favorite ({memories.filter((m) => m.category === 'Favorite').length})
          </button>
        </div>
      </div>

      {/* Floating GPS & Action Buttons */}
      <div className="absolute right-3 bottom-24 md:bottom-8 z-10 flex flex-col gap-2.5">
        <button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          title="Detect Current Location"
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-xl border border-sky-100 text-sky-600 hover:bg-sky-50 active:scale-95 transition"
        >
          <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
        </button>

        <button
          onClick={() => {
            const center = targetView || PHILIPPINES_CENTER;
            onAddNewAtLocation({ lat: center.lat, lng: center.lng });
          }}
          title="Add Memory Here"
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 shadow-xl text-white hover:opacity-95 active:scale-95 transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Instructions Overlay for Dropping Pins */}
      <div className="absolute left-3 bottom-24 md:bottom-8 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-sky-100 text-[11px] font-medium text-sky-900 hidden sm:flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>Tap anywhere on the map to pin a new adventure spot</span>
        </div>
      </div>

      {/* Google Map Container with explicit styling */}
      <Map
        defaultCenter={PHILIPPINES_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onClick={handleMapClick}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        streetViewControl={false}
        mapTypeControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapController targetCoords={targetView} zoom={targetView?.zoom} />

        {/* User Travel Memories Pins */}
        {filteredMemories.map((memory) => {
          // Color coding as requested:
          // Green: Visited
          // Red: Want to Visit
          // Yellow: Favorite
          let background = '#10b981'; // Green
          let glyphColor = '#ffffff';
          let borderColor = '#059669';

          if (memory.category === 'Want to Visit') {
            background = '#ef4444'; // Red
            borderColor = '#dc2626';
          } else if (memory.category === 'Favorite') {
            background = '#f59e0b'; // Yellow/Gold
            borderColor = '#d97706';
            glyphColor = '#78350f';
          }

          return (
            <AdvancedMarker
              key={memory.id}
              position={{ lat: memory.latitude, lng: memory.longitude }}
              title={memory.destination}
              onClick={() =>
                setSelectedPin({
                  type: 'memory',
                  memory,
                  coords: { lat: memory.latitude, lng: memory.longitude },
                })
              }
            >
              <Pin
                background={background}
                borderColor={borderColor}
                glyphColor={glyphColor}
                scale={1.15}
              />
            </AdvancedMarker>
          );
        })}

        {/* Curated Iconic Destinations (unvisited spots as discoverable light-blue markers) */}
        {filterCategory === 'All' &&
          availableCuratedSpots.map((spot) => (
            <AdvancedMarker
              key={spot.id}
              position={{ lat: spot.latitude, lng: spot.longitude }}
              title={spot.name}
              onClick={() =>
                setSelectedPin({
                  type: 'curated',
                  curated: spot,
                  coords: { lat: spot.latitude, lng: spot.longitude },
                })
              }
            >
              <div className="relative group cursor-pointer transition hover:scale-110">
                <div className="w-7 h-7 rounded-full bg-white/95 border-2 border-sky-500 shadow-md flex items-center justify-center text-sky-600">
                  <Bookmark className="w-3.5 h-3.5 fill-sky-100" />
                </div>
              </div>
            </AdvancedMarker>
          ))}

        {/* Custom Dropped Pin */}
        {droppedPin && (
          <AdvancedMarker
            position={droppedPin}
            title="Custom Dropped Pin"
            onClick={() =>
              setSelectedPin({
                type: 'custom_dropped',
                coords: droppedPin,
              })
            }
          >
            <Pin
              background="#8b5cf6"
              borderColor="#7c3aed"
              glyphColor="#ffffff"
              scale={1.25}
            />
          </AdvancedMarker>
        )}

        {/* Selected Pin Info Card (Bottom Sheet on Mobile or InfoWindow) */}
        {selectedPin && (
          <InfoWindow
            position={selectedPin.coords}
            onCloseClick={() => setSelectedPin(null)}
            maxWidth={320}
          >
            <div className="p-1 max-w-[280px]">
              {selectedPin.type === 'memory' && selectedPin.memory && (
                <div>
                  {selectedPin.memory.photos.length > 0 && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2.5 bg-gray-100">
                      <img
                        src={
                          selectedPin.memory.photos[0].thumbnailUrl ||
                          selectedPin.memory.photos[0].localPreviewUrl ||
                          selectedPin.memory.photos[0].driveUrl
                        }
                        alt={selectedPin.memory.destination}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {selectedPin.memory.photos.length} photos
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedPin.memory.category === 'Visited'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedPin.memory.category === 'Want to Visit'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedPin.memory.category}
                    </span>
                    {selectedPin.memory.visitDate && (
                      <span className="text-[11px] text-gray-500">
                        {selectedPin.memory.visitDate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 leading-snug">
                    {selectedPin.memory.destination}
                  </h3>
                  <p className="text-xs text-sky-700 font-medium">
                    {selectedPin.memory.province}, {selectedPin.memory.region}
                  </p>

                  {selectedPin.memory.rating ? (
                    <div className="flex items-center gap-0.5 my-1.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (selectedPin.memory?.rating || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}

                  {selectedPin.memory.notes && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                      "{selectedPin.memory.notes}"
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onSelectMemory(selectedPin.memory!)}
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold rounded-lg text-center transition"
                    >
                      Open Journal Entry
                    </button>
                  </div>
                </div>
              )}

              {selectedPin.type === 'curated' && selectedPin.curated && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      Tourist Spot
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {selectedPin.curated.islandGroup}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 leading-snug">
                    {selectedPin.curated.name}
                  </h3>
                  <p className="text-xs text-sky-700 font-medium">
                    {selectedPin.curated.province}, {selectedPin.curated.region}
                  </p>
                  <p className="text-xs text-gray-600 my-2 leading-relaxed">
                    {selectedPin.curated.description}
                  </p>
                  <button
                    onClick={() =>
                      onAddNewAtLocation({
                        lat: selectedPin.coords.lat,
                        lng: selectedPin.coords.lng,
                        destinationName: selectedPin.curated?.name,
                        province: selectedPin.curated?.province,
                      })
                    }
                    className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log as Visited or Wishlist</span>
                  </button>
                </div>
              )}

              {selectedPin.type === 'custom_dropped' && (
                <div className="text-center py-1">
                  <div className="w-9 h-9 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Custom Pin Dropped</h3>
                  <p className="text-[11px] text-gray-500 mb-2.5">
                    Lat: {selectedPin.coords.lat.toFixed(4)}, Lng: {selectedPin.coords.lng.toFixed(4)}
                  </p>
                  <button
                    onClick={() =>
                      onAddNewAtLocation({
                        lat: selectedPin.coords.lat,
                        lng: selectedPin.coords.lng,
                      })
                    }
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Memory Here</span>
                  </button>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};
