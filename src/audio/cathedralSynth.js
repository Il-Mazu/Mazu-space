// Procedural cathedral reverb, layered evolving ambient bed, and SFX (Web Audio API, zero external assets).

function createNoiseBuffer(ctx, seconds = 4) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.950 * b2 + white * 0.048;
    data[i] = (b0 + b1 + b2 + white * 0.14) * 0.42;
  }
  return buffer;
}

export function createCathedralImpulse(ctx, seconds = 3.6, decay = 2.6) {
  const sr = ctx.sampleRate;
  const length = Math.floor(sr * seconds);
  const buffer = ctx.createBuffer(2, length, sr);
  const early = [0.014, 0.023, 0.037, 0.052, 0.071];

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      const white = Math.random() * 2 - 1;
      lp = lp * 0.68 + white * 0.32;
      data[i] = lp * env;
    }
    early.forEach((sec, idx) => {
      const sample = Math.floor(sec * sr) + ch * 17;
      if (sample < length) {
        data[sample] += (ch === idx % 2 ? 0.52 : 0.34) / (idx + 1);
      }
    });
  }
  return buffer;
}

const CHAPEL_TINTS = {
  // heartbeat drone pulse + subtle CRT hum
  hero: { droneFreq: 145, hbDepth: 0.042, padGain: 0.16, shimmerGain: 0.0, humGain: 0.042, roomGain: 0.014, wet: 0.62 },
  // warm stone mid-pad
  about: { droneFreq: 165, hbDepth: 0.0, padGain: 0.24, shimmerGain: 0.008, humGain: 0.018, roomGain: 0.014, wet: 0.68 },
  // CRT hum and faint static, drier close air
  works: { droneFreq: 130, hbDepth: 0.0, padGain: 0.12, shimmerGain: 0.0, humGain: 0.06, roomGain: 0.024, wet: 0.42 },
  // airy overtone shimmer over a dark hall
  live: { droneFreq: 160, hbDepth: 0.0, padGain: 0.18, shimmerGain: 0.024, humGain: 0.022, roomGain: 0.014, wet: 0.66 },
  // glassy shimmer + long reverb
  dump: { droneFreq: 160, hbDepth: 0.0, padGain: 0.18, shimmerGain: 0.028, humGain: 0.018, roomGain: 0.014, wet: 0.84 },
  // deepest reverb, darker lowpass cavern
  games: { droneFreq: 112, hbDepth: 0.014, padGain: 0.20, shimmerGain: 0.0, humGain: 0.016, roomGain: 0.016, wet: 0.92 },
  vault: { droneFreq: 150, hbDepth: 0.0, padGain: 0.2, shimmerGain: 0.012, humGain: 0.018, roomGain: 0.014, wet: 0.7 },
  // receding low fifth
  exit: { droneFreq: 118, hbDepth: 0.0, padGain: 0.14, shimmerGain: 0.01, humGain: 0.016, roomGain: 0.012, wet: 0.74 },
};

export class CathedralAudioBus {
  constructor(ctx) {
    this.ctx = ctx;
    this.enabled = false;
    this.chapelId = 'hero';
    this.ambientStarted = false;
    this.creakTimer = null;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(ctx.destination);

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createCathedralImpulse(ctx, 3.6, 2.6);
    this.wetReturn = ctx.createGain();
    this.wetReturn.gain.value = 0.75;
    this.convolver.connect(this.wetReturn);
    this.wetReturn.connect(this.masterGain);

    this.ambientMaster = ctx.createGain();
    this.ambientMaster.gain.value = 0;

    this.ambientDry = ctx.createGain();
    this.ambientDry.gain.value = 0.38;
    this.ambientWet = ctx.createGain();
    this.ambientWet.gain.value = 0.65;

    this.ambientMaster.connect(this.ambientDry);
    this.ambientDry.connect(this.masterGain);
    this.ambientMaster.connect(this.ambientWet);
    this.ambientWet.connect(this.convolver);

    this.sfxDry = ctx.createGain();
    this.sfxDry.gain.value = 0.85;
    this.sfxDry.connect(this.masterGain);

    this.sfxWet = ctx.createGain();
    this.sfxWet.gain.value = 0.45;
    this.sfxWet.connect(this.convolver);

    this.noiseBuf = createNoiseBuffer(ctx, 4.0);
    this.nodes = null;
  }

