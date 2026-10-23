import React from 'react';
import { Map, BookOpen, Plus, Image as ImageIcon, User as UserIcon } from 'lucide-react';

export type NavigationTab = 'map' | 'journal' | 'add' | 'gallery' | 'dashboard';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenAddModal: () => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-lg safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {/* Map Tab */}
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'map' ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1">Map</span>
        </button>

        {/* My Travels Journal Tab */}
        <button
          onClick={() => onTabChange('journal')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'journal' ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'journal' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1">My Travels</span>
        </button>

        {/* Center Prominent Add (+) Button */}
        <div className="flex items-center justify-center -mt-5 px-1">
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-500 to-emerald-500 text-white shadow-lg shadow-sky-600/30 hover:scale-105 active:scale-95 transition"
            title="Add Travel Memory"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Gallery Tab */}
        <button
          onClick={() => onTabChange('gallery')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'gallery' ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon className={`w-5 h-5 ${activeTab === 'gallery' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1">Gallery</span>
        </button>

        {/* Profile / Stats Dashboard Tab */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'dashboard' ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};
