/**
 * Interactive Auraluxe Index Library & Scanner Screen
 * Includes: File drag-drop scanning, Category headers (Songs, Playlists, Duplicate finder),
 * Search filters, Manual playlist makers, and track list decks.
 */

import React, { useState } from 'react';
import { useMusicStore } from '../store/musicStore';
import { Track, Playlist } from '../types';
import {
  Plus, Search, FolderDown, Trash2, Library, Play, HelpCircle,
  FileAudio, CheckCircle2, RefreshCw, AlertCircle, Copy, Sparkles, Folder
} from 'lucide-react';

export default function LibraryView() {
  const {
    tracks,
    playlists,
    scanProgress,
    scanFiles,
    playTrack,
    deleteTrack,
    createPlaylist,
    deletePlaylist,
    findDuplicateSongs,
    setScreen,
    playback
  } = useMusicStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists' | 'duplicates'>('songs');

  // Manual Playlist Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [plName, setPlName] = useState('');
  const [plDesc, setPlDesc] = useState('');
  const [plIsSmart, setPlIsSmart] = useState(false);
  const [plSmartMood, setPlSmartMood] = useState<'Chill' | 'Synthwave' | 'Melancholy' | 'High Energy' | 'Cyberpunk' | 'Lofi' | ''>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      scanFiles(e.target.files);
    }
  };

  const executeCreatePlaylist = () => {
    if (!plName.trim()) return;
    const rules = plIsSmart && plSmartMood ? { mood: plSmartMood as any } : undefined;
    createPlaylist(plName, plDesc, plIsSmart, rules);
    setPlName('');
    setPlDesc('');
    setPlIsSmart(false);
    setPlSmartMood('');
    setShowCreateModal(false);
  };

  // Filter track listing based on searches
  const filteredTracks = tracks.filter((track) => {
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query) ||
      track.genre.toLowerCase().includes(query)
    );
  });

  const duplicatePairs = findDuplicateSongs();

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-5 text-gray-200">
      
      {/* File Scanner Block & Progress HUD */}
      <div className="bg-gradient-to-tr from-[#141424] to-[#0A0A10] border border-white/5 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <FolderDown size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Local Storage Scanner</h2>
              <p className="text-4xs text-gray-500">Fast-indexes device MP3, WAV, FLAC, OGG</p>
            </div>
          </div>
          
          <label className="cursor-pointer bg-rose-600 hover:bg-rose-500 text-white font-semibold text-3xs uppercase tracking-wider px-3 py-1.5 rounded-lg transition shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            Scan Folder
            <input
              type="file"
              multiple
              accept="audio/*"
              webkitdirectory=""
              directory=""
              className="hidden animate-pulse-speed"
              onChange={handleFileChange}
              // Cast helper for TypeScript directory properties
              {...({ webkitdirectory: "", directory: "" } as any)}
            />
          </label>
        </div>

        {scanProgress && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between items-center text-3xs font-medium text-gray-300">
              <span className="flex items-center space-x-1.5 font-sans">
                <RefreshCw size={10} className="animate-spin text-rose-400" />
                <span>Scanning {scanProgress.count} of {scanProgress.total} audio tracks...</span>
              </span>
              <span className="font-mono">{Math.round((scanProgress.count / scanProgress.total) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-150"
                style={{ width: `${(scanProgress.count / scanProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Category Switch Tabs */}
      <div className="flex space-x-1.5 border-b border-white/5 pb-1">
        {[
          { id: 'songs', label: 'All Songs', count: tracks.length },
          { id: 'playlists', label: 'Playlists', count: playlists.length },
          { id: 'duplicates', label: 'Duplicates', count: duplicatePairs.length }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 font-semibold text-3xs uppercase tracking-wider transition-all border-b-2 -mb-[3px] ${
                isSelected
                  ? 'text-white border-rose-500 font-bold'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-4xs font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* CORE SCREENS CONTENT SWITCH */}
      
      {activeTab === 'songs' && (
        <div className="space-y-4">
          
          {/* Instant Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, artist, play style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full font-sans text-xs bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/5 focus:border-white/10 rounded-xl py-3.5 pl-9 pr-4 text-white placeholder-gray-500 select-all outline-none transition"
            />
          </div>

          {/* List Layout */}
          <div className="space-y-2">
            {filteredTracks.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <FileAudio size={28} className="mx-auto text-gray-700 animate-pulse" />
                <p className="text-3xs text-gray-500 font-mono">NO OFFLINE METADATA MATCHES</p>
              </div>
            ) : (
              filteredTracks.map((item, index) => {
                const isActive = playback.queue[playback.currentTrackIndex]?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Floating artwork box */}
                    <div
                      onClick={() => playTrack(item, filteredTracks)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-4xs font-bold shadow-md"
                        style={{ background: item.coverColor }}
                      >
                        {item.title.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 max-w-[170px]">
                        <h4 className="text-2xs font-bold text-white clamp-1 leading-tight">{item.title}</h4>
                        <p className="text-4xs text-gray-400 leading-none">{item.artist} • <span className="font-mono text-gray-500">{Math.floor(item.duration / 60)}:{(item.duration % 60) < 10 ? '0' : ''}{item.duration % 60}</span></p>
                      </div>
                    </div>

                    {/* Controls indicators */}
                    <div className="flex items-center space-x-2">
                      {isActive && playback.isPlaying ? (
                        <span className="flex space-x-1 items-center px-1">
                          <span className="w-1 h-2 bg-rose-500 rounded animate-[bounce_0.8s_infinite_100ms]" />
                          <span className="w-1 h-3.5 bg-rose-500 rounded animate-[bounce_0.8s_infinite_300ms]" />
                          <span className="w-1 h-2.5 bg-rose-500 rounded animate-[bounce_0.8s_infinite_500ms]" />
                        </span>
                      ) : (
                        <button
                          onClick={() => playTrack(item, filteredTracks)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteTrack(item.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/[0.01] p-2 rounded-xl border border-white/5">
            <span className="text-4xs font-bold uppercase tracking-widest text-gray-500">Local Deck Collections</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-3xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-lg transition"
            >
              <Plus size={11} />
              <span>Assemble</span>
            </button>
          </div>

          {/* Assembly pop modal trigger */}
          {showCreateModal && (
            <div id="playlist-create-modal" className="bg-black/95 border border-white/10 rounded-2xl p-4 space-y-4.5 shadow-2xl animation-scale-up">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-2xs font-bold uppercase tracking-wider text-white">Assemble Playlist</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-4xs font-bold text-gray-500 hover:text-gray-300 uppercase"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <input
                  type="text"
                  placeholder="Playlist title (e.g., Chill Beats)"
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-xl px-3 py-2.5 text-white"
                />
                
                <input
                  type="text"
                  placeholder="Short descriptions..."
                  value={plDesc}
                  onChange={(e) => setPlDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-white/10 rounded-xl px-3 py-2.5 text-white"
                />

                <div className="flex items-center justify-between py-1 px-1 border-t border-b border-white/5">
                  <span className="text-3xs uppercase tracking-wider text-gray-400 font-bold">Smart Mood playlist mapping</span>
                  <input
                    type="checkbox"
                    checked={plIsSmart}
                    onChange={(e) => setPlIsSmart(e.target.checked)}
                    className="accent-rose-500 w-3.5 h-3.5"
                  />
                </div>

                {plIsSmart && (
                  <div className="space-y-1.5">
                    <span className="block text-4xs uppercase tracking-widest text-gray-500">Pick Smart mood query target</span>
                    <select
                      value={plSmartMood}
                      onChange={(e: any) => setPlSmartMood(e.target.value)}
                      className="w-full bg-[#12121e] border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="">Choose mood...</option>
                      <option value="Chill">Chill relaxation rhythms</option>
                      <option value="Synthwave">High overdrive Synthwave</option>
                      <option value="Cyberpunk">Glitch industrial Cyberpunk</option>
                      <option value="Lofi">Lofi study cafe</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={executeCreatePlaylist}
                  disabled={!plName.trim()}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-3xs uppercase tracking-widest py-3 rounded-xl transition shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                >
                  Confirm Assembly Completed
                </button>
              </div>
            </div>
          )}

          {/* List existing playlists */}
          <div className="grid grid-cols-1 gap-2.5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/15">
                    <Library size={16} />
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold text-white flex items-center space-x-2">
                      <span>{pl.name}</span>
                      {pl.isSmart && (
                        <span className="px-1.5 py-0.5 text-4xs font-mono font-bold bg-violet-600/20 text-violet-400 rounded border border-violet-500/15">
                          SMART AI
                        </span>
                      )}
                    </h4>
                    <p className="text-4xs text-gray-400 tracking-wide mt-0.5 clamped-1 max-w-[190px]">{pl.description}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Retrieve rule matching songs or trackId array
                      const sTracks = pl.isSmart && pl.rules 
                        ? tracks.filter(t => !pl.rules!.mood || t.mood === pl.rules!.mood)
                        : tracks.filter(t => pl.trackIds.includes(t.id));
                      
                      if (sTracks.length > 0) {
                        playTrack(sTracks[0], sTracks);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition"
                  >
                    <Play size={10} fill="currentColor" />
                  </button>

                  <button
                    onClick={() => deletePlaylist(pl.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start space-x-3">
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-3xs font-bold uppercase tracking-wider text-amber-400">Low-Storage optimization</h4>
              <p className="text-4xs text-gray-400 leading-tight font-sans">
                Automatically scans your physical browser disk to find songs with matching finger-print title tags and exact durations. Deleting unnecessary matching duplicates frees up space!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {duplicatePairs.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 animate-pulse" />
                <p className="text-3xs text-emerald-400 uppercase tracking-widest font-mono">LO-DISK COMPLETELY OPTIMIZED</p>
                <p className="text-4xs text-gray-500 font-sans">No redundant tracks detected</p>
              </div>
            ) : (
              duplicatePairs.map((pair, idx) => (
                <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-2xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-3xs font-bold text-gray-300 clamp-1 uppercase tracking-tight">{pair.original.title}</span>
                    <span className="text-4xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/15 px-1.5 py-0.5 rounded">DUP MATCH</span>
                  </div>

                  <div className="space-y-2">
                    {/* Original card */}
                    <div className="flex items-center justify-between text-2xs p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <div>
                        <span className="block font-bold text-white clamp-1">Original: {pair.original.title}</span>
                        <span className="block text-4xs text-gray-400 font-sans">{pair.original.artist} • {pair.original.genre}</span>
                      </div>
                      <span className="text-4xs font-mono font-bold text-emerald-400 uppercase">Keep</span>
                    </div>

                    {/* Duplicate mapping list */}
                    {pair.duplicates.map((dup) => (
                      <div key={dup.id} className="flex items-center justify-between text-2xs p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                        <div>
                          <span className="block font-bold text-white clamp-1">Duplicate: {dup.title}</span>
                          <span className="block text-4xs text-gray-400 font-sans">File Size: {dup.size ? `${(dup.size / 1024 / 1024).toFixed(2)} MB` : 'Simulated'}</span>
                        </div>
                        <button
                          onClick={() => deleteTrack(dup.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-4xs font-bold uppercase hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-md transition"
                        >
                          <Trash2 size={9} />
                          <span>Trash</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
