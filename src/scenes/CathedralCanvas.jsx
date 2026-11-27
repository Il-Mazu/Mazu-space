import { useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_STOPS, CHAPELS } from '../data/chapels.js';
import { sampleAudio } from '../audio/AudioEngine.js';
import { sceneBus } from '../state/sceneBus.js';
import CameraRig from './CameraRig.jsx';
import CathedralLighting from './CathedralLighting.jsx';
import ChapelStage from './ChapelStage.jsx';
import GothicNave from './GothicNave.jsx';
import HangingChains from './HangingChains.jsx';
import NaveSmoke from './NaveSmoke.jsx';
import PostFX from './PostFX.jsx';
import HeroEye from '../sections/HeroEye.jsx';
import AboutChapel from '../sections/AboutChapel.jsx';
import LiveChapel from '../sections/LiveChapel.jsx';
import WorksChapel from '../sections/WorksChapel.jsx';
import DumpChapel from '../sections/DumpChapel.jsx';
import GamesChapel from '../sections/GamesChapel.jsx';
import ExitChapel from '../sections/ExitChapel.jsx';

function AudioSampler() {
  useFrame(() => {
    sampleAudio();
  });
  return null;
}

// Compiles every chapel's shaders and uploads its textures once, right after
// entering. Otherwise each chapel stalls the first frame it comes into view.
function Precompile() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      sceneBus.precompiling = true;
      scene.traverse((o) => {
        if (o.userData.chapelStage) o.visible = true;
      });
      const textures = new Set();
      scene.traverseVisible((o) => {
        [].concat(o.material || []).forEach((m) => {
          Object.values(m).forEach((v) => v?.isTexture && textures.add(v));
          Object.values(m.uniforms || {}).forEach((u) => u.value?.isTexture && textures.add(u.value));
        });
      });
      textures.forEach((t) => !t.isVideoTexture && t.image && gl.initTexture(t));
      // compileAsync never settles here (three r170 trips over a material
      // without a program), so take the one synchronous stall up front.
      gl.compile(scene, camera);
      if (!cancelled) sceneBus.precompiling = false;
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
      sceneBus.precompiling = false;
    };
  }, [gl, scene, camera]);
  return null;
}

function ChapelScene({ chapel, isMobile, lanyard, music, workIdx, onOpenWork, onOpenLightbox, onOpenCrypt }) {
  switch (chapel.id) {
    case 'works':
      return <WorksChapel chapel={chapel} isMobile={isMobile} selected={workIdx} onOpenWork={onOpenWork} />;
    case 'about':
      return <AboutChapel chapel={chapel} isMobile={isMobile} />;
    case 'live':
      return <LiveChapel chapel={chapel} isMobile={isMobile} lanyard={lanyard} music={music} />;
    case 'dump':
      return <DumpChapel chapel={chapel} isMobile={isMobile} onOpenLightbox={onOpenLightbox} />;
    case 'games':
      return <GamesChapel chapel={chapel} isMobile={isMobile} onOpenCrypt={onOpenCrypt} />;
    case 'exit':
      return <ExitChapel chapel={chapel} isMobile={isMobile} />;
    default:
      return null;
  }
}

export default function CathedralCanvas({
  isMobile,
  entered = true,
  lanyard = null,
  music,
  workIdx = null,
  onOpenWork,
  onOpenLightbox,
  onOpenCrypt,
  onContextLost,
}) {
  const [perfTier, setPerfTier] = useState(isMobile ? 'medium' : 'high');
  // Resolution follows the measured frame rate: down to 0.75x on weak GPUs
  // (the film grain hides the upscale), up to 1.5x on fast ones.
  const minDpr = 0.75;
  const maxDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  const [dpr, setDpr] = useState(Math.min(1, maxDpr));
  const eventSource = typeof document !== 'undefined' ? document.body : undefined;

  useEffect(() => {
    const next = isMobile ? 'medium' : 'high';
    setPerfTier(next);
    sceneBus.perfTier = next;
  }, [isMobile]);

  const downgrade = () => {
    setPerfTier((cur) => {
      const next = cur === 'high' ? 'medium' : 'low';
      sceneBus.perfTier = next;
      return next;
    });
  };

  return (
    <div id="canvas-root" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ position: CAMERA_STOPS[0].camPos, fov: isMobile ? 56 : 44, near: 0.1, far: 130 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
        eventSource={eventSource}
        eventPrefix="client"
      >
        <color attach="background" args={['#060607']} />
        <fogExp2 attach="fog" args={['#060607', 0.045]} />

        <PerformanceMonitor
          onChange={({ factor }) => setDpr(Math.round((minDpr + (maxDpr - minDpr) * factor) * 20) / 20)}
          onFallback={downgrade}
        />
        <AudioSampler />
        <CameraRig isMobile={isMobile} />
        <CathedralLighting isMobile={isMobile} />
        <GothicNave isMobile={isMobile} />
        <HangingChains isMobile={isMobile} />
        <NaveSmoke isMobile={isMobile} />

        <ChapelStage chapel={CHAPELS[0]}>
          <HeroEye position={[1.15, 1.65, -0.8]} scale={1} isMobile={isMobile} />
        </ChapelStage>
        {entered && <Precompile />}
        {entered && CHAPELS.slice(1).map((chapel) => (
          <ChapelStage key={chapel.id} chapel={chapel}>
            <ChapelScene
              chapel={chapel}
              isMobile={isMobile}
              lanyard={lanyard}
              music={music}
              workIdx={workIdx}
              onOpenWork={onOpenWork}
              onOpenLightbox={onOpenLightbox}
              onOpenCrypt={onOpenCrypt}
            />
          </ChapelStage>
        ))}

        <PostFX perfTier={perfTier} />
      </Canvas>
    </div>
  );
}
