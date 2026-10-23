import React, { useState, useMemo } from 'react';
import { TravelMemory } from '../types';
import { PHILIPPINE_PROVINCES, PHILIPPINE_REGIONS } from '../data/philippinesData';
import { 
  Trophy, 
  MapPin, 
  Camera, 
  Heart, 
  Compass, 
  Calendar, 
  Share2, 
  Download, 
  LogOut, 
  LogIn, 
  HardDrive, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from 'firebase/auth';

interface DashboardViewProps {
  memories: TravelMemory[];
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onViewOnMap: (memory: TravelMemory) => void;
  onNavigateTab: (tab: 'map' | 'journal' | 'add' | 'gallery' | 'dashboard') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memories,
  user,
  accessToken,
  onLogin,
  onLogout,
  onViewOnMap,
  onNavigateTab,
}) => {
  const [activeIslandFilter, setActiveIslandFilter] = useState<'All' | 'Luzon' | 'Visayas' | 'Mindanao'>('All');

  // Stats calculation
  const stats = useMemo(() => {
    const visitedMemories = memories.filter((m) => m.category === 'Visited' || m.category === 'Favorite');
    const wishlistMemories = memories.filter((m) => m.category === 'Want to Visit');
    const favoriteMemories = memories.filter((m) => m.category === 'Favorite');

    // Unique visited provinces
    const visitedProvinceSet = new Set(visitedMemories.map((m) => m.province));
    const visitedProvincesCount = visitedProvinceSet.size;

    // Unique visited regions
    const visitedRegionSet = new Set(visitedMemories.map((m) => m.region));
    const visitedRegionsCount = visitedRegionSet.size;

    // Total photos
    const totalPhotos = memories.reduce((acc, m) => acc + (m.photos?.length || 0), 0);

    // Percentage of Philippines explored (out of 82 provinces)
    const explorationPercentage = Math.round((visitedProvincesCount / 82) * 100);

    return {
      visitedDestinationsCount: visitedMemories.length,
      visitedProvincesCount,
      visitedProvinceSet,
      visitedRegionsCount,
      totalPhotos,
      wishlistCount: wishlistMemories.length,
      favoritesCount: favoriteMemories.length,
      explorationPercentage,
      recentMemories: visitedMemories.slice(0, 4),
      topFavorites: favoriteMemories.slice(0, 4),
    };
  }, [memories]);

  // Group 82 provinces by island
  const provinceListFiltered = useMemo(() => {
    return PHILIPPINE_PROVINCES.filter((p) => {
      if (activeIslandFilter === 'All') return true;
      return p.islandGroup === activeIslandFilter;
    });
  }, [activeIslandFilter]);

  // Export data as JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `philippine_travel_memories_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 pb-28 space-y-6">
      {/* User Header Card */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Traveler'}
                className="w-14 h-14 rounded-2xl border-2 border-white/60 shadow-md object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold">
                🇵🇭
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black">
                  {user?.displayName || 'Philippine Explorer'}
                </h2>
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                {user?.email ? user.email : 'Local Guest Session'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  <HardDrive className="w-3 h-3 text-sky-200" />
                  {accessToken ? 'Google Drive Synced' : 'Google Drive Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {user ? (
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white transition w-full sm:w-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sky-800 hover:bg-sky-50 active:scale-95 text-xs font-bold shadow-lg transition w-full sm:w-auto"
              >
                <LogIn className="w-4 h-4 text-sky-600" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Exploration Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold flex items-center gap-1.5 text-sky-100">
              <Compass className="w-4 h-4 text-emerald-300" />
              Philippine Exploration Progress
            </span>
            <span className="font-extrabold text-sm text-emerald-300">
              {stats.visitedProvincesCount} / 82 Provinces ({stats.explorationPercentage}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(stats.explorationPercentage, 2)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-sky-100 mt-2">
            {stats.visitedProvincesCount === 0
              ? 'Start logging your travels! Visited places automatically update your 82-province explorer score.'
              : `Mabuhay! You've set foot in ${stats.visitedProvincesCount} Philippine provinces and ${stats.visitedRegionsCount} regions.`}
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">
            {stats.visitedDestinationsCount}
          </span>
          <span className="text-xs text-gray-500 font-medium">Spots Visited</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">
            {stats.visitedProvincesCount}
          </span>
          <span className="text-xs text-gray-500 font-medium">Provinces (of 82)</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">
            {stats.totalPhotos}
          </span>
          <span className="text-xs text-gray-500 font-medium">Travel Photos</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-gray-900 block">
            {stats.wishlistCount}
          </span>
          <span className="text-xs text-gray-500 font-medium">Wishlist Spots</span>
        </div>
      </div>

      {/* PWA Home Screen Installation Prompt */}
      <div className="bg-gradient-to-r from-teal-50 to-sky-50 rounded-2xl p-4 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Install as Mobile App (PWA)</h4>
            <p className="text-xs text-gray-600">
              Add My Philippine Travel Map to your phone's home screen for offline access and quick photo logging.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <PWAInstallButton />
        </div>
      </div>

      {/* 82-Province Interactive Tracker Checklist */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>82 Philippine Provinces Checklist</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Check off every province across Luzon, Visayas, and Mindanao
            </p>
          </div>

          {/* Island Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['All', 'Luzon', 'Visayas', 'Mindanao'] as const).map((island) => (
              <button
                key={island}
                onClick={() => setActiveIslandFilter(island)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeIslandFilter === island
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {island}
              </button>
            ))}
          </div>
        </div>

        {/* Province Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
          {provinceListFiltered.map((prov) => {
            const isVisited = stats.visitedProvinceSet.has(prov.name);
            return (
              <div
                key={prov.name}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                  isVisited
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold'
                    : 'bg-gray-50/60 border-gray-200/80 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="truncate mr-1">
                  <span className="block truncate">{prov.name}</span>
                  <span className="text-[10px] text-gray-400 block font-normal">
                    {prov.regionCode}
                  </span>
                </div>
                {isVisited ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorite Destinations Showcase */}
      {stats.topFavorites.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Favorite Destinations</span>
            </h3>
            <button
              onClick={() => onNavigateTab('journal')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.topFavorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => onViewOnMap(fav)}
                className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 hover:bg-amber-50 transition cursor-pointer"
              >
                {fav.photos && fav.photos.length > 0 ? (
                  <img
                    src={fav.photos[0].thumbnailUrl || fav.photos[0].localPreviewUrl || fav.photos[0].driveUrl}
                    alt={fav.destination}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-700 flex-shrink-0">
                    <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{fav.destination}</h4>
                  <p className="text-[11px] text-amber-800 truncate">{fav.province}</p>
                  {fav.favoriteMemories && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5 italic">
                      "{fav.favoriteMemories}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account & Data Management */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Data & Privacy</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your travel records and notes are kept private to your Google account in Firebase Firestore. Your uploaded photos are stored directly in your personal Google Drive account under the folder <strong>"My Philippine Travel Map"</strong>.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-semibold text-gray-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export Travel Records (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
