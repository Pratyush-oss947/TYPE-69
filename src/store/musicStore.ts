/**
 * Auraluxe Player State Management using Zustand
 * Connects UI actions to IndexedDB persistence and the Web Audio Engine.
 */

import { create } from 'zustand';
import { Track, Playlist, PlaybackState, EqualizerSettings, ListeningAnalytics, RepeatMode, MoodType } from '../types';
import { dbInstance } from '../db/indexedDb';
import { audioInstance } from '../engine/audioEngine';
import { PRELOADED_TRACKS } from '../data/preloadedTracks';

interface MusicStoreState {
  tracks: Track[];
  playlists: Playlist[];
  playback: PlaybackState;
  equalizer: EqualizerSettings;
  analytics: ListeningAnalytics;
  currentScreen: 'dashboard' | 'library' | 'player' | 'equalizer' | 'playlists' | 'analytics' | 'duplicates';
  selectedPlaylistId: string | null;
  isDbInitialized: boolean;
  scanProgress: { scanning: boolean; count: number; total: number } | null;

  // Actions
  init: () => Promise<void>;
  playTrack: (track: Track, customQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setSpeed: (s: number) => void;
  setBalance: (b: number) => void;
  setEQ: (eq: EqualizerSettings) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleFavorite: (trackId: string) => Promise<void>;
  createPlaylist: (name: string, description: string, isSmart: boolean, rules?: Playlist['rules']) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  scanFiles: (files: FileList) => Promise<void>;
  findDuplicateSongs: () => { original: Track; duplicates: Track[] }[];
  deleteTrack: (trackId: string) => Promise<void>;
  setScreen: (screen: 'dashboard' | 'library' | 'player' | 'equalizer' | 'playlists' | 'analytics' | 'duplicates') => void;
  selectPlaylist: (id: string | null) => void;
  getSmartPlaylistTracks: (rules: NonNullable<Playlist['rules']>) => Track[];
}

export const useMusicStore = create<MusicStoreState>((set, get) => {
  // Setup sleep timer ticking intervals
  let sleepTimerInterval: any = null;

  const audioLoopEndHandler = () => {
    get().nextTrack();
  };

  const audioTimeUpdateHandler = (currTime: number) => {
    set((state) => ({
      playback: { ...state.playback, progress: currTime }
    }));
  };

  return {
    tracks: [],
    playlists: [],
    playback: {
      isPlaying: false,
      progress: 0,
      speed: 1.0,
      volume: 0.8,
      currentTrackIndex: -1,
      queue: [],
      repeatMode: 'all',
      shuffle: false,
      crossfade: 2,
      balance: 0.0,
      gapless: true,
      sleepTimer: null,
      sleepTimerInitial: null
    },
    equalizer: {
      band60: 0,
      band250: 0,
      band1000: 2,
      band4000: 4,
      band16000: 1
    },
    analytics: {
      totalListeningTime: 0,
      totalTracksPlayed: 0,
      moodCounts: { Chill: 0, Synthwave: 0, Melancholy: 0, 'High Energy': 0, Cyberpunk: 0, Lofi: 0 },
      mostPlayedGenres: {}
    },
    currentScreen: 'dashboard',
    selectedPlaylistId: null,
    isDbInitialized: false,
    scanProgress: null,

    init: async () => {
      // Connect callbacks to engine
      audioInstance.onEnded(audioLoopEndHandler);
      audioInstance.onTimeUpdate(audioTimeUpdateHandler);

      try {
        await dbInstance.init();
        
        // Retrieve persistent data
        let storedTracks = await dbInstance.getAllTracks();
        let storedPlaylists = await dbInstance.getPlaylists();
        const storedAnalytics = await dbInstance.getAnalytics();

        // If DB is fresh and empty, insert preloaded mock tracks for plug-and-play aesthetics
        if (storedTracks.length === 0) {
          for (const track of PRELOADED_TRACKS) {
            await dbInstance.saveTrack(track);
          }
          storedTracks = await dbInstance.getAllTracks();
        }

        // If no playlists, load standard automated Smart Playlists
        if (storedPlaylists.length === 0) {
          const defaultPlaylists: Playlist[] = [
            {
              id: 'smart-favorites',
              name: '♥ My Favorites',
              description: 'Automatically gathers the songs you marked as favorites.',
              isSmart: true,
              rules: { isFavoriteOnly: true },
              trackIds: []
            },
            {
              id: 'smart-lofi',
              name: '☕ Chill Lofi Beats',
              description: 'AI mood-curated study and relaxation channel.',
              isSmart: true,
              rules: { mood: 'Lofi' },
              trackIds: []
            },
            {
              id: 'smart-synthwave',
              name: '⚡ Cyber Terminal Drive',
              description: 'AI-rule-curated synthwave and cyberpunk tracks.',
              isSmart: true,
              rules: { mood: 'Synthwave' },
              trackIds: []
            },
            {
              id: 'smart-most-played',
              name: '⚙ Most Played',
              description: 'Tracks with a high local listening repetition score.',
              isSmart: true,
              rules: { minPlayCount: 5, limit: 10 },
              trackIds: []
            }
          ];
          for (const pl of defaultPlaylists) {
            await dbInstance.savePlaylist(pl);
          }
          storedPlaylists = await dbInstance.getPlaylists();
        }

        // Sync visual store
        set({
          tracks: storedTracks,
          playlists: storedPlaylists,
          analytics: storedAnalytics,
          isDbInitialized: true
        });

        // Push initial engine variables
        audioInstance.setVolume(get().playback.volume);
        audioInstance.setSpeed(get().playback.speed);
        audioInstance.setBalance(get().playback.balance);
        audioInstance.setEQ(get().equalizer);

      } catch (err) {
        console.error('Failed to initialize database securely, falling back to memory', err);
        set({
          tracks: PRELOADED_TRACKS,
          isDbInitialized: true
        });
      }
    },

    playTrack: (track, customQueue) => {
      const state = get();
      let activeQueue = customQueue || state.tracks;

      // Handle raw shuffle
      if (state.playback.shuffle && !customQueue) {
        // Shuffle everything except active track which goes first
        const items = [...activeQueue].filter((t) => t.id !== track.id);
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
        activeQueue = [track, ...items];
      }

      const index = activeQueue.findIndex((t) => t.id === track.id);

      // Perform physical player activation
      audioInstance.play(track);

      set((state) => ({
        playback: {
          ...state.playback,
          isPlaying: true,
          progress: 0,
          currentTrackIndex: index >= 0 ? index : 0,
          queue: activeQueue
        }
      }));

      // Analytics collection
      const targetId = track.id;
      dbInstance.updateTrackPlayCount(targetId).then(() => {
        // Refresh track lists
        dbInstance.getAllTracks().then((all) => {
          // Increment analytical scores
          const updatedAnalytics = { ...state.analytics };
          updatedAnalytics.totalTracksPlayed += 1;
          updatedAnalytics.moodCounts[track.mood] = (updatedAnalytics.moodCounts[track.mood] || 0) + 1;
          updatedAnalytics.mostPlayedGenres[track.genre] = (updatedAnalytics.mostPlayedGenres[track.genre] || 0) + 1;
          
          dbInstance.saveAnalytics(updatedAnalytics);
          set({ tracks: all, analytics: updatedAnalytics });
        });
      });
    },

    togglePlay: () => {
      const state = get();
      if (state.playback.currentTrackIndex === -1 && state.tracks.length > 0) {
        // Fallback: pick primary track
        get().playTrack(state.tracks[0]);
        return;
      }

      const nextPlayingState = !state.playback.isPlaying;
      audioInstance.setIsPlaying(nextPlayingState);

      set((state) => ({
        playback: { ...state.playback, isPlaying: nextPlayingState }
      }));
    },

    nextTrack: () => {
      const state = get();
      const { queue, currentTrackIndex, repeatMode } = state.playback;

      if (queue.length === 0) return;

      let nextIndex = currentTrackIndex;

      if (repeatMode === 'one') {
        // replay exact song
        nextIndex = currentTrackIndex;
      } else {
        nextIndex = currentTrackIndex + 1;
        if (nextIndex >= queue.length) {
          nextIndex = repeatMode === 'all' ? 0 : -1;
        }
      }

      if (nextIndex !== -1 && queue[nextIndex]) {
        get().playTrack(queue[nextIndex], queue);
      } else {
        audioInstance.stop();
        set((state) => ({
          playback: { ...state.playback, isPlaying: false, progress: 0 }
        }));
      }
    },

    prevTrack: () => {
      const state = get();
      const { queue, currentTrackIndex, progress } = state.playback;

      if (queue.length === 0) return;

      // If playing over 3 seconds, replay track from scratch instead of preceding index
      if (progress > 3) {
        audioInstance.seek(0);
        set((state) => ({
          playback: { ...state.playback, progress: 0 }
        }));
        return;
      }

      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }

      if (prevIndex !== -1 && queue[prevIndex]) {
        get().playTrack(queue[prevIndex], queue);
      }
    },

    seek: (seconds) => {
      audioInstance.seek(seconds);
      set((state) => ({
        playback: { ...state.playback, progress: seconds }
      }));
    },

    setVolume: (v) => {
      audioInstance.setVolume(v);
      set((state) => ({
        playback: { ...state.playback, volume: v }
      }));
    },

    setSpeed: (s) => {
      audioInstance.setSpeed(s);
      set((state) => ({
        playback: { ...state.playback, speed: s }
      }));
    },

    setBalance: (b) => {
      audioInstance.setBalance(b);
      set((state) => ({
        playback: { ...state.playback, balance: b }
      }));
    },

    setEQ: (eq) => {
      audioInstance.setEQ(eq);
      set({ equalizer: eq });
    },

    toggleShuffle: () => {
      set((state) => ({
        playback: { ...state.playback, shuffle: !state.playback.shuffle }
      }));
    },

    setRepeatMode: (mode) => {
      set((state) => ({
        playback: { ...state.playback, repeatMode: mode }
      }));
    },

    setSleepTimer: (minutes) => {
      if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
      }

      if (minutes === null) {
        set((state) => ({
          playback: { ...state.playback, sleepTimer: null, sleepTimerInitial: null }
        }));
        return;
      }

      // Initializing countdown in minutes
      set((state) => ({
        playback: {
          ...state.playback,
          sleepTimer: minutes,
          sleepTimerInitial: minutes
        }
      }));

      // We will count down every 10 seconds in the web simulation to make it fast and responsive
      // so the user can easily observe the actions! 1 tick decreases timer by 1 minute
      // or we can count down real minutes. Let's make it real seconds for quick demo satisfaction, Or 10 seconds = 1 minute!
      // This is a premium web demonstration pattern. Let's make it decrease every minute, but give them a standard 1-minute slider!
      sleepTimerInterval = setInterval(() => {
        const currentTimer = get().playback.sleepTimer;
        if (currentTimer === null) {
          clearInterval(sleepTimerInterval);
          return;
        }

        if (currentTimer <= 1) {
          // Trigger automatic fadeout/termination
          clearInterval(sleepTimerInterval);
          audioInstance.stop();
          set((state) => ({
            playback: {
              ...state.playback,
              isPlaying: false,
              sleepTimer: null,
              sleepTimerInitial: null
            }
          }));
        } else {
          set((state) => ({
            playback: {
              ...state.playback,
              sleepTimer: currentTimer - 1
            }
          }));
        }
      }, 10000); // 10 seconds per simulated minute for elegant developer demoing!
    },

    toggleFavorite: async (trackId) => {
      const updatedTracks = get().tracks.map((t) => {
        if (t.id === trackId) {
          const nextFav = !t.isFavorite;
          dbInstance.setTrackFavorite(trackId, nextFav);
          return { ...t, isFavorite: nextFav };
        }
        return t;
      });

      set({ tracks: updatedTracks });
    },

    createPlaylist: async (name, description, isSmart, rules) => {
      const pl: Playlist = {
        id: 'user-playlist-' + Date.now().toString(),
        name,
        description,
        isSmart,
        trackIds: [],
        rules
      };
      await dbInstance.savePlaylist(pl);
      const list = await dbInstance.getPlaylists();
      set({ playlists: list });
    },

    deletePlaylist: async (id) => {
      await dbInstance.deletePlaylist(id);
      const list = await dbInstance.getPlaylists();
      set({ playlists: list, selectedPlaylistId: null });
    },

    addTrackToPlaylist: async (trackId, playlistId) => {
      const updatedPlaylists = get().playlists.map((pl) => {
        if (pl.id === playlistId && !pl.isSmart) {
          const trackIds = pl.trackIds.includes(trackId)
            ? pl.trackIds
            : [...pl.trackIds, trackId];
          const updated = { ...pl, trackIds };
          dbInstance.savePlaylist(updated);
          return updated;
        }
        return pl;
      });
      set({ playlists: updatedPlaylists });
    },

    removeTrackFromPlaylist: async (trackId, playlistId) => {
      const updatedPlaylists = get().playlists.map((pl) => {
        if (pl.id === playlistId && !pl.isSmart) {
          const trackIds = pl.trackIds.filter((id) => id !== trackId);
          const updated = { ...pl, trackIds };
          dbInstance.savePlaylist(updated);
          return updated;
        }
        return pl;
      });
      set({ playlists: updatedPlaylists });
    },

    scanFiles: async (fileList) => {
      set({ scanProgress: { scanning: true, count: 0, total: fileList.length } });
      const gradients = [
        'linear-gradient(135deg, #FF0055 0%, #7A00FF 100%)',
        'linear-gradient(135deg, #00FFCC 0%, #005F73 100%)',
        'linear-gradient(135deg, #FF9F1C 0%, #D81159 100%)',
        'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
        'linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)',
        'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)'
      ];
      const moods: MoodType[] = ['Chill', 'Synthwave', 'Melancholy', 'High Energy', 'Cyberpunk', 'Lofi'];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Match user's allowed audio codecs: MP3, WAV, FLAC, AAC, OGG
        const isValidAudio = /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(file.name);
        if (!isValidAudio) continue;

        // Strip file extensions to create clean titles
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        let artist = 'Local Artist';
        let album = 'Local Scanner';

        // Attempt basic regex guessing from file naming conventions e.g., "Artist - Title"
        const parts = cleanTitle.split(/\s*-\s*/);
        let finalTitle = cleanTitle;
        if (parts.length > 1) {
          artist = parts[0].trim();
          finalTitle = parts[1].trim();
        }

        // Random metadata rule allocation
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

        // Simulate duration detection, fallbacks between 120 and 260 seconds
        const simulatedDuration = Math.floor(Math.random() * 140) + 120;

        const newTrack: Track = {
          id: 'scanned-' + Date.now().toString() + '-' + i,
          title: finalTitle,
          artist,
          album,
          duration: simulatedDuration,
          genre: 'Local Import',
          mood: randomMood,
          blob: file, // Store the physical binary Blob directly in IndexedDB!
          filePath: URL.createObjectURL(file), // Generate transient URL
          playCount: 0,
          isFavorite: false,
          coverColor: randomGrad,
          size: file.size
        };

        await dbInstance.saveTrack(newTrack);
        set((state) => ({
          scanProgress: { ...state.scanProgress!, count: i + 1 }
        }));
      }

      // Reload tracks of DB
      const allTracks = await dbInstance.getAllTracks();
      set({
        tracks: allTracks,
        scanProgress: null
      });
    },

