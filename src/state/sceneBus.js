// Shared mutable state read inside R3F useFrame to avoid per-frame React re-renders.
const listeners = new Set();

export const sceneBus = {
  scrollProgress: 0,
  scrollVelocity: 0,
  activeSection: 0,
  pointer: { x: 0, y: 0, vx: 0, vy: 0 },
  glitchIntensity: 0,
  lastGlitchAt: 0,
  eyeClose: 0,
  entered: false,
  bootPhase: 'closed', // 'closed' | 'opening' | 'eye-on' | 'done'
  doorPush: 0,
  eyePower: 0,
  bootProgress: 0,
  perfTier: 'high', // 'high' | 'medium' | 'low'
  reducedMotion: false,
  soundEnabled: false,
  listening: false,
  // Close-up target the camera glides to (a Works niche). null = follow the scroll path.
  focus: null, // { pos: [x, y, z], look: [x, y, z] }
  focusT: 0,
  precompiling: false,
  guestFocus: null, // guestbook entry id whose candle is highlighted
  audioMetrics: {
    rms: 0,
    bass: 0,
    mid: 0,
    high: 0,
    isPlaying: false,
    timeDomain: new Uint8Array(128),
  },
};

export function triggerGlitch(strength = 0.85) {
  if (sceneBus.reducedMotion) return;
  const now = performance.now();
  // Strictly clamp discrete glitch spikes below 3 flashes/sec (min 360ms gap).
  if (now - sceneBus.lastGlitchAt < 360) return;
  sceneBus.lastGlitchAt = now;
  sceneBus.glitchIntensity = Math.min(1, strength);
}

const sectionSubscribers = new Set();
export function subscribeSection(fn) {
  sectionSubscribers.add(fn);
  return () => sectionSubscribers.delete(fn);
}
export function setActiveSection(index) {
  if (sceneBus.activeSection === index) return;
  sceneBus.activeSection = index;
  sectionSubscribers.forEach((fn) => fn(index));
}

const jumpHandlers = new Set();
export function subscribeJump(fn) {
  jumpHandlers.add(fn);
  return () => jumpHandlers.delete(fn);
}
export function jumpToSection(idOrIndex) {
  jumpHandlers.forEach((fn) => fn(idOrIndex));
}

const stateListeners = new Set();
export function subscribeSceneState(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}
export function emitSceneState() {
  stateListeners.forEach((fn) => fn());
}

export function subscribeBus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notifyBus() {
  listeners.forEach((fn) => fn());
}
