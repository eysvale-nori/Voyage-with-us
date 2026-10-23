export type TravelStatus = 'Visited' | 'Want to Visit' | 'Favorite';

export interface TravelPhoto {
  id: string;
  name: string;
  caption?: string;
  driveFileId?: string;
  driveUrl?: string;
  thumbnailUrl?: string;
  localPreviewUrl?: string;
  uploadedAt: string;
  sizeBytes?: number;
}

export interface TravelMemory {
  id: string;
  userId: string;
  destination: string;
  province: string;
  region: string;
  category: TravelStatus;
  latitude: number;
  longitude: number;
  visitDate?: string;
  rating?: number; // 0 to 5
  notes?: string;
  companions?: string;
  expenses?: number; // in PHP
  favoriteMemories?: string;
  photos: TravelPhoto[];
  driveFolderId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PhilippineRegion {
  id: string;
  name: string;
  code: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  center: { lat: number; lng: number };
}

export interface PhilippineProvince {
  name: string;
  regionCode: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  capital?: string;
}

export interface CuratedDestination {
  id: string;
  name: string;
  province: string;
  region: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  latitude: number;
  longitude: number;
  description: string;
  imageUrl?: string;
  tags: string[];
}
