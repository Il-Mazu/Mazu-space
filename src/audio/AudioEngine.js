import { useSyncExternalStore } from 'react';
import { CHAPELS } from '../data/chapels.js';
import { sceneBus, subscribeSection } from '../state/sceneBus.js';
import { CathedralAudioBus } from './cathedralSynth.js';

const listeners = new Set();

const state = {
  soundEnabled: false,
  unlocked: false,
};

let snapshot = { ...state };

let graph = null;
let sectionSubscribed = false;
const timeDomainBuf = new Uint8Array(128);
const freqBuf = new Uint8Array(128);

function emit() {
  snapshot = { ...state };
  listeners.forEach((fn) => fn());
}

function chapelId(idx) {
  return CHAPELS[idx]?.id;
}

function ensureSectionSync() {
  if (sectionSubscribed) return;
  sectionSubscribed = true;
  subscribeSection((idx) => {
    if (graph) {
      graph.cathedral.setChapelTint(chapelId(idx));
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
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;

    // The scene reacts to the site's own sound bed, so tap its master output.
    const cathedral = new CathedralAudioBus(ctx);
    cathedral.masterGain.connect(analyser);
    graph = { ctx, analyser, cathedral };
  } catch {
    graph = null;
  }
  return graph;
}

function syncGains() {
  if (!graph) return;
  graph.cathedral.setActive({
    unlocked: state.unlocked,
    enabled: state.soundEnabled,
    chapelId: chapelId(sceneBus.activeSection),
  });
}

export function unlockAudio(enableSound) {
  state.unlocked = true;
  state.soundEnabled = Boolean(enableSound);
  sceneBus.soundEnabled = state.soundEnabled;
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

export function playGlitchBurst() {
  if (!state.soundEnabled || sceneBus.reducedMotion) return;
  ensureGraph()?.cathedral.playGlitchBurst();
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

export function sampleAudio() {
  const metrics = sceneBus.audioMetrics;
  const active = Boolean(state.soundEnabled && graph && graph.ctx.state === 'running');
  metrics.isPlaying = active;

  if (!active) {
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
