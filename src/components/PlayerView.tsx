/**
 * Immersive Fullscreen Animated Auraluxe Player View
 * Includes glowing rotating disc art, track timeline, sleep timer dropdown, volume, speed HUD, and lyrics summary.
 */

import { useState } from 'react';
import { useMusicStore } from '../store/musicStore';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Heart, Volume2, Timer, ChevronDown, Award, Sparkles, HelpCircle, Flame
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

export default function PlayerView() {
  const {
    playback,
    tracks,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleShuffle,
    setRepeatMode,
    toggleFavorite,
    setSleepTimer,
    setScreen,
  } = useMusicStore();

  const [showSleepMenu, setShowSleepMenu] = useState(false);

  // Retrieve track index from store queue
  const getActiveTrack = () => {
    const { queue, currentTrackIndex } = playback;
    if (currentTrackIndex >= 0 && queue[currentTrackIndex]) {
      return queue[currentTrackIndex];
    }
    return tracks[0] || null;
  };

  const track = getActiveTrack();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScrub = (val: number) => {
    seek(val);
  };

  const cycleRepeat = () => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const currIndex = modes.indexOf(playback.repeatMode);
    const nextIndex = (currIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 font-sans space-y-4">
        <Sparkles size={40} className="text-violet-500 animate-pulse" />
        <span className="text-sm font-medium tracking-wide font-sans text-center">No audio track loaded. Scan device storage to begin.</span>
        <button
          onClick={() => setScreen('dashboard')}
          className="text-xs text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const moodColors: Record<string, string> = {
    Chill: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Synthwave: 'shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-violet-500/20 text-violet-300 border-violet-500/30',
    Cyberpunk: 'shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Melancholy: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500/20 text-blue-300 border-blue-500/30',
    Lofi: 'shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-500/20 text-amber-300 border-amber-500/30',
    'High Energy': 'shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-rose-500/20 text-rose-400 border-rose-500/30'
  };

  const activeMoodStyle = moodColors[track.mood] || 'bg-gray-800 text-gray-300 border-gray-700';

  return (
    <div id="auraluxe-full-player" className="flex flex-col h-full bg-[#0a0a0f] justify-between px-5 pt-3 pb-6 relative overflow-hidden text-gray-100 select-none">
      
      {/* Background Ambient Aura Glow */}
      <div
        className="absolute -top-40 left-12 w-80 h-80 rounded-full filter blur-[100px] opacity-25 pointer-events-none transition-all duration-1000 animate-radial-breathe"
        style={{ background: track.coverColor }}
      />
      
      {/* Navbar segment */}
      <div className="flex justify-between items-center z-10 py-1">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/5 transition-all text-gray-400 hover:text-white"
        >
          <ChevronDown size={22} />
        </button>
        <div className="text-center">
          <span className="block text-4xs uppercase tracking-widest font-black text-violet-400 leading-none">Playing From Local</span>
          <span className="text-2xs font-semibold text-gray-300 font-sans">{track.album}</span>
        </div>
        <div className="flex space-x-1.5 items-center bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.08)]">
          <Award size={10} className="text-violet-400" />
          <span className="text-4xs font-mono font-bold tracking-wider text-violet-300">TYPE-69 HD</span>
        </div>
      </div>

      {/* Rotating Glowing Artwork disk */}
      <div className="flex flex-col items-center justify-center my-6 relative z-10">
        <div
          className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700"
          style={{
            backgroundImage: track.coverColor,
            boxShadow: `0 20px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 1px 1px rgba(255,255,255,0.15)`
          }}
        >
          {/* Real Spinning vinyl cover decoration */}
          <div
            className="absolute inset-[6px] rounded-full overflow-hidden flex items-center justify-center bg-black/95 transition-all outline outline-1 outline-white/10"
            style={{
              animation: 'spin 25s linear infinite',
              animationPlayState: playback.isPlaying ? 'running' : 'paused'
            }}
          >
            {/* Standard Vinyl grooving texture replication */}
            <div className="absolute inset-0 rounded-full opacity-60 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(255,255,255,0.03)_41%,_transparent_45%,_rgba(255,255,255,0.03)_50%,_transparent_55%)]" />
            <div className="absolute inset-[30%] rounded-full opacity-40 bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(255,255,255,0.04)_40%,_transparent_55%)]" />

            {/* Inner disc labels */}
            <div
              className="w-[38%] h-[38%] rounded-full flex flex-col items-center justify-center p-2 text-center"
              style={{ background: track.coverColor }}
            >
              <div className="w-4 h-4 rounded-full bg-black border border-white/10 z-20" />
            </div>
          </div>
          
          {/* Subtle neon glow reflecting artwork state */}
          <div
            className="absolute inset-0 rounded-full mix-blend-screen filter blur-md opacity-35 pointer-events-none"
            style={{ backgroundImage: track.coverColor }}
          />
        </div>
      </div>

      {/* Metadata layout block */}
      <div className="space-y-4 z-10">
        <div className="flex justify-between items-start space-x-3">
          <div className="space-y-1 select-text">
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight font-sans clamp-1">
              {track.title}
            </h1>
            <p className="text-xs text-gray-400 font-sans tracking-wide">
              {track.artist}
            </p>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {/* Favorite check */}
            <button
              onClick={() => toggleFavorite(track.id)}
              className={`p-2 rounded-full border transition-all duration-300 ${
                track.isFavorite
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                  : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
              }`}
            >
              <Heart size={16} fill={track.isFavorite ? 'currentColor' : 'none'} />
            </button>

            {/* Smart Mood indexer */}
            <span className={`px-2.5 py-0.5 rounded-full text-4xs uppercase tracking-widest font-bold border transition-all duration-300 ${activeMoodStyle}`}>
              {track.mood}
            </span>
          </div>
        </div>

        {/* Embedded micro wave spectrum indicator */}
        <div id="player-wave-spectrogram" className="h-7 w-full my-2 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent rounded-lg relative overflow-hidden">
          <AudioVisualizer isPlaying={playback.isPlaying} colorHex="#ec4899" type="bars" />
        </div>

        {/* Playback timeline slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={track.duration}
            value={playback.progress}
            onChange={(e) => handleScrub(parseInt(e.target.value))}
            className="w-full accent-rose-500 h-1 cursor-pointer bg-gray-800 rounded-lg outline-none"
          />
          <div className="flex justify-between text-4xs font-mono font-bold text-gray-500 leading-none">
            <span>{formatTime(playback.progress)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>
      </div>

      {/* Queue control controllers */}
      <div className="flex flex-col space-y-6 z-10 my-4">
        {/* Play Pause Skip panel deck */}
        <div className="flex items-center justify-between px-3">
          {/* Shuffle mode */}
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-xl border transition-all ${
              playback.shuffle
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <Shuffle size={16} />
          </button>

          {/* Previous song */}
          <button
            onClick={prevTrack}
            className="p-3 bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          {/* Primary Big glowing Play/Pause toggle */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-violet-500 hover:from-rose-500 hover:to-violet-400 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] border border-white/10"
          >
            {playback.isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>

          {/* Next song */}
          <button
            onClick={nextTrack}
            className="p-3 bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          {/* Infinite repeat modes */}
          <button
            onClick={cycleRepeat}
            className={`p-2.5 rounded-xl border transition-all ${
              playback.repeatMode !== 'none'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {playback.repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Small Volume slider deck */}
        <div className="flex items-center space-x-3 px-1">
          <Volume2 size={13} className="text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playback.volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-violet-500 h-1.5 cursor-ew-resize bg-gray-800 rounded-lg outline-none"
          />
          <span className="text-4xs font-mono font-black text-gray-500 leading-none">
            {Math.round(playback.volume * 100)}%
          </span>
        </div>
      </div>

      {/* Futuristic HUD Footers: Sleep configuration and quick settings */}
      <div className="relative z-10 border-t border-white/5 pt-4 flex justify-between items-center text-gray-400 text-3xs font-sans font-medium">
        <button
          onClick={() => setShowSleepMenu(!showSleepMenu)}
          id="sleep-timer-trigger"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
            playback.sleepTimer
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
              : 'bg-white/5 border-transparent hover:border-white/5 hover:text-white'
          }`}
        >
          <Timer size={11} />
          <span>
            {playback.sleepTimer
              ? `Timer: ${playback.sleepTimer}m`
              : 'Sleep Timer'}
          </span>
        </button>

        <span className="text-4xs text-gray-600 font-mono">CODEC: FLAC 24-BIT</span>

        {/* Sleep Option Selection floating Box overlay */}
        {showSleepMenu && (
          <div
            id="sleep-timer-dropdown"
            className="absolute bottom-12 left-0 w-36 bg-black/95 border border-white/10 rounded-xl p-2.5 shadow-2xl z-20 space-y-1.5 animation-fade-in"
          >
            <div className="text-4xs font-bold uppercase tracking-wider text-gray-500 px-1.5 pb-1 select-none">Sleep Settings</div>
            {[1, 5, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimer(mins);
                  setShowSleepMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1 text-3xs rounded-md transition-all ${
                  playback.sleepTimerInitial === mins
                    ? 'bg-rose-500/10 text-rose-300 font-bold'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {mins === 1 ? '1 minute (Demo)' : `${mins} minutes`}
              </button>
            ))}
            {playback.sleepTimer && (
              <button
                onClick={() => {
                  setSleepTimer(null);
                  setShowSleepMenu(false);
                }}
                className="w-full text-left px-2.5 py-1 text-3xs rounded-md text-rose-500 hover:bg-rose-500/5 font-semibold"
              >
                Turn off Timer
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
