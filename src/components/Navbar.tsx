import React from 'react';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';
import { LogIn, Compass, HardDrive } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  accessToken,
  onLogin,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            🇵🇭
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-gray-900 leading-tight">
              My Philippine Travel Map
            </h1>
            <p className="text-[10px] text-sky-600 font-semibold hidden sm:block">
              Explore 82 Provinces • Save to Google Drive
            </p>
          </div>
        </div>

        {/* Right actions: PWA Install + User */}
        <div className="flex items-center gap-2">
          {/* Compact PWA install button */}
          <PWAInstallButton compact={true} />

          {/* User Sign-In or Avatar */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-sky-400 transition"
              title="Open Profile & Settings"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-sky-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center border border-sky-200">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
