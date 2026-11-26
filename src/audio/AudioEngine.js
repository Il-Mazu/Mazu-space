import { useSyncExternalStore } from 'react';
import { BOOT_SOUND, TRACKS } from '../data/tracks.js';
import { sceneBus } from '../state/sceneBus.js';

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

function emit() {
  snapshot = { ...state };
  listeners.forEach((fn) => fn());
}

function ensureAudio() {
  if (audioEl || typeof Audio === 'undefined') return audioEl;
  audioEl = new Audio();
  audioEl.preload = 'none';
  audioEl.volume = state.soundEnabled ? state.volume : 0;

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
      emit();
      return;
    }
    nextTrack();
  });

  return audioEl;
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
  const el = ensureAudio();
  if (!el) return;
  const track = TRACKS[state.currentTrack];
  if (el.getAttribute('data-track') !== String(state.currentTrack)) {
    el.src = track.src;
    el.setAttribute('data-track', String(state.currentTrack));
    state.currentTime = 0;
    state.duration = track.duration;
  }
  if (autoPlay) {
    if (!state.soundEnabled) {
      state.soundEnabled = true;
      sceneBus.soundEnabled = true;
    }
    el.volume = state.volume;
    el.play().catch(() => {});
  }
}

export function unlockAudio(enableSound) {
  state.unlocked = true;
  state.soundEnabled = Boolean(enableSound);
  sceneBus.soundEnabled = state.soundEnabled;
  if (audioEl) {
    audioEl.volume = state.soundEnabled ? state.volume : 0;
  }
  emit();
}

export function playBootSound() {
  if (!state.soundEnabled || typeof Audio === 'undefined') return;
  const boot = new Audio(BOOT_SOUND);
  boot.volume = 0.2;
  boot.play().catch(() => {});
}

export function setSoundEnabled(next) {
  state.soundEnabled = Boolean(next);
  sceneBus.soundEnabled = state.soundEnabled;
  if (audioEl) {
    audioEl.volume = state.soundEnabled ? state.volume : 0;
  }
  emit();
}

export function toggleSound() {
  setSoundEnabled(!state.soundEnabled);
}

export function togglePlay() {
  const el = ensureAudio();
  if (!el) return;
  state.playing = !state.playing;
  sceneBus.audioMetrics.isPlaying = state.playing;
  if (state.playing) {
    loadCurrentSource(true);
  } else {
    el.pause();
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
  if (audioEl && state.soundEnabled) audioEl.volume = state.volume;
  emit();
}

export function seekTrack(secs) {
  const el = ensureAudio();
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
  sceneBus.audioMetrics.isPlaying = state.playing && state.soundEnabled;
  if (!sceneBus.audioMetrics.isPlaying) {
    sceneBus.audioMetrics.rms *= 0.9;
    sceneBus.audioMetrics.bass *= 0.9;
    sceneBus.audioMetrics.mid *= 0.9;
    sceneBus.audioMetrics.high *= 0.9;
  }
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
