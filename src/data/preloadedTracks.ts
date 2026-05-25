/**
 * Preset / Built-in high-fidelity synthetic offline tracks.
 * Preloaded as simulated local scan results so the player works beautifully immediately,
 * even before the user imports their own files!
 */

import { Track } from '../types';

export const PRELOADED_TRACKS: Track[] = [
  {
    id: 'built-in-1',
    title: 'Neon Horizon',
    artist: 'Auraluxe Synth Lab',
    album: 'Odyssey 2088',
    duration: 180,
    genre: 'Synthwave',
    mood: 'Synthwave',
    playCount: 14,
    isFavorite: true,
    coverColor: 'linear-gradient(135deg, #FF0055 0%, #7A00FF 100%)', // Pink to Purple
  },
  {
    id: 'built-in-2',
    title: 'Cyberpunk Rain',
    artist: 'Cyber Glitch',
    album: 'Grid Protocol',
    duration: 210,
    genre: 'Industrial',
    mood: 'Cyberpunk',
    playCount: 29,
    isFavorite: false,
    coverColor: 'linear-gradient(135deg, #00FFCC 0%, #005F73 100%)', // Neon Green to Deep Teal
  },
  {
    id: 'built-in-3',
    title: 'Satori Garden',
    artist: 'Zen Beats',
    album: 'Fuji Slopes',
    duration: 160,
    genre: 'Lofi Hip Hop',
    mood: 'Lofi',
    playCount: 42,
    isFavorite: true,
    coverColor: 'linear-gradient(135deg, #FF9F1C 0%, #D81159 100%)', // Orange to Velvet Red
  },
  {
    id: 'built-in-4',
    title: 'Vaporwave Nostalgia',
    artist: 'Glitch Princess',
    album: 'Aesthetic Windows',
    duration: 195,
    genre: 'Vaporwave',
    mood: 'Melancholy',
    playCount: 8,
    isFavorite: false,
    coverColor: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', // Intense Royal Indigo
  },
  {
    id: 'built-in-5',
    title: 'Deep Drift Space Ambient',
    artist: 'Cosmo Signal',
    album: 'Void Symphony',
    duration: 240,
    genre: 'Ambient Cosmic',
    mood: 'Chill',
    playCount: 3,
    isFavorite: false,
    coverColor: 'linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)', // Moonlit Dark Gray
  },
  {
    id: 'built-in-6',
    title: 'Infinite Grid Run',
    artist: 'Auraluxe Synth Lab',
    album: 'Vektor Space',
    duration: 175,
    genre: 'Synthwave',
    mood: 'High Energy',
    playCount: 18,
    isFavorite: true,
    coverColor: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)', // Electric Cyan to Deep Blue
  }
];
