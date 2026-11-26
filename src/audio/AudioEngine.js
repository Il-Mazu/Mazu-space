import { useSyncExternalStore } from 'react';
import { AMBIENT_SOUND, BOOT_SOUND, TRACKS } from '../data/tracks.js';
import { sceneBus } from '../state/sceneBus.js';

const AMBIENT_VOL = 0.06;
const listeners = new Set();

const state = {
  currentTrack: 0,
  playing: false,
  volume: 0.75,
  shuffle: false,
  loopMode: 0, // 0=off, 1=all, 2=one
  soundEnabled: false,
  currentTime: 0,
  duration: TRACKS[0].duration,
  unlocked: false,
};

let snapshot = { ...state };
let audioEl = null;
let ambientEl = null;

// Single Web Audio graph shared across the session (createMediaElementSource can only bind once).
let graph = null;
const timeDomainBuf = new Uint8Array(128);
const freqBuf = new Uint8Array(128);

function emit() {
  snapshot = { ...state };
  listeners.forEach((fn) => fn());
}

function ensureAudioElements() {
  if (typeof Audio === 'undefined') return null;

  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'none';
    audioEl.crossOrigin = 'anonymous';
    audioEl.volume = 1;

    audioEl.addEventListener('timeupdate', () => {
      state.currentTime = audioEl.currentTime || 0;
      emit();
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
        state.duration = audioEl.duration;
        emit();
      }
    });

    audioEl.addEventListener('ended', () => {
      if (state.loopMode === 2) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
        return;
      }
      if (state.loopMode === 0 && state.currentTrack === TRACKS.length - 1 && !state.shuffle) {
        state.playing = false;
        state.currentTime = 0;
        syncGains();
        emit();
        return;
      }
      nextTrack();
    });
  }

  if (!ambientEl) {
    ambientEl = new Audio();
    ambientEl.preload = 'none';
    ambientEl.loop = true;
    ambientEl.volume = AMBIENT_VOL;
  }

  return audioEl;
}

function ensureGraph() {
  if (graph) {
    if (graph.ctx.state === 'suspended') graph.ctx.resume().catch(() => {});
    return graph;
  }
  const el = ensureAudioElements();
  if (!el || typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;

    const musicGain = ctx.createGain();
    musicGain.gain.value = state.soundEnabled ? state.volume : 0;

    const source = ctx.createMediaElementSource(el);
    source.connect(analyser);
    analyser.connect(musicGain);
    musicGain.connect(ctx.destination);

    graph = { ctx, analyser, musicGain };
  } catch {
    graph = null;
  }
  return graph;
}

function syncGains() {
  const g = graph;
  if (g) {
    const target = state.soundEnabled ? state.volume : 0;
    g.musicGain.gain.setTargetAtTime(target, g.ctx.currentTime, 0.05);
  } else if (audioEl) {
    audioEl.volume = state.soundEnabled ? state.volume : 0;
  }

  if (ambientEl) {
    const wantAmbient = state.unlocked && state.soundEnabled && !state.playing;
    if (wantAmbient) {
      if (!ambientEl.getAttribute('data-loaded')) {
        ambientEl.src = AMBIENT_SOUND;
        ambientEl.setAttribute('data-loaded', '1');
      }
      ambientEl.volume = AMBIENT_VOL;
      ambientEl.play().catch(() => {});
    } else {
      ambientEl.pause();
    }
  }
}

function pickIndex(dir) {
  if (state.shuffle && TRACKS.length > 1) {
    let next = state.currentTrack;
    while (next === state.currentTrack) {
      next = Math.floor(Math.random() * TRACKS.length);
    }
    return next;
  }
  return (state.currentTrack + dir + TRACKS.length) % TRACKS.length;
}

function loadCurrentSource(autoPlay) {
  const el = ensureAudioElements();
  if (!el) return;
  const track = TRACKS[state.currentTrack];
  if (el.getAttribute('data-track') !== String(state.currentTrack)) {
    el.src = track.src;
    el.setAttribute('data-track', String(state.currentTrack));
    state.currentTime = 0;
    state.duration = track.duration;
  }
  if (autoPlay) {
    state.unlocked = true;
    if (!state.soundEnabled) {
      state.soundEnabled = true;
      sceneBus.soundEnabled = true;
    }
    ensureGraph();
    syncGains();
    el.play().catch(() => {});
  }
}

