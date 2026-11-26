import { useSyncExternalStore } from 'react';
import { TRACKS } from '../data/tracks.js';
import { sceneBus, subscribeSection } from '../state/sceneBus.js';
import { CathedralAudioBus } from './cathedralSynth.js';

const listeners = new Set();

const state = {
  currentTrack: 0,
  playing: false,
  volume: 0.75,
  shuffle: false,
  loopMode: 0, // 0=off, 1=all, 2=one
  soundEnabled: false,
  currentTime: 0,
  duration: 0,
  durations: TRACKS.map(() => 0),
  unlocked: false,
};

let snapshot = { ...state };
let audioEl = null;

// Single Web Audio graph shared across the session (createMediaElementSource binds once).
let graph = null;
let sectionSubscribed = false;
let probedDurations = false;
const timeDomainBuf = new Uint8Array(128);
const freqBuf = new Uint8Array(128);

function emit() {
  snapshot = { ...state, durations: [...state.durations] };
  listeners.forEach((fn) => fn());
}

function ensureAudioElement() {
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
        state.durations[state.currentTrack] = audioEl.duration;
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
  return audioEl;
}

function ensureSectionSync() {
  if (sectionSubscribed) return;
  sectionSubscribed = true;
  subscribeSection((idx) => {
    if (graph) {
      graph.cathedral.setChapelTint(idx);
      if (state.unlocked && state.soundEnabled && !sceneBus.reducedMotion && sceneBus.bootPhase === 'done') {
        graph.cathedral.playSectionShift();
      }
    }
  });
}

function ensureGraph() {
  ensureSectionSync();
  if (graph) {
    if (graph.ctx.state === 'suspended') graph.ctx.resume().catch(() => {});
    return graph;
  }
  const el = ensureAudioElement();
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

    const cathedral = new CathedralAudioBus(ctx);
    graph = { ctx, analyser, musicGain, cathedral };
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
    g.cathedral.setActive({
      unlocked: state.unlocked,
      enabled: state.soundEnabled,
      musicPlaying: state.playing,
      chapelIndex: sceneBus.activeSection,
    });
  } else if (audioEl) {
    audioEl.volume = state.soundEnabled ? state.volume : 0;
  }
}

export function probeTrackDurations() {
  if (probedDurations || typeof Audio === 'undefined') return;
  probedDurations = true;
  TRACKS.forEach((track, i) => {
    if (state.durations[i] > 0 || !track?.src) return;
    const probe = new Audio();
    probe.preload = 'metadata';
    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onMeta);
      probe.removeEventListener('error', cleanup);
      probe.src = '';
    };
    const onMeta = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        state.durations[i] = probe.duration;
        if (i === state.currentTrack && state.duration === 0) {
          state.duration = probe.duration;
        }
        emit();
      }
      cleanup();
    };
    probe.addEventListener('loadedmetadata', onMeta);
    probe.addEventListener('error', cleanup);
    probe.src = track.src;
  });
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
  const el = ensureAudioElement();
  if (!el) return;
  const track = TRACKS[state.currentTrack];
  if (!track) return;
  if (el.getAttribute('data-track') !== String(state.currentTrack)) {
    el.src = track.src;
    el.setAttribute('data-track', String(state.currentTrack));
    state.currentTime = 0;
    state.duration = state.durations[state.currentTrack] || 0;
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
  ensureAudioElement();
  ensureSectionSync();
  if (state.soundEnabled) ensureGraph();
  syncGains();
  emit();
}

export function playDoorEntry() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playDoorEntry();
}

export function playCrtPowerOn() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playCrtPowerOn();
}

export function playHoverTick() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playHoverTick();
}

export function playClickHit() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playClickHit();
}

export function playSectionShift() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playSectionShift();
}

export function playGlitchBurst() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playGlitchBurst();
}

export function playCutNoise() {
  playGlitchBurst();
}

export function playKeystroke() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playKeystroke();
}

export function playLightboxTone(opening = true) {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playLightboxTone(opening);
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
  const next = !state.soundEnabled;
  setSoundEnabled(next);
  if (next) playClickHit();
}

export function togglePlay() {
  const el = ensureAudioElement();
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
    state.duration = state.durations[nextIdx] || 0;
  }
  emit();
}

export function nextTrack() {
  const nextIdx = pickIndex(1);
  state.currentTrack = nextIdx;
  if (state.playing) loadCurrentSource(true);
  else {
    state.currentTime = 0;
    state.duration = state.durations[nextIdx] || 0;
  }
  emit();
}

export function setVolume(vol) {
  state.volume = Math.max(0, Math.min(1, vol));
  syncGains();
  emit();
}

export function seekTrack(secs) {
  const el = ensureAudioElement();
  if (!el) return;
  const maxDur = state.duration || state.durations[state.currentTrack] || 0;
  const clamped = Math.max(0, Math.min(maxDur, secs));
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

  if (!active || !graph) {
    metrics.rms *= 0.85;
    metrics.bass *= 0.85;
    metrics.mid *= 0.85;
    metrics.high *= 0.85;
    return;
  }

  const { analyser } = graph;
  analyser.getByteFrequencyData(freqBuf);
  analyser.getByteTimeDomainData(timeDomainBuf);

  let bassSum = 0;
  let midSum = 0;
  let highSum = 0;
  for (let i = 0; i < 10; i++) bassSum += freqBuf[i];
  for (let i = 10; i < 42; i++) midSum += freqBuf[i];
  for (let i = 42; i < 96; i++) highSum += freqBuf[i];

  metrics.bass = bassSum / (10 * 255);
  metrics.mid = midSum / (32 * 255);
  metrics.high = highSum / (54 * 255);
  metrics.rms = metrics.bass * 0.5 + metrics.mid * 0.35 + metrics.high * 0.15;
  metrics.timeDomain = timeDomainBuf;
}

export function useAudioState() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
  );
}
