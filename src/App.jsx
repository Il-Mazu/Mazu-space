import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SECTIONS } from './data/content.js';
import useScreenMode from './hooks/useScreenMode.js';
import useLanyard from './hooks/useLanyard.js';
import {
  sceneBus,
  setActiveSection,
  subscribeJump,
  subscribeSceneState,
  triggerGlitch,
} from './state/sceneBus.js';
import Hud from './hud/Hud.jsx';
import CursorTrail from './hud/CursorTrail.jsx';
import Preloader from './sections/Preloader.jsx';
import HeroOverlay from './sections/HeroOverlay.jsx';
import AboutOverlay from './sections/AboutOverlay.jsx';
import PresenceOverlay from './sections/PresenceOverlay.jsx';
import MusicOverlay from './sections/MusicOverlay.jsx';
import DumpOverlay from './sections/DumpOverlay.jsx';
import DumpLightbox from './sections/DumpLightbox.jsx';
import GamesCryptOverlay from './sections/GamesCryptOverlay.jsx';
import ExitOverlay from './sections/ExitOverlay.jsx';

const CathedralCanvas = lazy(() => import('./scenes/CathedralCanvas.jsx'));

gsap.registerPlugin(ScrollTrigger);

function initialBootDone() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('skipBoot') === '1';
}

export default function App() {
  const mode = useScreenMode();
  const isMobile = mode === 'mobile';
  const lanyard = useLanyard();
  const progressBarRef = useRef(null);
  const lenisRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [entered, setEntered] = useState(() => {
    const skip = initialBootDone();
    if (skip) {
      sceneBus.bootPhase = 'done';
      sceneBus.entered = true;
    }
    return skip;
  });

  const setProgressEl = useCallback((el) => {
    progressBarRef.current = el;
  }, []);

  useEffect(() => {
    return subscribeSceneState(() => {
      if (sceneBus.entered) setEntered(true);
    });
  }, []);

  useEffect(() => {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReduced = () => {
      sceneBus.reducedMotion = reducedQuery.matches;
    };
    syncReduced();
    reducedQuery.addEventListener('change', syncReduced);

    let lenis = null;
    if (!sceneBus.reducedMotion) {
      lenis = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);
    }

    const tick = (time) => {
      if (lenis) lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const updateProgress = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      sceneBus.scrollProgress = progress;

      // Closing spectral Eye over "Never fade away" at scroll end (0.94 -> 0.995)
      const closeT = Math.max(0, Math.min(1, (progress - 0.94) / 0.055));
      sceneBus.eyeClose = closeT * closeT * (3 - 2 * closeT);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }

      let nearest = 0;
      let bestDist = Infinity;
      for (let i = 0; i < SECTIONS.length; i++) {
        const d = Math.abs(progress - SECTIONS[i].scrollPos);
        if (d < bestDist) {
          bestDist = d;
          nearest = i;
        }
      }
      if (nearest !== sceneBus.activeSection) {
        setActiveSection(nearest);
        setActiveIdx(nearest);
      }
    };

    const st = ScrollTrigger.create({
      trigger: '.scroll-stage',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: updateProgress,
    });

    const onNativeScroll = () => updateProgress();
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    updateProgress();

    const unsubJump = subscribeJump((idOrIdx) => {
      const idx =
        typeof idOrIdx === 'number'
          ? idOrIdx
          : SECTIONS.findIndex((s) => s.id === idOrIdx);
      const sec = SECTIONS[Math.max(0, Math.min(SECTIONS.length - 1, idx))];
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const targetY = sec.scrollPos * maxScroll;

      if (Math.abs(idx - sceneBus.activeSection) > 1) {
        triggerGlitch(0.75);
      }

      if (sceneBus.reducedMotion || !lenisRef.current) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
      } else {
        lenisRef.current.scrollTo(targetY, { duration: 1.3 });
      }
    });

    return () => {
      unsubJump();
      window.removeEventListener('scroll', onNativeScroll);
      st.kill();
      gsap.ticker.remove(tick);
      if (lenis) lenis.destroy();
      lenisRef.current = null;
      reducedQuery.removeEventListener('change', syncReduced);
    };
  }, []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (lightboxIdx !== null) lenisRef.current.stop();
    else lenisRef.current.start();
  }, [lightboxIdx]);

  const renderSectionContent = (sec, idx) => {
    switch (sec.id) {
      case 'hero':
        return <HeroOverlay />;
      case 'about':
        return <AboutOverlay />;
      case 'presence':
        return <PresenceOverlay lanyard={lanyard} />;
      case 'music':
        return <MusicOverlay lanyard={lanyard} />;
      case 'dump':
        return <DumpOverlay onOpenLightbox={setLightboxIdx} />;
      case 'games':
        return <GamesCryptOverlay />;
      case 'exit':
        return <ExitOverlay />;
      default:
        return (
          <div className="chapel-card torn-paper" style={{ padding: '22px 24px' }}>
            <div className="chapel-tag">
              <span className="chapel-tag-cross" aria-hidden="true">♰</span>
              <span>{sec.label}</span>
            </div>
            <h2 className="chapel-title">{sec.name}</h2>
            <p className="chapel-copy c-dim">Chapel {sec.roman} // z={sec.z}</p>
          </div>
        );
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Suspense fallback={null}>
        <CathedralCanvas isMobile={isMobile} onOpenLightbox={setLightboxIdx} />
      </Suspense>
      <CursorTrail />

      {!entered && <Preloader onEnterComplete={() => setEntered(true)} />}

      {entered && <Hud onProgressRef={setProgressEl} />}

      <DumpLightbox
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />

      <main id="main-content" className="scroll-stage" aria-hidden={!entered}>
        {SECTIONS.map((sec, idx) => {
          const stickyMod =
            sec.id === 'presence' || sec.id === 'dump' ? ' chapel-sticky--right'
              : sec.id === 'exit' ? ' chapel-sticky--exit'
                : '';
          return (
            <section
              key={sec.id}
              id={`chapel-${sec.id}`}
              className="chapel-anchor"
              aria-label={`${sec.roman}. ${sec.name}`}
            >
              <div
                className={`chapel-sticky${stickyMod}`}
                style={{ opacity: entered && activeIdx === idx ? 1 : 0 }}
              >
                {renderSectionContent(sec, idx)}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
