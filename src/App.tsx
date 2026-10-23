import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  subscribeToAuth, 
  getAccessToken,
  setCachedAccessToken
} from './lib/firebase';
import { 
  subscribeToMemories, 
  deleteTravelMemory, 
  syncUserProfile,
  getPublicShare
} from './services/travelService';
import { deletePhotoFromDrive } from './services/driveService';
import { TravelMemory, TravelPhoto } from './types';
import { TOP_DESTINATIONS } from './data/philippinesData';

import { Navbar } from './components/Navbar';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { TravelMap } from './components/TravelMap';
import { JournalView } from './components/JournalView';
import { PhotoGallery } from './components/PhotoGallery';
import { DashboardView } from './components/DashboardView';
import { AddMemoryModal } from './components/AddMemoryModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuotaWarningBanner } from './components/QuotaWarningBanner';

// Google Maps API Key provisioned via GHP Demo Key
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCb2xQfn8LKC-AzXyW2K_ofzx_Mw7-Bz8M';

// Initial sample memories to showcase the Philippine map immediately
const INITIAL_DEMO_MEMORIES: TravelMemory[] = [
  {
    id: 'demo_elnido',
    userId: 'guest',
    destination: 'El Nido Bacuit Archipelago',
    province: 'Palawan',
    region: 'MIMAROPA',
    category: 'Favorite',
    latitude: 11.1949,
    longitude: 119.4013,
    visitDate: '2025-04-12',
    rating: 5,
    notes: 'Kayaked through Big Lagoon and Secret Lagoon. The towering black limestone cliffs contrasting with turquoise water were unforgettable.',
    companions: 'Barkada',
    expenses: 18500,
    favoriteMemories: 'Sunset at Las Cabañas beach with acoustic music.',
    photos: [
      {
        id: 'p1',
        name: 'el_nido_lagoon.jpg',
        caption: 'Turquoise lagoon waters in Bacuit Bay',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2025-04-12T10:00:00Z',
      },
    ],
  },
  {
    id: 'demo_boracay',
    userId: 'guest',
    destination: 'Boracay White Beach Station 1',
    province: 'Aklan',
    region: 'Region VI',
    category: 'Visited',
    latitude: 11.9674,
    longitude: 121.9248,
    visitDate: '2025-02-18',
    rating: 5,
    notes: 'The finest white sand in the world. Paraw sailing during golden hour sunset is a must-do experience.',
    companions: 'Family',
    expenses: 24000,
    favoriteMemories: 'Paraw sunset cruise with orange-violet skies.',
    photos: [
      {
        id: 'p2',
        name: 'boracay_sunset.jpg',
        caption: 'Paraw sailing along White Beach',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2025-02-18T17:30:00Z',
      },
    ],
  },
  {
    id: 'demo_batanes',
    userId: 'guest',
    destination: 'Basco Lighthouse & Marlboro Hills',
    province: 'Batanes',
    region: 'Region II',
    category: 'Want to Visit',
    latitude: 20.4578,
    longitude: 121.9688,
    visitDate: '2026-11-15',
    rating: 5,
    notes: 'Top of my bucket list! Dreaming of cycling across the windswept rolling hills overlooking the Pacific Ocean.',
    companions: 'Solo Backpacking',
    expenses: 30000,
    favoriteMemories: 'Dreaming of tasting Ivatan coconut crab and Ivatan stone house homestays.',
    photos: [
      {
        id: 'p3',
        name: 'batanes_hills.jpg',
        caption: 'Iconic Basco Lighthouse at dusk',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2025-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'demo_siargao',
    userId: 'guest',
    destination: 'Siargao Cloud 9 & Magpupungko',
    province: 'Surigao del Norte',
    region: 'Caraga',
    category: 'Visited',
    latitude: 9.8587,
    longitude: 126.1608,
    visitDate: '2024-09-20',
    rating: 5,
    notes: 'Incredible island vibe, surfing at Cloud 9 boardwalk, cliff diving at Sugba Lagoon, and palm tree roads.',
    companions: 'Friends',
    expenses: 16000,
    favoriteMemories: 'Low tide swimming in the natural Magpupungko rock pools.',
    photos: [
      {
        id: 'p4',
        name: 'siargao_palms.jpg',
        caption: 'Siargao palm tree highway',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2024-09-20T12:00:00Z',
      },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [memories, setMemories] = useState<TravelMemory[]>(INITIAL_DEMO_MEMORIES);
  const [focusedMemoryId, setFocusedMemoryId] = useState<string | null>(null);

  // Quota banner state for Google Maps Demo Key defense
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialCoords, setAddModalInitialCoords] = useState<{
    lat: number;
    lng: number;
    destinationName?: string;
    province?: string;
  } | null>(null);
  const [editingMemory, setEditingMemory] = useState<TravelMemory | null>(null);

  // Confirmation dialog state (required for Workspace operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Listen for Google Maps Quota event
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Check URL for public share parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    if (shareId) {
      getPublicShare(shareId).then((shared) => {
        if (shared) {
          setMemories((prev) => {
            const exists = prev.some((m) => m.id === shared.id);
            if (!exists) return [shared as TravelMemory, ...prev];
            return prev;
          });
          setFocusedMemoryId(shared.id);
          setActiveTab('map');
        }
      });
    }
  }, []);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser, token) => {
      setUser(currentUser);
      setAccessToken(token);

      if (currentUser) {
        // Sync profile
        syncUserProfile(currentUser.uid, {
          displayName: currentUser.displayName || undefined,
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || undefined,
        }).catch(console.warn);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user's real Firestore travel memories when signed in
  useEffect(() => {
    if (!user) {
      // If not logged in, maintain existing demo memories
      return;
    }

    const unsubscribe = subscribeToMemories(
      user.uid,
      (userMemories) => {
        if (userMemories.length > 0) {
          setMemories(userMemories);
        } else {
          // If fresh account with no memories yet, keep demo as friendly onboarding
          setMemories(INITIAL_DEMO_MEMORIES);
        }
      },
      (err) => {
        console.warn('Could not load remote memories:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
      setAccessToken(res.accessToken);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      alert('Google Sign-in failed. Please try again.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logOut();
      setUser(null);
      setAccessToken(null);
      setMemories(INITIAL_DEMO_MEMORIES);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Trigger Add Memory modal at specific coordinates
  const handleAddNewAtLocation = useCallback(
    (coords: { lat: number; lng: number; destinationName?: string; province?: string }) => {
      setEditingMemory(null);
      setAddModalInitialCoords(coords);
      setIsAddModalOpen(true);
    },
    []
  );

  // View a memory focused on the Google Map
  const handleViewOnMap = (memory: TravelMemory) => {
    setFocusedMemoryId(memory.id);
    setActiveTab('map');
  };

  // Edit memory
  const handleEditMemory = (memory: TravelMemory) => {
    setEditingMemory(memory);
    setAddModalInitialCoords(null);
    setIsAddModalOpen(true);
  };

  // Request Delete Memory with confirmation dialog
  const handleRequestDelete = (memory: TravelMemory) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete "${memory.destination}"?`,
      message: `Are you sure you want to delete this travel record from ${memory.province}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          if (user && memory.userId === user.uid) {
            await deleteTravelMemory(user.uid, memory.id);
          }
          setMemories((prev) => prev.filter((m) => m.id !== memory.id));
        } catch (err) {
          console.error('Failed to delete memory:', err);
          alert('Could not delete memory. Please check permissions.');
        }
      },
    });
  };

  // Request Delete Photo with Google Drive confirmation dialog
  const handleRequestDeletePhoto = (memory: TravelMemory, photo: TravelPhoto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Photo from Google Drive?',
      message: `Delete "${photo.name}" permanently from your Google Drive and travel memory? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          if (accessToken && photo.driveFileId) {
            await deletePhotoFromDrive(accessToken, photo.driveFileId);
          }
          // Update memory in state & DB
          const updatedPhotos = memory.photos.filter((p) => p.id !== photo.id);
          if (user && memory.userId === user.uid) {
            setMemories((prev) =>
              prev.map((m) => (m.id === memory.id ? { ...m, photos: updatedPhotos } : m))
            );
          }
        } catch (err) {
          console.error('Failed to delete photo from Drive:', err);
          alert('Could not delete photo from Google Drive.');
        }
      },
    });
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans antialiased selection:bg-sky-200 selection:text-sky-900">
        {/* Google Maps Quota Warning Banner (if quota exceeded) */}
        <QuotaWarningBanner visible={quotaExceeded} />

        {/* Offline Connectivity Status Toast */}
        <OfflineIndicator />

        {/* Top Navbar */}
        <Navbar
          user={user}
          accessToken={accessToken}
          onLogin={handleLogin}
          onOpenProfile={() => setActiveTab('dashboard')}
        />

        {/* Main Content Areas based on Active Tab */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {activeTab === 'map' && (
            <TravelMap
              memories={memories}
              onSelectMemory={(m) => {
                setFocusedMemoryId(m.id);
                setActiveTab('journal');
              }}
              onAddNewAtLocation={handleAddNewAtLocation}
              focusedMemoryId={focusedMemoryId}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              memories={memories}
              onEditMemory={handleEditMemory}
              onRequestDelete={handleRequestDelete}
              onViewOnMap={handleViewOnMap}
              onAddNew={() => {
                setEditingMemory(null);
                setAddModalInitialCoords(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'gallery' && (
            <PhotoGallery
              memories={memories}
              onViewOnMap={handleViewOnMap}
              onRequestDeletePhoto={handleRequestDeletePhoto}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              memories={memories}
              user={user}
              accessToken={accessToken}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onViewOnMap={handleViewOnMap}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>

        {/* Mobile-First Bottom Navigation Menu */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddModal={() => {
            setEditingMemory(null);
            setAddModalInitialCoords(null);
            setIsAddModalOpen(true);
          }}
        />

        {/* Add / Edit Memory Modal */}
        <AddMemoryModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingMemory(null);
            setAddModalInitialCoords(null);
          }}
          userId={user?.uid || 'guest'}
          accessToken={accessToken}
          initialCoords={addModalInitialCoords}
          editingMemory={editingMemory}
          onSaved={(savedId, createdMemory) => {
            if (createdMemory) {
              setMemories((prev) => {
                const index = prev.findIndex((m) => m.id === savedId);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = createdMemory;
                  return updated;
                }
                return [createdMemory, ...prev];
              });
            }
            setFocusedMemoryId(savedId);
            setActiveTab('map');
          }}
          onRequestGoogleLogin={handleLogin}
        />

        {/* Workspace Destructive Action Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </APIProvider>
  );
}
