import { useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
import DumpChapel from '../sections/DumpChapel.jsx';
import GamesChapel from '../sections/GamesChapel.jsx';
import ExitChapel from '../sections/ExitChapel.jsx';

function AudioSampler() {
  useFrame(() => {
    sampleAudio();
  });
  return null;
}

function ChapelScene({ chapel, isMobile, lanyard, music, onOpenLightbox, onOpenCrypt }) {
  switch (chapel.id) {
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
  onOpenLightbox,
  onOpenCrypt,
  onContextLost,
}) {
  const [perfTier, setPerfTier] = useState(isMobile ? 'medium' : 'high');
  const maxDpr = isMobile ? 1.5 : 2;
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
        dpr={[1, perfTier === 'low' ? 1 : maxDpr]}
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

        <PerformanceMonitor onDecline={downgrade} />
        <AudioSampler />
        <CameraRig isMobile={isMobile} />
        <CathedralLighting isMobile={isMobile} />
        <GothicNave isMobile={isMobile} />
        <HangingChains isMobile={isMobile} />
        <NaveSmoke isMobile={isMobile} />

        <ChapelStage chapel={CHAPELS[0]}>
          <HeroEye position={[1.15, 1.65, -0.8]} scale={1} isMobile={isMobile} />
        </ChapelStage>
        {entered && CHAPELS.slice(1).map((chapel) => (
          <ChapelStage key={chapel.id} chapel={chapel}>
            <ChapelScene
              chapel={chapel}
              isMobile={isMobile}
              lanyard={lanyard}
              music={music}
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
