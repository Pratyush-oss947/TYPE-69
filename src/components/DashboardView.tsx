/**
 * Auraluxe Dashboard Landing Screen
 * Features premium interactive tiles, analytics meters, Smart Mood carousels,
 * and quick-play track boards.
 */

import { useMusicStore } from '../store/musicStore';
import { Track } from '../types';
import {
  Sparkles, Flame, Play, Music, Battery, Compass,
  Heart, BarChart2, Radio, Award, Timer, Volume1, ListPlus
} from 'lucide-react';

export default function DashboardView() {
  const {
    tracks,
    playback,
    analytics,
    playTrack,
    setScreen,
    togglePlay,
    selectedPlaylistId,
    selectPlaylist
  } = useMusicStore();

  const handleSmartMoodPlay = (moodName: 'Chill' | 'Synthwave' | 'Melancholy' | 'High Energy' | 'Cyberpunk' | 'Lofi') => {
    const list = tracks.filter((t) => t.mood === moodName);
    if (list.length > 0) {
      playTrack(list[0], list);
      setScreen('player');
    }
  };

  // Create recently played & most played items list
  const getMostPlayed = () => {
    return [...tracks]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 4);
  };

  const getFavorites = () => {
    return tracks.filter((t) => t.isFavorite).slice(0, 4);
  };

  const activeTrack = playback.currentTrackIndex >= 0 ? playback.queue[playback.currentTrackIndex] : null;

  const totalHrs = Math.floor(analytics.totalListeningTime / 3600);
  const totalMins = Math.floor((analytics.totalListeningTime % 3600) / 60);

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-6 text-gray-200">
      
      {/* Immersive Cyber-Greeting Panel */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="flex items-center space-x-1 text-4xs uppercase tracking-widest font-black text-rose-500">
            <Radio size={10} className="animate-pulse" />
            <span>TYPE-69 Core Live</span>
          </span>
          <h1 className="text-base font-extrabold tracking-tight text-white font-sans">Welcome back, Operator</h1>
          <p className="text-4xs text-gray-400 font-sans tracking-wide">Device music vault indexed completely offline</p>
        </div>
        
        {/* Customized Material You Glass Badge */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl shadow-md">
          <Battery size={13} className="text-emerald-400" />
          <span className="text-3s font-mono font-bold text-gray-300">89%</span>
        </div>
      </div>

      {/* Analytics Dashboard Bento-Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5 text-center">
          <Music size={14} className="mx-auto text-violet-400" />
          <span className="block text-4xs uppercase font-medium tracking-wide text-gray-500">Local Files</span>
          <span className="block text-sm font-black text-white font-mono">{tracks.length}</span>
        </div>

        <div className="col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5 text-center">
          <Flame size={14} className="mx-auto text-rose-400 animate-bounce" />
          <span className="block text-4xs uppercase font-medium tracking-wide text-gray-500">Played</span>
          <span className="block text-sm font-black text-white font-mono">{analytics.totalTracksPlayed}</span>
        </div>

        <div className="col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-1.5 text-center">
          <Heart size={14} className="mx-auto text-emerald-400" />
          <span className="block text-4xs uppercase font-medium tracking-wide text-gray-500">Favorites</span>
          <span className="block text-sm font-black text-white font-mono">
            {tracks.filter(t => t.isFavorite).length}
          </span>
        </div>
      </div>

      {/* Smart Rule-Based AI Playlist suggestion grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-3xs font-semibold uppercase tracking-widest text-gray-400">AI Mood Playlists</span>
          <Sparkles size={11} className="text-rose-400" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {[
            {
              mood: 'Synthwave' as const,
              title: 'Neon Odyssey',
              sub: 'Continuous drive synth',
              color: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.1) 100%)',
              border: 'border-pink-500/10 hover:border-pink-500/35',
              glow: 'text-pink-400'
            },
            {
              mood: 'Lofi' as const,
              title: 'Study Cafe',
              sub: 'Soft procedural lo-fi beats',
              color: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.1) 100%)',
              border: 'border-amber-500/10 hover:border-amber-500/35',
              glow: 'text-amber-400'
            },
            {
              mood: 'Cyberpunk' as const,
              title: 'Industrial Glitch',
              sub: 'Heavy technical digital bass',
              color: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(30,58,138,0.1) 100%)',
              border: 'border-cyan-500/10 hover:border-cyan-500/35',
              glow: 'text-cyan-400'
            },
            {
              mood: 'Chill' as const,
              title: 'Ambient Deep',
              sub: 'Lush expansive pads atmospheric',
              color: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0.1) 100%)',
              border: 'border-emerald-500/10 hover:border-emerald-500/35',
              glow: 'text-emerald-400'
            }
          ].map((item, idx) => {
            const numMatching = tracks.filter((t) => t.mood === item.mood).length;
            return (
              <div
                key={idx}
                id={`mood-playlist-${item.mood.toLowerCase()}`}
                onClick={() => handleSmartMoodPlay(item.mood)}
                className={`p-3.5 border rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between h-24 ${item.border}`}
                style={{ background: item.color }}
              >
                <div>
                  <span className={`block text-2xs font-bold text-white ${item.glow}`}>{item.title}</span>
                  <span className="text-4xs text-gray-500 leading-tight">{item.sub}</span>
                </div>
                <div className="flex justify-between items-center text-4xs font-mono font-bold text-gray-400">
                  <span>{numMatching} tracks</span>
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
                    <Play size={8} fill="currentColor" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Hot Tracks and Favorites list */}
      <div className="space-y-3 pb-8">
        <span className="block text-3xs font-semibold uppercase tracking-widest text-gray-400 px-1">Curated High Repetition Score</span>
        
        <div className="space-y-2">
          {tracks.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => playTrack(item)}
              className="flex items-center justify-between p-3 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all rounded-xl cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-3xs font-black"
                  style={{ background: item.coverColor }}
                >
                  {item.title.substring(0, 1).toUpperCase()}
                </div>
                
                <div>
                  <h4 className="text-2xs font-bold text-white leading-tight clamp-1">{item.title}</h4>
                  <p className="text-4xs text-gray-400 leading-none mt-0.5">{item.artist} • {item.genre}</p>
                </div>
              </div>

              <div className="flex space-x-1 font-mono text-4xs font-bold text-rose-400">
                <span>{item.playCount} hits</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