export function unlockAudio(enableSound) {
  state.unlocked = true;
  state.soundEnabled = Boolean(enableSound);
  sceneBus.soundEnabled = state.soundEnabled;
  ensureAudioElements();
  if (state.soundEnabled) ensureGraph();
  syncGains();
  emit();
}

export function playBootSound() {
  if (!state.soundEnabled || typeof Audio === 'undefined') return;
  const boot = new Audio(BOOT_SOUND);
  boot.volume = 0.2;
  boot.play().catch(() => {});
}

export function playHoverTick() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;
  const osc = g.ctx.createOscillator();
  const gain = g.ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1150, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
  gain.gain.setValueAtTime(0.025, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
  osc.connect(gain);
  gain.connect(g.ctx.destination);
  osc.start(now);
  osc.stop(now + 0.035);
}

export function playCutNoise() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;
  const osc = g.ctx.createOscillator();
  const gain = g.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + 0.09);
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
  osc.connect(gain);
  gain.connect(g.ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function setSoundEnabled(next) {
  state.unlocked = true;
  state.soundEnabled = Boolean(next);
  sceneBus.soundEnabled = state.soundEnabled;
  if (state.soundEnabled) ensureGraph();
  syncGains();
  emit();
}

export function toggleSound() {
  setSoundEnabled(!state.soundEnabled);
}

export function togglePlay() {
  const el = ensureAudioElements();
  if (!el) return;
  state.playing = !state.playing;
  sceneBus.audioMetrics.isPlaying = state.playing;
  if (state.playing) {
    loadCurrentSource(true);
  } else {
    el.pause();
    syncGains();
  }
  emit();
}

export function selectTrack(index) {
  const safe = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
  state.currentTrack = safe;
  state.playing = true;
  sceneBus.audioMetrics.isPlaying = true;
  loadCurrentSource(true);
  emit();
}

export function prevTrack() {
  const nextIdx = pickIndex(-1);
  state.currentTrack = nextIdx;
  if (state.playing) loadCurrentSource(true);
  else {
    state.currentTime = 0;
    state.duration = TRACKS[nextIdx].duration;
  }
  emit();
}

export function nextTrack() {
  const nextIdx = pickIndex(1);
  state.currentTrack = nextIdx;
  if (state.playing) loadCurrentSource(true);
  else {
    state.currentTime = 0;
    state.duration = TRACKS[nextIdx].duration;
  }
  emit();
}

export function setVolume(vol) {
  state.volume = Math.max(0, Math.min(1, vol));
  syncGains();
  emit();
}

export function seekTrack(secs) {
  const el = ensureAudioElements();
  if (!el) return;
  const clamped = Math.max(0, Math.min(state.duration, secs));
  if (el.src) el.currentTime = clamped;
  state.currentTime = clamped;
  emit();
}

export function toggleShuffle() {
  state.shuffle = !state.shuffle;
  emit();
}

export function cycleLoop() {
  state.loopMode = (state.loopMode + 1) % 3;
  emit();
}

export function sampleAudio() {
  const metrics = sceneBus.audioMetrics;
  const active = Boolean(state.playing && state.soundEnabled && audioEl && !audioEl.paused && graph);
  metrics.isPlaying = active;

  if (!active) {
    metrics.rms *= 0.88;
    metrics.bass *= 0.88;
    metrics.mid *= 0.88;
    metrics.high *= 0.88;
    return;
  }

  graph.analyser.getByteTimeDomainData(timeDomainBuf);
  graph.analyser.getByteFrequencyData(freqBuf);
  metrics.timeDomain.set(timeDomainBuf);

  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += freqBuf[i];
  let midSum = 0;
  for (let i = 8; i < 40; i++) midSum += freqBuf[i];
  let highSum = 0;
  for (let i = 40; i < 96; i++) highSum += freqBuf[i];
  let tdSum = 0;
  for (let i = 0; i < timeDomainBuf.length; i++) tdSum += Math.abs(timeDomainBuf[i] / 128 - 1);

  const bass = Math.min(1, bassSum / (8 * 255));
  const mid = Math.min(1, midSum / (32 * 255));
  const high = Math.min(1, highSum / (56 * 255));
  const rms = Math.min(1, (tdSum / timeDomainBuf.length) * 2.4);

  metrics.bass = metrics.bass * 0.65 + bass * 0.35;
  metrics.mid = metrics.mid * 0.65 + mid * 0.35;
  metrics.high = metrics.high * 0.65 + high * 0.35;
  metrics.rms = metrics.rms * 0.6 + rms * 0.4;
}

export function useAudioState() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => snapshot,
  );
}