  startAmbient() {
    if (this.ambientStarted) return;
    this.ambientStarted = true;
    const { ctx } = this;
    const now = ctx.currentTime;

    // Layer 1: deep detuned drone
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 145;
    droneFilter.Q.value = 1.4;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.28;
    droneFilter.connect(droneGain);
    droneGain.connect(this.ambientMaster);

    const osc55a = ctx.createOscillator();
    osc55a.type = 'sine';
    osc55a.frequency.value = 55;
    osc55a.connect(droneFilter);

    const osc55b = ctx.createOscillator();
    osc55b.type = 'triangle';
    osc55b.frequency.value = 55.35;
    const bGain = ctx.createGain();
    bGain.gain.value = 0.25;
    osc55b.connect(bGain);
    bGain.connect(droneFilter);

    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.value = 27.5;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.35;
    oscSub.connect(subGain);
    subGain.connect(droneFilter);

    // Non-commensurate filter sweep so drone never audibly loops
    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.053;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 45;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(droneFilter.frequency);

    // Heartbeat-like sub modulation (enabled mainly on Chapel I)
    const hbLfo = ctx.createOscillator();
    hbLfo.type = 'sine';
    hbLfo.frequency.value = 0.88;
    const hbLfoGain = ctx.createGain();
    hbLfoGain.gain.value = 0;
    hbLfo.connect(hbLfoGain);
    hbLfoGain.connect(droneGain.gain);

    // Layer 2: distant organ/choir formant pad
    const padGain = ctx.createGain();
    padGain.gain.value = 0.16;
    padGain.connect(this.ambientMaster);

    const formantA = ctx.createBiquadFilter();
    formantA.type = 'bandpass';
    formantA.frequency.value = 340;
    formantA.Q.value = 3.2;
    formantA.connect(padGain);

    const formantB = ctx.createBiquadFilter();
    formantB.type = 'bandpass';
    formantB.frequency.value = 780;
    formantB.Q.value = 4.0;
    formantB.connect(padGain);

    const fLfoA = ctx.createOscillator();
    fLfoA.frequency.value = 0.077;
    const fLfoAGain = ctx.createGain();
    fLfoAGain.gain.value = 95;
    fLfoA.connect(fLfoAGain);
    fLfoAGain.connect(formantA.frequency);

    const fLfoB = ctx.createOscillator();
    fLfoB.frequency.value = 0.043;
    const fLfoBGain = ctx.createGain();
    fLfoBGain.gain.value = 180;
    fLfoB.connect(fLfoBGain);
    fLfoBGain.connect(formantB.frequency);

    const padOscs = [110, 164.81, 220, 261.63].map((freq, idx) => {
      const o = ctx.createOscillator();
      o.type = idx % 2 === 0 ? 'triangle' : 'sine';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = idx === 3 ? 0.14 : 0.22;
      o.connect(g);
      g.connect(formantA);
      g.connect(formantB);
      o.start(now);
      return o;
    });

    const shimmerOsc = ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = 329.63;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.convolver);

    // Layer 3: room air tone + CRT electrical hum
    const roomSrc = ctx.createBufferSource();
    roomSrc.buffer = this.noiseBuf;
    roomSrc.loop = true;
    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = 'bandpass';
    roomFilter.frequency.value = 440;
    roomFilter.Q.value = 0.65;
    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.014;
    roomSrc.connect(roomFilter);
    roomFilter.connect(roomGain);
    roomGain.connect(this.ambientMaster);

    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 420;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.03;
    humFilter.connect(humGain);
    humGain.connect(this.ambientDry);

    const humOscs = [
      [60, 0.25],
      [120, 0.35],
      [180, 0.16],
    ].map(([freq, w]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = w;
      o.connect(g);
      g.connect(humFilter);
      o.start(now);
      return o;
    });

    osc55a.start(now);
    osc55b.start(now);
    oscSub.start(now);
    filterLfo.start(now);
    hbLfo.start(now);
    fLfoA.start(now);
    fLfoB.start(now);
    shimmerOsc.start(now);
    roomSrc.start(now);

