import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SECTIONS } from './data/content.js';
import useScreenMode from './hooks/useScreenMode.js';
import useLanyard from './hooks/useLanyard.js';
import { isWebGLAvailable } from './utils/webgl.js';
import { playGlitchBurst } from './audio/AudioEngine.js';
import {
  sceneBus,
  setActiveSection,
  subscribeJump,
  subscribeSceneState,
  triggerGlitch,
} from './state/sceneBus.js';
import UiFilmLayer from './ui/UiFilmLayer.jsx';
import HudMinimal from './ui/HudMinimal.jsx';
import CursorTrail from './hud/CursorTrail.jsx';
import DoorsOnboarding from './sections/DoorsOnboarding.jsx';
import HeroOverlay from './sections/HeroOverlay.jsx';
import AboutOverlay from './sections/AboutOverlay.jsx';
import PresenceOverlay from './sections/PresenceOverlay.jsx';
import MusicOverlay from './sections/MusicOverlay.jsx';
import DumpOverlay from './sections/DumpOverlay.jsx';
import DumpLightbox from './sections/DumpLightbox.jsx';
import GamesCryptOverlay, { GamesCryptModal } from './sections/GamesCryptOverlay.jsx';
import TerminalOverlay from './sections/TerminalOverlay.jsx';
import ExitOverlay from './sections/ExitOverlay.jsx';

const CathedralCanvas = lazy(() => import('./scenes/CathedralCanvas.jsx'));
const Fallback2D = lazy(() => import('./fallback/Fallback2D.jsx'));

if (typeof window !== 'undefined') {
  sceneBus.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

gsap.registerPlugin(ScrollTrigger);

function initialFlags() {
  if (typeof window === 'undefined') return { skip: false, og: false };
  const params = new URLSearchParams(window.location.search);
  const og = params.get('og') === '1';
  return { skip: og || params.get('skipBoot') === '1', og };
}

export default function App() {
  const mode = useScreenMode();
  const isMobile = mode === 'mobile';
  const lanyard = useLanyard();
  const progressBarRef = useRef(null);
  const lenisRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [cryptOpen, setCryptOpen] = useState(false);
  const [webglOk, setWebglOk] = useState(() => isWebGLAvailable());
  const [{ og: ogMode }] = useState(() => initialFlags());
  const [entered, setEntered] = useState(() => {
    const { skip } = initialFlags();
    if (skip) {
      sceneBus.bootPhase = 'done';
      sceneBus.doorPush = 1;
      sceneBus.eyePower = 1;
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
      if (!webglOk) {
        const midY = window.innerHeight * 0.45;
        for (let i = 0; i < SECTIONS.length; i++) {
          const el = document.getElementById(`chapel-${SECTIONS[i].id}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const d = Math.abs(rect.top + rect.height * 0.35 - midY);
          if (d < bestDist) {
            bestDist = d;
            nearest = i;
          }
        }
      } else {
        for (let i = 0; i < SECTIONS.length; i++) {
          const d = Math.abs(progress - SECTIONS[i].scrollPos);
          if (d < bestDist) {
            bestDist = d;
            nearest = i;
          }
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

      if (!webglOk) {
        const el = document.getElementById(`chapel-${sec.id}`);
        el?.scrollIntoView({ behavior: sceneBus.reducedMotion ? 'auto' : 'smooth' });
        setActiveSection(idx);
        setActiveIdx(idx);
        return;
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const targetY = sec.scrollPos * maxScroll;

      if (Math.abs(idx - sceneBus.activeSection) > 1) {
        triggerGlitch(0.75);
        playGlitchBurst();
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
  }, [webglOk]);

  const openTerminal = useCallback(() => {
    sceneBus.terminalOpen = true;
    setTerminalOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    sceneBus.terminalOpen = false;
    setTerminalOpen(false);
  }, []);

  const openCrypt = useCallback(() => setCryptOpen(true), []);
  const closeCrypt = useCallback(() => setCryptOpen(false), []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (lightboxIdx !== null || terminalOpen || cryptOpen) lenisRef.current.stop();
    else lenisRef.current.start();
  }, [lightboxIdx, terminalOpen, cryptOpen]);

  const renderSectionContent = (sec) => {
    switch (sec.id) {
      case 'hero':
        return <HeroOverlay ogMode={ogMode} isMobile={isMobile} />;
      case 'about':
        return <AboutOverlay isMobile={isMobile} />;
      case 'presence':
        return <PresenceOverlay lanyard={lanyard} />;
      case 'music':
        return <MusicOverlay lanyard={lanyard} />;
      case 'dump':
        return <DumpOverlay isMobile={isMobile} onOpenLightbox={setLightboxIdx} />;
      case 'games':
        return <GamesCryptOverlay isMobile={isMobile} onOpen={openCrypt} />;
      case 'terminal':
        return (
          <TerminalOverlay
            open={false}
            isMobile={isMobile}
            onOpen={openTerminal}
            onClose={closeTerminal}
          />
        );
      case 'exit':
        return <ExitOverlay />;
      default:
        return null;
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {webglOk && (
        <Suspense fallback={null}>
          <CathedralCanvas
            isMobile={isMobile}
            entered={entered}
            lanyard={lanyard}
            cryptOpen={cryptOpen}
            terminalOpen={terminalOpen}
            lightboxOpen={lightboxIdx !== null}
            onOpenLightbox={setLightboxIdx}
            onOpenTerminal={openTerminal}
            onOpenCrypt={openCrypt}
            onContextLost={() => setWebglOk(false)}
          />
        </Suspense>
      )}
      <UiFilmLayer />
      <CursorTrail />

      {!entered && <DoorsOnboarding onEnterComplete={() => setEntered(true)} />}

      {entered && !ogMode && <HudMinimal onProgressRef={setProgressEl} />}

      <DumpLightbox
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />

      <GamesCryptModal open={cryptOpen} onClose={closeCrypt} />

      {terminalOpen && (
        <TerminalOverlay
          open
          isMobile={isMobile}
          onOpen={openTerminal}
          onClose={closeTerminal}
        />
      )}

      {!webglOk ? (
        entered ? (
          <Suspense fallback={null}>
            <Fallback2D
              lanyard={lanyard}
              onOpenLightbox={setLightboxIdx}
              onOpenTerminal={openTerminal}
            />
          </Suspense>
        ) : null
      ) : (
        <main id="main-content" className="scroll-stage" aria-hidden={!entered}>
          {SECTIONS.map((sec, idx) => {
            const stickyMod =
              sec.id === 'dump' || sec.id === 'terminal' ? ' chapel-sticky--right'
                : sec.id === 'presence' ? ' chapel-sticky--top-left'
                  : sec.id === 'exit' ? ' chapel-sticky--exit'
                    : '';
            const overlayBlocking = cryptOpen || terminalOpen || lightboxIdx !== null;
            const isActive = entered && activeIdx === idx && !overlayBlocking;
            return (
              <section
                key={sec.id}
                id={`chapel-${sec.id}`}
                className="chapel-anchor"
                aria-label={`${sec.roman}. ${sec.name}`}
              >
                <div
                  className={`chapel-sticky${stickyMod}${isActive ? '' : ' chapel-sticky--inactive'}`}
                >
                  {renderSectionContent(sec)}
                </div>
              </section>
            );
          })}
        </main>
      )}
    </>
  );
}
