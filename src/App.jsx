import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import projects from 'virtual:projects';
import { CAMERA_STOPS, CHAPELS, chapelById } from './data/chapels.js';
import { worksLayout } from './sections/worksLayout.js';
import useScreenMode from './hooks/useScreenMode.js';
import useLanyard from './hooks/useLanyard.js';
import useMusic from './music/useMusic.js';
import useGuestbook from './guestbook/useGuestbook.js';
import { isWebGLAvailable } from './utils/webgl.js';
import { playGlitchBurst } from './audio/AudioEngine.js';
import {
  sceneBus,
  setActiveSection,
  subscribeJump,
  subscribeSceneState,
  triggerGlitch,
  jumpToSection,
} from './state/sceneBus.js';
import UiFilmLayer from './ui/UiFilmLayer.jsx';
import HudMinimal from './ui/HudMinimal.jsx';
import CursorTrail from './hud/CursorTrail.jsx';
import DoorsOnboarding from './sections/DoorsOnboarding.jsx';
import HeroOverlay from './sections/HeroOverlay.jsx';
import AboutOverlay from './sections/AboutOverlay.jsx';
import LiveOverlay from './sections/LiveOverlay.jsx';
import WorksOverlay from './sections/WorksOverlay.jsx';
import WorksDetail from './sections/WorksDetail.jsx';
import GuestbookOverlay from './sections/GuestbookOverlay.jsx';
import DumpOverlay from './sections/DumpOverlay.jsx';
import DumpLightbox from './sections/DumpLightbox.jsx';
import GamesCryptOverlay, { GamesCryptModal } from './sections/GamesCryptOverlay.jsx';
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
  const music = useMusic(lanyard);
  const guestbook = useGuestbook();
  const progressBarRef = useRef(null);
  const lenisRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeStop, setActiveStop] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [cryptOpen, setCryptOpen] = useState(false);
  const [workIdx, setWorkIdx] = useState(null);
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
        for (let i = 0; i < CHAPELS.length; i++) {
          const el = document.getElementById(`chapel-${CHAPELS[i].id}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const d = Math.abs(rect.top + rect.height * 0.35 - midY);
          if (d < bestDist) {
            bestDist = d;
            nearest = i;
          }
        }
      } else {
        let nearestStop = 0;
        for (let i = 0; i < CAMERA_STOPS.length; i++) {
          const d = Math.abs(progress - CAMERA_STOPS[i].scrollPos);
          if (d < bestDist) {
            bestDist = d;
            nearestStop = i;
          }
        }
        nearest = CAMERA_STOPS[nearestStop].chapel;
        setActiveStop(nearestStop);
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

    // target: chapel index, chapel id, or { id, beat } for a later camera stop
    const unsubJump = subscribeJump((target) => {
      const id = typeof target === 'object' ? target.id : target;
      const idx = typeof id === 'number' ? id : CHAPELS.findIndex((s) => s.id === id);
      const sec = CHAPELS[Math.max(0, Math.min(CHAPELS.length - 1, idx))];
      const beat = sec.beats[typeof target === 'object' ? target.beat : 0] || sec.beats[0];

      if (!webglOk) {
        const el = document.getElementById(`chapel-${sec.id}`);
        el?.scrollIntoView({ behavior: sceneBus.reducedMotion ? 'auto' : 'smooth' });
        setActiveSection(idx);
        setActiveIdx(idx);
        return;
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const targetY = beat.scrollPos * maxScroll;

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

  const openCrypt = useCallback(() => setCryptOpen(true), []);
  const closeCrypt = useCallback(() => setCryptOpen(false), []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (lightboxIdx !== null || cryptOpen || workIdx !== null) lenisRef.current.stop();
    else lenisRef.current.start();
  }, [lightboxIdx, cryptOpen, workIdx]);

  const worksSlots = useMemo(() => worksLayout(chapelById('works'), projects.length, isMobile), [isMobile]);

  const openWork = useCallback((i) => {
    jumpToSection('works');
    setWorkIdx(i);
  }, []);
  const closeWork = useCallback(() => setWorkIdx(null), []);

  // Glide the camera to the open niche, back to the scroll path when closed.
  useEffect(() => {
    const slot = workIdx !== null ? worksSlots[workIdx] : null;
    sceneBus.focus = slot ? { pos: slot.camPos, look: slot.camLook } : null;
  }, [workIdx, worksSlots]);

  const renderSectionContent = (sec) => {
    switch (sec.id) {
      case 'hero':
        return <HeroOverlay ogMode={ogMode} />;
      case 'about':
        return <AboutOverlay beat={CAMERA_STOPS[activeStop].chapel === sec.index ? CAMERA_STOPS[activeStop].beat : 0} />;
      case 'works':
        return <WorksOverlay onOpenWork={openWork} />;
      case 'live':
        return <LiveOverlay lanyard={lanyard} music={music} compact={isMobile} />;
      case 'dump':
        return <DumpOverlay onOpenLightbox={setLightboxIdx} />;
      case 'games':
        return <GamesCryptOverlay onOpen={openCrypt} />;
      case 'exit': {
        const beat = CAMERA_STOPS[activeStop].chapel === sec.index ? CAMERA_STOPS[activeStop].beat : 0;
        return (
          <>
            <GuestbookOverlay guestbook={guestbook} shown={beat === 0} />
            <ExitOverlay shown={beat === 1} />
          </>
        );
      }
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
            music={music}
            guestbook={guestbook}
            workIdx={workIdx}
            onOpenWork={openWork}
            onOpenLightbox={setLightboxIdx}
            onOpenCrypt={openCrypt}
            onContextLost={() => setWebglOk(false)}
          />
        </Suspense>
      )}
      <UiFilmLayer />
      <CursorTrail />

      {!entered && <DoorsOnboarding onEnterComplete={() => setEntered(true)} />}

      {entered && !ogMode && <HudMinimal onProgressRef={setProgressEl} music={music} />}

      <DumpLightbox
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />

      <GamesCryptModal open={cryptOpen} onClose={closeCrypt} />

      <WorksDetail
        index={workIdx}
        side={workIdx !== null ? worksSlots[workIdx].side : -1}
        onClose={closeWork}
        onChange={setWorkIdx}
      />

      {!webglOk ? (
        entered ? (
          <Suspense fallback={null}>
            <Fallback2D
              lanyard={lanyard}
              music={music}
              guestbook={guestbook}
              onOpenLightbox={setLightboxIdx}
              onOpenCrypt={openCrypt}
              onOpenWork={openWork}
            />
          </Suspense>
        ) : null
      ) : (
        <main id="main-content" className="scroll-stage" aria-hidden={!entered}>
          {CHAPELS.map((sec, idx) => {
            const overlayBlocking = cryptOpen || lightboxIdx !== null || workIdx !== null;
            const isActive = entered && activeIdx === idx && !overlayBlocking;
            return (
              <section
                key={sec.id}
                id={`chapel-${sec.id}`}
                className="chapel-anchor"
                style={{ height: `${120 * sec.beats.length}vh` }}
                aria-label={`${sec.roman}. ${sec.name}`}
                onFocus={() => {
                  if (sceneBus.activeSection !== idx) jumpToSection(idx);
                }}
              >
                <div
                  className={`chapel-sticky chapel-sticky--${CAMERA_STOPS[activeStop].chapel === idx ? CAMERA_STOPS[activeStop].side : sec.side}${isActive ? '' : ' chapel-sticky--inactive'}`}
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
