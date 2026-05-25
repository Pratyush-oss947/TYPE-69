/**
 * Auraluxe Offline Audio Engine
 * Uses pure Web Audio API & HTML5 Audio.
 * Implements: Real-time 5-Band EQ, Stereo Balance, Volume, Speed control,
 * Visualizer spectrum capture, and interactive procedural theme synthesizer for high-fidelity offline playback.
 */

import { Track, EqualizerSettings } from '../types';

export class AuraluxeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  
  // Media element playback
  private currentAudio: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private audioObjectURL: string | null = null;

  // Synths & Procedural generator state
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private synthInterval: any = null;
  private synthTempo: number = 110; // BPM
  private synthBeatCount: number = 0;
  private isSynthPlaying: boolean = false;
  private synthTrackId: string | null = null;

  // Configuration
  private volume: number = 0.8;
  private speed: number = 1.0;
  private balance: number = 0.0; // -1 to 1
  private eqSettings: EqualizerSettings = {
    band60: 0,
    band250: 0,
    band1000: 0,
    band4000: 0,
    band16000: 0
  };

  // Listeners for progress updates
  private onTimeUpdateListener: ((time: number) => void) | null = null;
  private onEndedListener: (() => void) | null = null;
  private updateTimer: any = null;

  // Track progress when synth is playing
  private synthProgress: number = 0;
  private synthDuration: number = 180; // 3 minutes standard synth length

  initContext() {
    if (this.ctx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Analyser node for gorgeous floating visualizations
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    
    // Setup 5-Band Equalizer (Standard music frequencies)
    const eqFrequencies = [60, 250, 1000, 4000, 16000];
    const eqTypes: BiquadFilterType[] = ['peaking', 'peaking', 'peaking', 'peaking', 'peaking'];
    
    let lastNode: AudioNode = this.analyser;
    
    this.eqFilters = eqFrequencies.map((freq, index) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = eqTypes[index];
      filter.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx!.currentTime);
      filter.gain.setValueAtTime(this.eqSettings[this.getBandKey(index)], this.ctx!.currentTime);
      
      lastNode.connect(filter);
      lastNode = filter;
      return filter;
    });

    // Stereo Panner
    try {
      this.panner = this.ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(this.balance, this.ctx.currentTime);
      lastNode.connect(this.panner);
      lastNode = this.panner;
    } catch (e) {
      console.warn('Stereo panner not standard, bypassing', e);
    }
    
    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    
    lastNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  private getBandKey(index: number): keyof EqualizerSettings {
    const keys: (keyof EqualizerSettings)[] = ['band60', 'band250', 'band1000', 'band4000', 'band16000'];
    return keys[index];
  }

  // CONTROLS BINDING
  setVolume(volume: number) {
    this.volume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
    if (this.currentAudio) {
      this.currentAudio.volume = volume;
    }
  }

  setSpeed(speed: number) {
    this.speed = speed;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = speed;
    }
    // Speed alters synth tempo
    if (this.isSynthPlaying) {
      this.stopSynthTimer();
      this.startSynthTimer();
    }
  }

  setBalance(balance: number) {
    this.balance = balance;
    if (this.panner && this.ctx) {
      this.panner.pan.setValueAtTime(balance, this.ctx.currentTime);
    }
  }

  setEQ(settings: EqualizerSettings) {
    this.eqSettings = settings;
    if (this.eqFilters.length === 5 && this.ctx) {
      const keys: (keyof EqualizerSettings)[] = ['band60', 'band250', 'band1000', 'band4000', 'band16000'];
      keys.forEach((key, index) => {
        const filter = this.eqFilters[index];
        if (filter) {
          filter.gain.setValueAtTime(settings[key], this.ctx!.currentTime);
        }
      });
    }
  }

  // ANALYSER SPECTRA FOR ANIMATION
  getByteFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // EVENT BINDINGS
  onTimeUpdate(callback: (time: number) => void) {
    this.onTimeUpdateListener = callback;
  }

  onEnded(callback: () => void) {
    this.onEndedListener = callback;
  }

  // PLAYBACK LOGIC
  async play(track: Track, startTimeOffset: number = 0) {
    this.initContext();
    if (this.ctx!.state === 'suspended') {
      await this.ctx!.resume();
    }

    // Stop existing anything
    this.stop();

    if (track.filePath || track.blob) {
      // User scanned file
      await this.playLocalFile(track, startTimeOffset);
    } else {
      // Procedural sound track synth
      this.playSynthTrack(track, startTimeOffset);
    }
    
    this.startProgressTracker();
  }

  private async playLocalFile(track: Track, startTimeOffset: number) {
    try {
      this.currentAudio = new Audio();
      this.currentAudio.crossOrigin = 'anonymous';

      let fileSource = '';
      if (track.blob) {
        fileSource = URL.createObjectURL(track.blob);
        this.audioObjectURL = fileSource;
      } else if (track.filePath) {
        fileSource = track.filePath;
      }

      this.currentAudio.src = fileSource;
      this.currentAudio.playbackRate = this.speed;
      this.currentAudio.currentTime = startTimeOffset;

      // Link to AudioContext
      this.sourceNode = this.ctx!.createMediaElementSource(this.currentAudio);
      this.sourceNode.connect(this.analyser!);

      this.currentAudio.play();

      this.currentAudio.onended = () => {
        if (this.onEndedListener) this.onEndedListener();
      };
    } catch (e) {
      console.error('Error playing source file, falling back to instant ending', e);
      if (this.onEndedListener) this.onEndedListener();
    }
  }

  private playSynthTrack(track: Track, startTimeOffset: number) {
    this.isSynthPlaying = true;
    this.synthTrackId = track.id;
    this.synthProgress = startTimeOffset;
    this.synthDuration = track.duration;
    this.synthBeatCount = 0;

    // Direct configuration of the procedural rhythm based on the theme
    if (track.genre.toLowerCase().includes('lofi') || track.mood === 'Lofi') {
      this.synthTempo = 72; // Slow, lazy beats
    } else if (track.mood === 'Synthwave' || track.mood === 'Cyberpunk') {
      this.synthTempo = 118; // Hyper energetic drive!
    } else {
      this.synthTempo = 90; // Balanced chill mood
    }

    this.startSynthTimer();
  }

  private startSynthTimer() {
    if (!this.isSynthPlaying) return;
    
    // Interval calculated on BPM & speed modifier
    const intervalMs = (60000 / this.synthTempo / 2) / this.speed; // Eighth notes
    
    this.synthInterval = setInterval(() => {
      this.triggerSynthBeat();
    }, intervalMs);
  }

  private stopSynthTimer() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // PROCEDURAL CYBER-SYNTH GENERATOR
  // Emits real, authentic-sounding analog notes to simulate full-fidelity music!
  private triggerSynthBeat() {
    if (!this.ctx || !this.isSynthPlaying) return;
    
    const time = this.ctx.currentTime;
    const beat = this.synthBeatCount % 16;
    this.synthBeatCount++;

    const isLofi = this.synthTempo <= 80;
    const isFast = this.synthTempo >= 110;

    // Dynamic procedural bass notes scale structure (Pentatonic Cyber-Scale in C-minor)
    const scale = [65.41, 73.42, 77.78, 87.31, 98.00, 110.00, 116.54, 130.81]; // C2, D2, Eb2, F2, G2, Ab2, Bb2, C3
    
    // Base synth chord progression
    const progression = [
      [130.81, 155.56, 196.00], // Cm
      [116.54, 146.83, 174.61], // Bb
      [98.00, 116.54, 146.83],  // Gm
      [103.83, 130.81, 155.56]  // Ab
    ];

    const currentProgIndex = Math.floor((this.synthBeatCount / 32) % 4);
    const chords = progression[currentProgIndex];

    // Trigger Kick drum on beats 1, 5, 9, 13
    if (beat === 0 || beat === 8 || (beat === 4 && (isFast || Math.random() > 0.4)) || beat === 12) {
      this.synthesizeSimpleKick(time, isLofi);
    }

    // Trigger Hihat on alternate ticks
    if (beat % 4 === 2) {
      this.synthesizeHihat(time);
    }

    // Trigger Bass Synth
    if (beat % 2 === 0) {
      const scaleIndex = (beat / 2) % scale.length;
      let bassFreq = scale[scaleIndex];
      if (isLofi) bassFreq *= 0.5; // lower bass for chill lofi
      this.synthesizeSynthBass(bassFreq, time, isLofi ? 0.35 : 0.22);
    }

    // Trigger Ambient Pad on progression shift (beat 0)
    if (beat === 0) {
      chords.forEach((freq, idx) => {
        // Soft spread
        this.synthesizePadNote(freq * 2, time, 4.0, 0.04);
      });
    }

    // Trigger Melody Arpeggio for Synthwave themes
    if (isFast && beat % 3 === 0) {
      const melodyFreq = chords[beat % chords.length] * 2.5;
      this.synthesizeMelodyLead(melodyFreq, time);
    }
  }

  // WARM procedural analog synthesizers
  private synthesizeSimpleKick(time: number, isLofi: boolean) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.frequency.setValueAtTime(isLofi ? 110 : 150, time);
    // pitch slide down from 150Hz to 40Hz
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.15);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.start(time);
    osc.stop(time + 0.2);

    this.activeOscillators.push({ osc, gain });
    this.garbageCollectOscs();
  }

  private synthesizeHihat(time: number) {
    if (!this.ctx || !this.analyser) return;

    // Whitenoise simulated via thin highpass filter osc frequencies
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Low cost filter
    const hiFilter = this.ctx.createBiquadFilter();
    hiFilter.type = 'highpass';
    hiFilter.frequency.setValueAtTime(7000, time);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(10000, time);

    osc.connect(hiFilter);
    hiFilter.connect(gain);
    gain.connect(this.analyser);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);

    this.activeOscillators.push({ osc, gain });
  }

  private synthesizeSynthBass(frequency: number, time: number, duration: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, time);

    osc.connect(gain);
    gain.connect(this.analyser);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.05);

    this.activeOscillators.push({ osc, gain });
  }

  private synthesizePadNote(frequency: number, time: number, duration: number, volume: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, time);
    // subtle manual vibrato
    osc.frequency.linearRampToValueAtTime(frequency + 2, time + duration / 2);
    osc.frequency.linearRampToValueAtTime(frequency - 1, time + duration);

    osc.connect(gain);
    gain.connect(this.analyser);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.8); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // smooth release

    osc.start(time);
    osc.stop(time + duration + 0.1);

    this.activeOscillators.push({ osc, gain });
  }

  private synthesizeMelodyLead(frequency: number, time: number) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, time);

    osc.connect(gain);
    gain.connect(this.analyser);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.start(time);
    osc.stop(time + 0.3);

    this.activeOscillators.push({ osc, gain });
  }

  private garbageCollectOscs() {
    // Keep active oscillation tracking clean
    if (this.activeOscillators.length > 30) {
      const removed = this.activeOscillators.splice(0, 15);
      removed.forEach(({ osc, gain }) => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      });
    }
  }

  private startProgressTracker() {
    this.stopProgressTracker();
    
    this.updateTimer = setInterval(() => {
      if (this.currentAudio) {
        const time = this.currentAudio.currentTime;
        if (this.onTimeUpdateListener) this.onTimeUpdateListener(time);
      } else if (this.isSynthPlaying) {
        // Increment synth play status
        this.synthProgress += 0.25 * this.speed;
        if (this.onTimeUpdateListener) {
          this.onTimeUpdateListener(Math.min(this.synthProgress, this.synthDuration));
        }

        if (this.synthProgress >= this.synthDuration) {
          this.stop();
          if (this.onEndedListener) this.onEndedListener();
        }
      }
    }, 250);
  }

  private stopProgressTracker() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    this.stopSynthTimer();
    this.stopProgressTracker();
  }

  resume() {
    if (this.currentAudio) {
      this.currentAudio.play();
    } else if (this.isSynthPlaying) {
      this.startSynthTimer();
    }
    this.startProgressTracker();
  }

  setIsPlaying(isPlaying: boolean) {
    if (isPlaying) {
      this.resume();
    } else {
      this.pause();
    }
  }

  seek(seconds: number) {
    if (this.currentAudio) {
      this.currentAudio.currentTime = seconds;
    } else if (this.isSynthPlaying) {
      this.synthProgress = seconds;
    }
    if (this.onTimeUpdateListener) {
      this.onTimeUpdateListener(seconds);
    }
  }

  stop() {
    this.stopSynthTimer();
    this.stopProgressTracker();
    
    this.isSynthPlaying = false;
    this.synthTrackId = null;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioObjectURL) {
      URL.revokeObjectURL(this.audioObjectURL);
      this.audioObjectURL = null;
    }

    // Terminate any ongoing notes
    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }
}

export const audioInstance = new AuraluxeAudioEngine();
