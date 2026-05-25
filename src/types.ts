/**
 * Auraluxe Player - Core Type Definitions
 * SPDX-License-Identifier: Apache-2.0
 */

export type MoodType = 'Chill' | 'Synthwave' | 'Melancholy' | 'High Energy' | 'Cyberpunk' | 'Lofi';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre: string;
  mood: MoodType;
  filePath?: string; // empty for built-in, or object URL for scanned local files
  blob?: Blob;       // raw browser file blob if stored/uploaded
  playCount: number;
  lastPlayed?: number; // timestamp
  size?: number;       // bytes
  isFavorite: boolean;
  coverColor: string;  // CSS Gradient styling
  rawFile?: File;      // dynamic file reference
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  isSmart: boolean;
  rules?: {
    mood?: MoodType;
    minPlayCount?: number;
    genre?: string;
    isFavoriteOnly?: boolean;
    limit?: number;
  };
  trackIds: string[];
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface EqualizerSettings {
  band60: number;   // Gain -12 to +12 dB
  band250: number;  // Gain -12 to +12 dB
  band1000: number; // Gain -12 to +12 dB
  band4000: number; // Gain -12 to +12 dB
  band16000: number; // Gain -12 to +12 dB
}

export interface PlaybackState {
  isPlaying: boolean;
  progress: number;
  speed: number;
  volume: number;
  currentTrackIndex: number;
  queue: Track[];
  repeatMode: RepeatMode;
  shuffle: boolean;
  crossfade: number; // seconds (0 to 10)
  balance: number; // stereo: -1.0 (left) to 1.0 (right)
  gapless: boolean;
  sleepTimer: number | null; // minutes remaining, null if inactive
  sleepTimerInitial: number | null; // initial minutes
}

export interface ListeningAnalytics {
  totalListeningTime: number; // seconds
  totalTracksPlayed: number;
  moodCounts: Record<MoodType, number>;
  mostPlayedGenres: Record<string, number>;
}
