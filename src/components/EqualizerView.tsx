/**
 * Auraluxe Audio Labs EQ Screen
 * Integrates 5-Band Biquad filters, Stereo Panner node, presets, and audio controls.
 */

import { useMusicStore } from '../store/musicStore';
import { EqualizerSettings } from '../types';
import { Sliders, RotateCcw, Volume2, HelpCircle } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

const PRESETS: Record<string, EqualizerSettings> = {
  'Flat / Default': { band60: 0, band250: 0, band1000: 0, band4000: 0, band16000: 0 },
  'Cyber Bass Boost': { band60: 10, band250: 6, band1000: -2, band4000: 1, band16000: 4 },
  'Lofi Ambient Warmth': { band60: 6, band250: 8, band1000: 2, band4000: -4, band16000: -8 },
  'Acoustic Vocals': { band60: -2, band250: 2, band1000: 8, band4000: 6, band16000: 2 },
  'Electric Highwave': { band60: -4, band250: -1, band1000: 4, band4000: 8, band16000: 11 },
};

export default function EqualizerView() {
  const { equalizer, playback, setEQ, setBalance, setSpeed } = useMusicStore();

  const handleSliderChange = (band: keyof EqualizerSettings, val: number) => {
    const updated = { ...equalizer, [band]: val };
    setEQ(updated);
  };

  const applyPreset = (presetName: string) => {
    if (PRESETS[presetName]) {
      setEQ({ ...PRESETS[presetName] });
    }
  };

  const handleReset = () => {
    setEQ({ band60: 0, band250: 0, band1000: 0, band4000: 0, band16000: 0 });
    setBalance(0);
  };

  const getActiveTrack = () => {
    const { queue, currentTrackIndex } = playback;
    if (currentTrackIndex >= 0 && queue[currentTrackIndex]) {
      return queue[currentTrackIndex];
    }
    return null;
  };

  const activeTrack = getActiveTrack();

  const EQ_BANDS = [
    { key: 'band60' as const, label: '60Hz', sub: 'Sub-Bass' },
    { key: 'band250' as const, label: '250Hz', sub: 'Low-Mid' },
    { key: 'band1000' as const, label: '1kHz', sub: 'Presence' },
    { key: 'band4000' as const, label: '4kHz', sub: 'Clarity' },
    { key: 'band16000' as const, label: '16kHz', sub: 'Sibilance' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-6 text-gray-200">
      
      {/* Header Block and Reset Controller */}
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-violet-600/30 text-violet-400 rounded-xl border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <Sliders size={20} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight uppercase text-white font-sans">TYPE-69 Laboratory</h1>
            <p className="text-2xs text-gray-400">Offline Web Audio 5-Band Equalizer</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-3xs font-medium uppercase tracking-wider text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 rounded-lg transition-all duration-200"
        >
          <RotateCcw size={10} />
          <span>Bypass</span>
        </button>
      </div>

      {/* 5-Band Vertical Neon Sliders */}
      <div className="bg-black/25 backdrop-blur-lg border border-white/5 rounded-2xl p-5 shadow-2xl">
        <div className="grid grid-cols-5 gap-3 h-52">
          {EQ_BANDS.map((band) => {
            const gainVal = equalizer[band.key];
            // Normalize gain: slider expects -12 (bottom) to +12 (top)
            return (
              <div key={band.key} id={`eq-band-${band.key}`} className="flex flex-col items-center justify-between h-full bg-white/[0.02] border border-white/5 py-3.5 rounded-xl hover:bg-white/[0.04] transition-all">
                {/* dB display */}
                <span className="text-3xs font-mono font-semibold text-violet-400">
                  {gainVal > 0 ? `+${gainVal}` : gainVal}
                </span>

                {/* Slider bar container */}
                <div className="relative w-7 h-32 flex items-center justify-center">
                  {/* Backdrop track line */}
                  <div className="w-1 h-28 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Glowing completed fill line */}
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-violet-600 to-rose-400"
                      style={{ height: `${((gainVal + 12) / 24) * 100}%` }}
                    />
                  </div>
                  
                  {/* Drag-handle Knob */}
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gainVal}
                    onChange={(e) => handleSliderChange(band.key, parseInt(e.target.value))}
                    className="absolute inset-y-0 w-full h-full opacity-0 cursor-ns-resize max-h-none pointer-events-auto [writing-mode:bt-lr] -webkit-appearance-slider-vertical"
                    style={{ writingMode: 'vertical-lr' }}
                  />
                  
                  {/* Floating knob styling replica */}
                  <div
                    className="absolute w-4 h-4 rounded-full bg-white border-2 border-violet-500 shadow-[0_0_12px_#8B5CF6] pointer-events-none transition-all duration-75"
                    style={{ bottom: `calc(${((gainVal + 12) / 24) * 100}% - 8px)` }}
                  />
                </div>

                {/* Frequency Tags */}
                <div className="text-center">
                  <span className="block text-2xs font-bold text-gray-200">{band.label}</span>
                  <span className="block text-4xs uppercase tracking-tight text-gray-500">{band.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Selectors */}
      <div className="space-y-2">
        <h2 className="text-4xs font-bold uppercase tracking-widest text-gray-400 px-1">Hardware Sound Presets</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((presetName) => {
            const isSelected = JSON.stringify(PRESETS[presetName]) === JSON.stringify(equalizer);
            return (
              <button
                key={presetName}
                id={`preset-${presetName.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => applyPreset(presetName)}
                className={`text-3xs border transition-all duration-300 px-3 py-2 rounded-xl uppercase font-sans tracking-wide ${
                  isSelected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                    : 'bg-white/5 text-gray-300 border-white/5 hover:border-white/15'
                }`}
              >
                {presetName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Column Panner & Speed Controllers */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stereo Balance Slider */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-3xs uppercase tracking-widest font-bold text-gray-400 font-sans">Stereo Center</span>
            <span className="text-2xs font-mono font-bold text-rose-400">
              {playback.balance === 0.0 ? 'Center' : playback.balance < 0 ? `L ${Math.abs(Math.round(playback.balance * 100))}%` : `R ${Math.round(playback.balance * 100)}%`}
            </span>
          </div>

          <div className="relative flex items-center h-6">
            <span className="text-4xs font-mono font-bold text-gray-600 mr-2">L</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={playback.balance}
              onChange={(e) => setBalance(parseFloat(e.target.value))}
              className="flex-1 accent-rose-500 h-1 cursor-ew-resize bg-gray-800 rounded-lg outline-none"
            />
            <span className="text-4xs font-mono font-bold text-gray-600 ml-2">R</span>
          </div>
          <span className="block text-4xs text-gray-500 leading-tight">Double-tap slider to level panner node central.</span>
        </div>

        {/* Speed Pitch Controller */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-3xs uppercase tracking-widest font-bold text-gray-400 font-sans">Speed Engine</span>
            <span className="text-2xs font-mono font-bold text-emerald-400">
              {playback.speed.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={playback.speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1 cursor-ew-resize bg-gray-800 rounded-lg outline-none animate-pulse-speed"
          />
          <span className="block text-4xs text-gray-500 leading-tight font-sans">Adjusts continuous playback speed of physical source.</span>
        </div>
      </div>

      {/* Real-time Oscillating Signal Indicator */}
      <div className="bg-gradient-to-b from-[#12121E] to-[#0D0D15] border border-white/5 rounded-2xl p-4 h-28 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-4xs uppercase tracking-widest font-semibold text-gray-400">Active Audio Waveform Analyser</span>
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
        </div>
        <div className="w-full h-16 relative">
          <AudioVisualizer
            isPlaying={playback.isPlaying}
            colorHex={activeTrack ? undefined : '#8B5CF6'}
            type="wave"
          />
        </div>
      </div>

    </div>
  );
}
