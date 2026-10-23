import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TravelMemory, TravelPhoto } from '../types';

/**
 * Subscribes to real-time updates for a user's travel memories.
 */
export function subscribeToMemories(
  userId: string,
  onMemoriesReceived: (memories: TravelMemory[]) => void,
  onError?: (err: Error) => void
) {
  const collectionPath = `users/${userId}/travel_memories`;
  const memoriesCol = collection(db, 'users', userId, 'travel_memories');

  return onSnapshot(
    memoriesCol,
    (snapshot) => {
      const items: TravelMemory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          destination: data.destination,
          province: data.province,
          region: data.region,
          category: data.category,
          latitude: data.latitude,
          longitude: data.longitude,
          visitDate: data.visitDate || '',
          rating: data.rating ?? 0,
          notes: data.notes || '',
          companions: data.companions || '',
          expenses: data.expenses ?? 0,
          favoriteMemories: data.favoriteMemories || '',
          photos: (data.photos as TravelPhoto[]) || [],
          driveFolderId: data.driveFolderId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      // Sort in memory by visitDate or createdAt descending
      items.sort((a, b) => {
        const dateA = a.visitDate || '';
        const dateB = b.visitDate || '';
        return dateB.localeCompare(dateA);
      });
      onMemoriesReceived(items);
    },
    (error) => {
      console.error('Error listening to travel memories:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

/**
 * Creates or updates a travel memory document.
 */
export async function saveTravelMemory(
  userId: string,
  memory: Omit<TravelMemory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const memoryId = memory.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docPath = `users/${userId}/travel_memories/${memoryId}`;
  const docRef = doc(db, 'users', userId, 'travel_memories', memoryId);

  try {
    const memoryData = {
      id: memoryId,
      userId,
      destination: memory.destination,
      province: memory.province,
      region: memory.region,
      category: memory.category,
      latitude: Number(memory.latitude),
      longitude: Number(memory.longitude),
      visitDate: memory.visitDate || '',
      rating: Number(memory.rating || 0),
      notes: memory.notes || '',
      companions: memory.companions || '',
      expenses: Number(memory.expenses || 0),
      favoriteMemories: memory.favoriteMemories || '',
      photos: memory.photos || [],
      driveFolderId: memory.driveFolderId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, memoryData);
    return memoryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Updates specific fields of an existing travel memory.
 */
export async function updateTravelMemory(
  userId: string,
  memoryId: string,
  updates: Partial<TravelMemory>
): Promise<void> {
  const docPath = `users/${userId}/travel_memories/${memoryId}`;
  const docRef = doc(db, 'users', userId, 'travel_memories', memoryId);

  try {
    const cleanUpdates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.destination !== undefined) cleanUpdates.destination = updates.destination;
    if (updates.province !== undefined) cleanUpdates.province = updates.province;
    if (updates.region !== undefined) cleanUpdates.region = updates.region;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.latitude !== undefined) cleanUpdates.latitude = Number(updates.latitude);
    if (updates.longitude !== undefined) cleanUpdates.longitude = Number(updates.longitude);
    if (updates.visitDate !== undefined) cleanUpdates.visitDate = updates.visitDate;
    if (updates.rating !== undefined) cleanUpdates.rating = Number(updates.rating);
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
    if (updates.companions !== undefined) cleanUpdates.companions = updates.companions;
    if (updates.expenses !== undefined) cleanUpdates.expenses = Number(updates.expenses);
    if (updates.favoriteMemories !== undefined) cleanUpdates.favoriteMemories = updates.favoriteMemories;
    if (updates.photos !== undefined) cleanUpdates.photos = updates.photos;

    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Deletes a travel memory document.
 */
export async function deleteTravelMemory(userId: string, memoryId: string): Promise<void> {
  const docPath = `users/${userId}/travel_memories/${memoryId}`;
  const docRef = doc(db, 'users', userId, 'travel_memories', memoryId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Syncs user profile aggregate statistics in Firestore.
 */
export async function syncUserProfile(
  userId: string,
  profile: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    provincesVisited?: string[];
  }
): Promise<void> {
  const docPath = `users/${userId}/profile/info`;
  const docRef = doc(db, 'users', userId, 'profile', 'info');

  try {
    await setDoc(
      docRef,
      {
        userId,
        displayName: profile.displayName || 'Philippine Explorer',
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        provincesVisited: profile.provincesVisited || [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Creates a public shareable snapshot for read-only sharing.
 */
export async function createPublicShareLink(
  memory: TravelMemory
): Promise<string> {
  const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const docPath = `public_shares/${shareId}`;
  const docRef = doc(db, 'public_shares', shareId);

  try {
    await setDoc(docRef, {
      id: shareId,
      ownerId: memory.userId,
      destination: memory.destination,
      province: memory.province,
      region: memory.region,
      category: memory.category,
      visitDate: memory.visitDate || '',
      rating: memory.rating || 5,
      notes: memory.notes || '',
      photos: memory.photos || [],
      createdAt: serverTimestamp(),
    });

    const shareUrl = `${window.location.origin}/?shareId=${shareId}`;
    return shareUrl;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Loads a shared travel memory snapshot.
 */
export async function getPublicShare(shareId: string): Promise<any | null> {
  const docPath = `public_shares/${shareId}`;
  const docRef = doc(db, 'public_shares', shareId);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    console.error('Failed to load shared memory:', error);
    return null;
  }
}
