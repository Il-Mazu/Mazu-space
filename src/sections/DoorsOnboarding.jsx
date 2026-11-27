import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playClickHit, playCrtPowerOn, playDoorEntry, unlockAudio } from '../audio/AudioEngine.js';
import { emitSceneState, sceneBus } from '../state/sceneBus.js';
import './DoorsOnboarding.css';

function readPrefs() {
  try {
    return {
      returning: localStorage.getItem('mazu_v3_visited') === '1',
      preferSound: localStorage.getItem('mazu_v3_sound') !== '0',
    };
  } catch {
    return { returning: false, preferSound: true };
  }
}

function savePrefs(soundOn) {
  try {
    localStorage.setItem('mazu_v3_visited', '1');
    localStorage.setItem('mazu_v3_sound', soundOn ? '1' : '0');
  } catch {
    // Ignore storage errors in private contexts.
  }
}

// One door leaf: planks, two carved recessed panels, three iron strap hinges
// running from the hinge side, a ring knocker near the seam, and the red rim
// light along the inner edge. Built from boxes so nothing stretches with the
// viewport.
function DoorLeaf({ side, leafRef }) {
  return (
    <div ref={leafRef} className={`doors-leaf doors-leaf--${side}`} aria-hidden="true">
      <div className="door-arch">
        <div className="door-panel door-panel--arch" />
      </div>
      <div className="door-panel door-panel--low" />
      <div className="door-strap" style={{ top: '17%' }} />
      <div className="door-strap" style={{ top: '49%' }} />
      <div className="door-strap" style={{ top: '81%' }} />
      <div className="door-knocker" />
      <div className="door-rim" />
    </div>
  );
}