    this.nodes = {
      droneFilter,
      hbLfoGain,
      padGain,
      shimmerGain,
      roomGain,
      humGain,
      padOscs,
      humOscs,
    };
  }

  scheduleCreak() {
    clearTimeout(this.creakTimer);
    if (!this.enabled) return;
    const delay = 9000 + Math.random() * 13000;
    this.creakTimer = setTimeout(() => {
      if (this.enabled) {
        this.playChainCreak();
      }
      this.scheduleCreak();
    }, delay);
  }

  playChainCreak() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const startF = 440 + Math.random() * 340;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 0.56, now + 0.42);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 920;
    bp.Q.value = 7.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.016, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(bp);
    bp.connect(g);
    g.connect(this.convolver);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  setChapelTint(id) {
    if (CHAPEL_TINTS[id]) this.chapelId = id;
    if (!this.nodes) return;
    const t = CHAPEL_TINTS[this.chapelId];
    const now = this.ctx.currentTime;
    const tau = 0.65;
    this.nodes.droneFilter.frequency.setTargetAtTime(t.droneFreq, now, tau);
    this.nodes.hbLfoGain.gain.setTargetAtTime(t.hbDepth, now, tau);
    this.nodes.padGain.gain.setTargetAtTime(t.padGain, now, tau);
    this.nodes.shimmerGain.gain.setTargetAtTime(t.shimmerGain, now, tau);
    this.nodes.humGain.gain.setTargetAtTime(t.humGain, now, tau);
    this.nodes.roomGain.gain.setTargetAtTime(t.roomGain, now, tau);
    this.ambientWet.gain.setTargetAtTime(t.wet, now, tau);
  }

  setActive({ unlocked, enabled, chapelId }) {
    this.enabled = Boolean(unlocked && enabled);
    const now = this.ctx.currentTime;

    if (this.enabled) {
      this.startAmbient();
      this.setChapelTint(chapelId ?? this.chapelId);
      this.masterGain.gain.setTargetAtTime(1.0, now, 0.04);
      this.ambientMaster.gain.setTargetAtTime(0.14, now, 0.35);
      this.scheduleCreak();
    } else {
      clearTimeout(this.creakTimer);
      this.masterGain.gain.setTargetAtTime(0.0, now, 0.03);
      this.ambientMaster.gain.setTargetAtTime(0.0, now, 0.04);
    }
  }

  playDoorEntry() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;

    // Heavy stone/timber door rumble
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = this.noiseBuf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(185, now);
    lp.frequency.exponentialRampToValueAtTime(52, now + 1.45);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.26, now + 0.12);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
    rumbleSrc.connect(lp);
    lp.connect(rumbleGain);
    rumbleGain.connect(this.sfxDry);
    rumbleGain.connect(this.sfxWet);
    rumbleSrc.start(now);
    rumbleSrc.stop(now + 1.6);

    // Cathedral bronze bell toll
    const partials = [
      [110, 0.14, 4.2],
      [220, 0.08, 3.0],
      [264, 0.06, 2.5],
      [327.8, 0.045, 2.0],
      [459.8, 0.025, 1.4],
    ];
    partials.forEach(([freq, amp, dur]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + 0.06);
      g.gain.linearRampToValueAtTime(amp, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08 + dur);
      o.connect(g);
      g.connect(this.sfxDry);
      g.connect(this.sfxWet);
      o.start(now + 0.06);
      o.stop(now + 0.12 + dur);
    });
  }

  playCrtPowerOn() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;

    // Degauss thump
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(72, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.22);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.14, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    thump.connect(thumpGain);
    thumpGain.connect(this.sfxDry);
    thump.start(now);
    thump.stop(now + 0.26);

    // Subtle CRT flyback whine
    const whine = ctx.createOscillator();
    whine.type = 'sine';
    whine.frequency.setValueAtTime(4800, now + 0.04);
    whine.frequency.exponentialRampToValueAtTime(7100, now + 0.55);
    const whineGain = ctx.createGain();
    whineGain.gain.setValueAtTime(0.0001, now + 0.04);
    whineGain.gain.linearRampToValueAtTime(0.012, now + 0.14);
    whineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    whine.connect(whineGain);
    whineGain.connect(this.sfxDry);
    whine.start(now + 0.04);
    whine.stop(now + 0.68);
  }

  playHoverTick() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.025);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1850;
    bp.Q.value = 2.0;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.015, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
    osc.connect(bp);
    bp.connect(g);
    g.connect(this.sfxDry);
    osc.start(now);
    osc.stop(now + 0.032);
  }

  playClickHit() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(84, now + 0.055);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    osc.connect(g);
    g.connect(this.sfxDry);
    g.connect(this.sfxWet);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  playSectionShift() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(310, now);
    bp.frequency.exponentialRampToValueAtTime(88, now + 0.38);
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.convolver);
    src.start(now, Math.random() * 2.0, 0.44);
  }

  playGlitchBurst() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(64, now + 0.03);
    osc.frequency.setValueAtTime(220, now + 0.055);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.045, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.sfxDry);
    g.connect(this.sfxWet);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  playLightboxTone(opening = true) {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(opening ? 240 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(opening ? 420 : 120, now + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.026, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(g);
    g.connect(this.sfxDry);
    g.connect(this.sfxWet);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // A guestbook candle catching: a soft match strike, then a low bell in the reverb.
  playCandleLit() {
    if (!this.enabled) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.4);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, now);
    bp.frequency.exponentialRampToValueAtTime(700, now + 0.3);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(this.sfxDry);
    noise.start(now);
    noise.stop(now + 0.4);

    [392, 587.3].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + 0.08);
      g.gain.exponentialRampToValueAtTime(i ? 0.012 : 0.03, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(g);
      g.connect(this.sfxWet);
      osc.start(now + 0.08);
      osc.stop(now + 2.3);
    });
  }
}
