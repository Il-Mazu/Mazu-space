import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BOOT_LOGO } from '../data/ascii.js';
import { BOOT_LINES, SITE } from '../data/content.js';
import { playBootSound, unlockAudio } from '../audio/AudioEngine.js';
import { emitSceneState, sceneBus } from '../state/sceneBus.js';
import './Preloader.css';

export default function Preloader({ onEnterComplete }) {
  const [pct, setPct] = useState(15);
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const enteredRef = useRef(false);

  useEffect(() => {
    let active = true;
    let targetPct = 35;

    const mgr = THREE.DefaultLoadingManager;
    const prevProgress = mgr.onProgress;
    const prevLoad = mgr.onLoad;

    mgr.onProgress = (url, loaded, total) => {
      if (total > 0) targetPct = Math.max(targetPct, Math.round((loaded / total) * 85));
      if (prevProgress) prevProgress(url, loaded, total);
    };

    mgr.onLoad = () => {
      targetPct = 100;
      if (prevLoad) prevLoad();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        targetPct = Math.max(targetPct, 80);
      });
    }

    const startTime = performance.now();
    const timer = setInterval(() => {
      if (!active) return;
      const elapsed = performance.now() - startTime;
      const floorPct = Math.min(100, Math.round((elapsed / 550) * 100));
      const next = Math.min(100, Math.max(targetPct, floorPct));
      setPct(next);
      if (next >= 100) {
        setReady(true);
        clearInterval(timer);
      }
    }, 45);

    return () => {
      active = false;
      clearInterval(timer);
      mgr.onProgress = prevProgress;
      mgr.onLoad = prevLoad;
    };
  }, []);

  const enter = (soundOn, skipShatter = false) => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    unlockAudio(soundOn);
    if (soundOn) playBootSound();

    if (skipShatter || sceneBus.reducedMotion) {
      sceneBus.bootPhase = 'done';
      sceneBus.entered = true;
      emitSceneState();
      onEnterComplete();
      return;
    }

    setFading(true);
    sceneBus.bootPhase = 'shattering';
    emitSceneState();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!ready || enteredRef.current) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        enter(true, false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready]);

  return (
    <main id="boot" className={`boot-screen ${fading ? 'fading' : ''}`} aria-label="System boot preloader">
      <div className="boot-frame">
        <div className="boot-header-bar">
          <span><span className="c-red" aria-hidden="true">♰</span> {SITE.title.toUpperCase()} // v{SITE.version}</span>
          <span>INIT RELIQUARY</span>
        </div>

        <pre className="boot-logo" aria-label="MAZU-SPACE ASCII boot logo">{BOOT_LOGO}</pre>

        <div className="boot-lines" aria-live="polite">
          {BOOT_LINES.map((line, idx) => (
            <div
              key={line}
              className="boot-line"
              style={{ animationDelay: `${idx * 110}ms` }}
            >
              {line}
            </div>
          ))}
        </div>

        <div
          className="boot-progress-row"
          role="progressbar"
          aria-label="Loading cathedral assets"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="boot-progress-track">
            <div className="boot-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="boot-pct">{pct}%</span>
        </div>

        <div className="boot-actions">
          <div className="boot-enter-group">
            <button
              type="button"
              className="boot-btn xerox-hover"
              autoFocus
              disabled={!ready}
              onClick={() => enter(true, false)}
            >
              <span className="c-red" aria-hidden="true">♰</span>
              <span>{ready ? 'ENTER // SOUND ON' : 'LOADING...'}</span>
            </button>
            <button
              type="button"
              className="boot-btn muted xerox-hover"
              disabled={!ready}
              onClick={() => enter(false, false)}
            >
              <span>ENTER // MUTED</span>
            </button>
          </div>

          <button
            type="button"
            className="boot-skip"
            onClick={() => enter(false, true)}
          >
            SKIP &gt;&gt;
          </button>
        </div>
      </div>
    </main>
  );
}