export default function DoorsOnboarding({ onEnterComplete }) {
  const [prefs] = useState(() => readPrefs());
  const [pct, setPct] = useState(12);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState('closed'); // 'closed' | 'opening' | 'fading'
  const screenRef = useRef(null);
  const leftDoorRef = useRef(null);
  const rightDoorRef = useRef(null);
  const seamRef = useRef(null);
  const dustRef = useRef(null);
  const pctRef = useRef(12);
  const enteredRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    pctRef.current = pct;
  }, [pct]);

  // Real asset progress + fonts + smooth floor fallback
  useEffect(() => {
    let active = true;
    let targetPct = 32;

    const mgr = THREE.DefaultLoadingManager;
    const prevProgress = mgr.onProgress;
    const prevLoad = mgr.onLoad;

    mgr.onProgress = (url, loaded, total) => {
      if (total > 0) targetPct = Math.max(targetPct, Math.round((loaded / total) * 86));
      if (prevProgress) prevProgress(url, loaded, total);
    };

    mgr.onLoad = () => {
      targetPct = 100;
      if (prevLoad) prevLoad();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        targetPct = Math.max(targetPct, 82);
      });
    }

    const rampMs = prefs.returning ? 240 : 540;
    const startTime = performance.now();
    const timer = setInterval(() => {
      if (!active) return;
      const elapsed = performance.now() - startTime;
      const floorPct = Math.min(100, Math.round((elapsed / rampMs) * 100));
      const next = Math.min(100, Math.max(targetPct, floorPct));
      setPct(next);
      sceneBus.bootProgress = next / 100;
      if (next >= 100) {
        setReady(true);
        clearInterval(timer);
      }
    }, 40);

    return () => {
      active = false;
      clearInterval(timer);
      mgr.onProgress = prevProgress;
      mgr.onLoad = prevLoad;
    };
  }, [prefs.returning]);

  // Lightweight dust motes drifting inside the center red slit light
  useEffect(() => {
    const canvas = dustRef.current;
    if (!canvas || sceneBus.reducedMotion) return undefined;
    const ctx = canvas.getContext('2d');
    const motes = Array.from({ length: 38 }, () => ({
      x: (Math.random() - 0.5) * 44,
      y: Math.random(),
      vy: 0.00018 + Math.random() * 0.00038,
      vx: (Math.random() - 0.5) * 0.14,
      r: 0.7 + Math.random() * 1.6,
      red: Math.random() > 0.35,
      a: 0.18 + Math.random() * 0.55,
    }));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const loadScale = 0.25 + (pctRef.current / 100) * 0.75;
      const cx = w * 0.5;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.vy;
        m.x += m.vx + Math.sin(m.y * 14 + i) * 0.08;
        if (m.y < -0.02) {
          m.y = 1.02;
          m.x = (Math.random() - 0.5) * 44;
        }
        const px = cx + m.x * (0.4 + loadScale * 0.9);
        const py = m.y * h;
        ctx.fillStyle = m.red
          ? `rgba(255, 51, 82, ${(m.a * loadScale).toFixed(2)})`
          : `rgba(239, 231, 220, ${(m.a * 0.55 * loadScale).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const enter = (soundOn, instant = false) => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    savePrefs(soundOn);
    unlockAudio(soundOn);

    if (instant || sceneBus.reducedMotion) {
      if (soundOn) playClickHit();
      sceneBus.doorPush = 1;
      sceneBus.eyePower = 1;
      sceneBus.bootPhase = 'done';
      sceneBus.entered = true;
      emitSceneState();
      setPhase('fading');
      setTimeout(() => {
        onEnterComplete();
      }, sceneBus.reducedMotion ? 260 : 80);
      return;
    }

    if (soundOn) playDoorEntry();
    setPhase('opening');
    sceneBus.bootPhase = 'opening';
    emitSceneState();

    let lastNow = performance.now();
    let elapsed = 0;
    const totalDur = prefs.returning ? 1050 : 1900;
    const doorDur = prefs.returning ? 520 : 980;
    const crtAt = prefs.returning ? 340 : 780;
    const eyeDur = prefs.returning ? 540 : 840;
    const startAngle = prefs.returning ? 7 : 0;
    let crtFired = false;

    const tick = (now) => {
      // A long frame (shader compile, GC) should slow the swing, not skip it.
      const dt = Math.min(Math.max(0, now - lastNow), 50);
      lastNow = now;
      elapsed += dt;

      const tNorm = Math.min(1, elapsed / totalDur);
      sceneBus.doorPush = Math.min(1, elapsed / (totalDur * 0.9));

      const doorT = Math.min(1, elapsed / doorDur);
      const doorEase = 1 - Math.pow(1 - doorT, 3);
      const angle = startAngle + (88 - startAngle) * doorEase;
      if (leftDoorRef.current) leftDoorRef.current.style.transform = `rotateY(${(-angle).toFixed(2)}deg)`;
      if (rightDoorRef.current) rightDoorRef.current.style.transform = `rotateY(${angle.toFixed(2)}deg)`;
      if (seamRef.current) seamRef.current.style.opacity = String(Math.max(0, 1 - doorEase * 1.4).toFixed(3));

      if (!crtFired && elapsed >= crtAt) {
        crtFired = true;
        sceneBus.bootPhase = 'eye-on';
        setPhase('fading');
        if (soundOn) playCrtPowerOn();
        emitSceneState();
      }

      if (elapsed >= crtAt) {
        sceneBus.eyePower = Math.min(1, (elapsed - crtAt) / eyeDur);
        const fadeT = Math.min(1, (elapsed - crtAt) / 360);
        if (screenRef.current) screenRef.current.style.opacity = String((1 - fadeT).toFixed(3));
      }

      if (tNorm < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        sceneBus.doorPush = 1;
        sceneBus.eyePower = 1;
        sceneBus.bootPhase = 'done';
        sceneBus.entered = true;
        emitSceneState();
        onEnterComplete();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const soundBtnRef = useRef(null);
  const silenceBtnRef = useRef(null);

  // autoFocus only applies on mount, and the buttons mount disabled.
  useEffect(() => {
    if (!ready) return;
    const preferSilence = prefs.returning && !prefs.preferSound;
    (preferSilence ? silenceBtnRef : soundBtnRef).current?.focus({ preventScroll: true });
  }, [ready, prefs.returning, prefs.preferSound]);

  useEffect(() => {
    const onKey = (e) => {
      if (!ready || enteredRef.current) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        enter(prefs.preferSound, false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, prefs.preferSound]);

  const slitWidth = phase === 'closed' ? 1 + (pct / 100) * 11 : 18;

  return (
    <main
      id="boot"
      ref={screenRef}
      className={[
        'doors-screen',
        prefs.returning ? 'doors-screen--returning' : '',
        ready ? 'is-ready' : '',
        phase === 'opening' ? 'is-opening' : '',
        phase === 'fading' ? 'is-opening is-fading' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--slit-w': `${slitWidth.toFixed(1)}px`, '--load-frac': (pct / 100).toFixed(3) }}
      aria-label="Cathedral threshold doors"
    >
      <div className="doors-floor-leak" aria-hidden="true" />
      <div ref={seamRef} className="doors-seam-glow" aria-hidden="true" />

      <DoorLeaf side="left" leafRef={leftDoorRef} />
      <DoorLeaf side="right" leafRef={rightDoorRef} />

      <canvas ref={dustRef} className="doors-dust" aria-hidden="true" />

      <div className="doors-hud-low">
        <div
          className={`doors-pct ${ready ? 'is-hidden' : ''}`}
          role="progressbar"
          aria-label="Loading cathedral assets"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          {pct}%
        </div>

        <div className={`doors-choices ${ready ? 'is-visible' : ''}`}>
          <button
            type="button"
            className={`ink-trigger doors-choice ${prefs.returning && !prefs.preferSound ? 'is-secondary' : ''}`}
            ref={soundBtnRef}
            disabled={!ready}
            onClick={() => enter(true, false)}
          >
            <span className="ink-cross" aria-hidden="true">♰</span>
            <span>enter with sound</span>
          </button>

          <button
            type="button"
            className={`ink-trigger doors-choice ${!prefs.returning || prefs.preferSound ? 'is-secondary' : ''}`}
            ref={silenceBtnRef}
            disabled={!ready}
            onClick={() => enter(false, false)}
          >
            <span>enter in silence</span>
          </button>
        </div>

        <button
          type="button"
          className="boot-skip doors-skip"
          onClick={() => enter(false, true)}
        >
          skip
        </button>
      </div>
    </main>
  );
}
