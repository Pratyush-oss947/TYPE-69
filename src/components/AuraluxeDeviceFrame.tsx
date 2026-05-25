/**
 * Auraluxe Android Frame Wrapper
 * Simulates a high-fidelity fully responsive Android smartphone chassis with
 * device notches, battery monitors, and status bars on larger desktop interfaces,
 * while expanding flawlessly full-screen on tactile mobile displays.
 */

import { useState, useEffect } from 'react';
import { useMusicStore } from '../store/musicStore';
import {
  Compass, Library, Sliders, Play, Pause, SkipForward, ChevronUp,
  Wifi, Signal, Battery, Sparkles, VolumeX, Volume2
} from 'lucide-react';
import DashboardView from './DashboardView';
import PlayerView from './PlayerView';
import EqualizerView from './EqualizerView';
import LibraryView from './LibraryView';

export default function AuraluxeDeviceFrame() {
  const { currentScreen, setScreen, playback, togglePlay, nextTrack, tracks } = useMusicStore();
  const [deviceTime, setDeviceTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      const mins = now.getMinutes();
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setDeviceTime(`${hrs}:${mins < 10 ? '0' : ''}${mins} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeTrack = playback.currentTrackIndex >= 0 ? playback.queue[playback.currentTrackIndex] : null;

  // Navigation configurations
  const NAV_ITEMS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Compass },
    { id: 'library' as const, label: 'Library', icon: Library },
    { id: 'equalizer' as const, label: 'Labs EQ', icon: Sliders }
  ];

  return (
    <div className="min-h-screen w-full bg-[#050508] bg-radial-gradient flex items-center justify-center p-0 md:p-6 select-none font-sans overflow-hidden">
      
      {/* Absolute Backdrop Aesthetic Elements */}
      <div className="absolute top-24 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/10 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] rounded-full bg-rose-900/10 filter blur-[100px] pointer-events-none" />

      {/* Primary Smart Device Shell Container */}
      <div className="w-full h-screen md:max-w-[410px] md:h-[840px] md:rounded-[44px] md:border-[10px] md:border-[#1E1E2F] md:shadow-[0_45px_100px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.06),_inset_0_2px_4px_rgba(255,255,255,0.15)] bg-[#07070B] relative flex flex-col justify-between overflow-hidden">
        
        {/* Device camera Notch & status system bar */}
        <div className="h-10 bg-black/40 backdrop-blur-md px-6 flex justify-between items-center z-30 select-none border-b border-white/[0.02]">
          {/* Virtual Notch pill and time overlay */}
          <span className="text-3s font-bold text-gray-300 font-sans tracking-wide">{deviceTime || '2:38 PM'}</span>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-24 h-4.5 bg-black rounded-full border border-white/5 opacity-0 md:opacity-100 flex items-center justify-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-pulse" />
            <span className="w-20 text-[6px] tracking-tight uppercase font-black text-gray-600 font-mono text-center">TYPE-69 Core</span>
          </div>

          <div className="flex items-center space-x-2.5 text-gray-300">
            <Signal size={12} className="text-gray-400" />
            <Wifi size={12} className="text-gray-400" />
            <Battery size={13} className="text-emerald-400" />
          </div>
        </div>

        {/* Dynamic Display viewport screens */}
        <div className="flex-1 w-full relative overflow-hidden bg-gradient-to-b from-[#09090E] to-[#040407]">
          {currentScreen === 'dashboard' && <DashboardView />}
          {currentScreen === 'equalizer' && <EqualizerView />}
          {currentScreen === 'library' && <LibraryView />}
          
          {/* Fullscreen player floats on top dynamically */}
          {currentScreen === 'player' && (
            <div className="absolute inset-0 z-40 bg-[#0a0a0f] animation-drawer-slideup">
              <PlayerView />
            </div>
          )}
        </div>

        {/* Floating Ambient Mini Player Bar */}
        {activeTrack && currentScreen !== 'player' && (
          <div
            id="auraluxe-mini-player"
            className="mx-4 mb-2 z-30 bg-[#121221]/90 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.4),_0_0_15px_rgba(244,63,94,0.1)] animation-slideup cursor-pointer"
            onClick={() => setScreen('player')}
          >
            <div className="flex items-center space-x-3.5 flex-1 min-w-0">
              {/* Spinning Mini Label Artwork art */}
              <div
                className="w-10 h-10 rounded-xl relative flex items-center justify-center shrink-0 border border-white/10"
                style={{
                  backgroundImage: activeTrack.coverColor,
                  animation: 'spin 12s linear infinite',
                  animationPlayState: playback.isPlaying ? 'running' : 'paused'
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#121221] border border-white/15" />
              </div>
              
              <div className="min-w-0 flex-1 pr-2">
                <span className="block text-2xs font-bold text-white clamp-1 leading-normal">{activeTrack.title}</span>
                <span className="block text-4xs text-gray-400 clamp-1 font-sans leading-none">{activeTrack.artist}</span>
              </div>
            </div>

            {/* Micro Controls play deck */}
            <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={togglePlay}
                className="p-10 w-8.5 h-8.5 bg-rose-600 rounded-full flex items-center justify-center text-white active:scale-95 transition"
              >
                {playback.isPlaying ? (
                  <Pause size={10} fill="currentColor" />
                ) : (
                  <Play size={10} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              
              <button
                onClick={nextTrack}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              >
                <SkipForward size={14} fill="currentColor" />
              </button>
            </div>
            
            {/* Embedded neon track scrubber timeline bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/40 rounded-b-2xl overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${(playback.progress / activeTrack.duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Navigation bar tabs */}
        <div className="h-[74px] bg-black/85 backdrop-blur-xl border-t border-white/[0.04] px-6 select-none flex justify-around items-center z-30">
          {NAV_ITEMS.map((item) => {
            const isSelected = currentScreen === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setScreen(item.id)}
                className="flex flex-col items-center justify-center w-20 py-1 transition-all group cursor-pointer"
              >
                <div
                  className={`p-1 px-4.5 rounded-2xl transition-all duration-300 group-active:scale-90 ${
                    isSelected
                      ? 'bg-rose-600/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                      : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  <IconComponent size={18} />
                </div>
                <span
                  className={`text-4xs font-bold uppercase tracking-widest mt-1.5 transition-all duration-150 ${
                    isSelected ? 'text-rose-400' : 'text-gray-650'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