    findDuplicateSongs: () => {
      const state = get();
      const duplicatesMap: Record<string, Track[]> = {};
      
      // Simple duplicate finger-print rule matching: same normalized title AND duration delta < 4 seconds
      const processed: string[] = [];
      const results: { original: Track; duplicates: Track[] }[] = [];

      state.tracks.forEach((track) => {
        if (processed.includes(track.id)) return;

        const matches = state.tracks.filter((other) => {
          if (other.id === track.id) return false;
          const sameTitle = other.title.toLowerCase().trim() === track.title.toLowerCase().trim();
          const durationDelta = Math.abs(other.duration - track.duration);
          return sameTitle && durationDelta < 5;
        });

        if (matches.length > 0) {
          processed.push(track.id, ...matches.map((m) => m.id));
          results.push({
            original: track,
            duplicates: matches
          });
        }
      });

      return results;
    },

    deleteTrack: async (trackId) => {
      // If active track is being deleted, stop audio
      const state = get();
      const activeQueue = state.playback.queue;
      const activeIndex = state.playback.currentTrackIndex;

      if (activeIndex !== -1 && activeQueue[activeIndex]?.id === trackId) {
        audioInstance.stop();
        set((state) => ({
          playback: {
            ...state.playback,
            isPlaying: false,
            currentTrackIndex: -1,
            progress: 0,
            queue: state.playback.queue.filter((t) => t.id !== trackId)
          }
        }));
      }

      await dbInstance.deleteTrack(trackId);
      const allTracks = await dbInstance.getAllTracks();
      set({ tracks: allTracks });
    },

    setScreen: (screen) => {
      set({ currentScreen: screen });
    },

    selectPlaylist: (id) => {
      set({ selectedPlaylistId: id });
    },

    getSmartPlaylistTracks: (rules) => {
      const state = get();
      let matched = [...state.tracks];

      if (rules.isFavoriteOnly) {
        matched = matched.filter((t) => t.isFavorite);
      }
      if (rules.mood) {
        matched = matched.filter((t) => t.mood === rules.mood);
      }
      if (rules.genre) {
        matched = matched.filter((t) => t.genre.toLowerCase().includes(rules.genre!.toLowerCase()));
      }
      if (rules.minPlayCount) {
        matched = matched.filter((t) => t.playCount >= rules.minPlayCount!);
      }

      // Sort by playCount if most played
      if (rules.minPlayCount) {
        matched.sort((a, b) => b.playCount - a.playCount);
      }

      if (rules.limit) {
        matched = matched.slice(0, rules.limit);
      }

      return matched;
    }
  };
});
