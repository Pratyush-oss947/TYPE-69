/**
 * IndexedDB Local Database wrapper to simulate SQLite 100% offline database in browser.
 * Persists local files (blobs), indexing metadata, playlists, favorites, and analytics.
 */

import { Track, Playlist, ListeningAnalytics } from '../types';

const DB_NAME = 'AuraluxeDB';
const DB_VERSION = 1;

export class AuraluxeOfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to load, falling back to local memory storage');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Tracks table: stores indexing info & source file blobs
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
        
        // Playlists table
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        
        // Settings & Analytics key-value table
        if (!db.objectStoreNames.contains('settings_analytics')) {
          db.createObjectStore('settings_analytics');
        }
      };
    });
  }

  // TRACKS PERSISTENCE
  async getAllTracks(): Promise<Track[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('tracks', 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  async saveTrack(track: Track): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      // Create a copy without temporary File object to save inside IndexDB
      const dbTrack = { 
        ...track,
        rawFile: undefined // HTML5 Files cannot be stored directly easily, we keep track.blob
      };
      const transaction = this.db!.transaction('tracks', 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.put(dbTrack);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async updateTrackPlayCount(id: string): Promise<void> {
    if (!this.db) return;
    const track = await this.getTrack(id);
    if (track) {
      track.playCount += 1;
      track.lastPlayed = Date.now();
      await this.saveTrack(track);
    }
  }

  async setTrackFavorite(id: string, isFavorite: boolean): Promise<void> {
    if (!this.db) return;
    const track = await this.getTrack(id);
    if (track) {
      track.isFavorite = isFavorite;
      await this.saveTrack(track);
    }
  }

  private async getTrack(id: string): Promise<Track | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('tracks', 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async deleteTrack(id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('tracks', 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // PLAYLISTS PERSISTENCE
  async getPlaylists(): Promise<Playlist[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('playlists', 'readonly');
      const store = transaction.objectStore('playlists');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('playlists', 'readwrite');
      const store = transaction.objectStore('playlists');
      const request = store.put(playlist);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('playlists', 'readwrite');
      const store = transaction.objectStore('playlists');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // ANALYTICS PERSISTENCE
  async getAnalytics(): Promise<ListeningAnalytics> {
    const fallback: ListeningAnalytics = {
      totalListeningTime: 0,
      totalTracksPlayed: 0,
      moodCounts: {
        Chill: 0,
        Synthwave: 0,
        Melancholy: 0,
        'High Energy': 0,
        Cyberpunk: 0,
        Lofi: 0,
      },
      mostPlayedGenres: {},
    };

    if (!this.db) return fallback;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction('settings_analytics', 'readonly');
      const store = transaction.objectStore('settings_analytics');
      const request = store.get('listening_analytics');

      request.onsuccess = () => {
        resolve(request.result || fallback);
      };
      request.onerror = () => {
        resolve(fallback);
      };
    });
  }

  async saveAnalytics(analytics: ListeningAnalytics): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const transaction = this.db!.transaction('settings_analytics', 'readwrite');
      const store = transaction.objectStore('settings_analytics');
      const request = store.put(analytics, 'listening_analytics');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }
}

export const dbInstance = new AuraluxeOfflineDB();
