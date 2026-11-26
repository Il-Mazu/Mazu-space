import { useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { SECTIONS } from '../data/content.js';
import { sampleAudio } from '../audio/AudioEngine.js';
import { sceneBus } from '../state/sceneBus.js';
import CameraRig from './CameraRig.jsx';
import CathedralLighting from './CathedralLighting.jsx';
import GothicNave from './GothicNave.jsx';
import HangingChains from './HangingChains.jsx';
import NaveSmoke from './NaveSmoke.jsx';
import MazuEmblem3D from './MazuEmblem3D.jsx';
import PostFX from './PostFX.jsx';
import HeroEye from '../sections/HeroEye.jsx';
import AboutChapel from '../sections/AboutChapel.jsx';
import PresenceChapel from '../sections/PresenceChapel.jsx';
import MusicChapel from '../sections/MusicChapel.jsx';
import DumpChapel from '../sections/DumpChapel.jsx';
import GamesChapel from '../sections/GamesChapel.jsx';
import TerminalChapel from '../sections/TerminalChapel.jsx';
import ExitChapel from '../sections/ExitChapel.jsx';

function AudioSampler() {
  useFrame(() => {
    sampleAudio();
  });
  return null;
}

export default function CathedralCanvas({ isMobile, entered = true, onOpenLightbox, onOpenTerminal, onContextLost }) {
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
        camera={{ position: SECTIONS[0].camPos, fov: isMobile ? 56 : 44, near: 0.1, far: 130 }}
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
        <fogExp2 attach="fog" args={['#060607', 0.036]} />

        <PerformanceMonitor onDecline={downgrade} />
        <AudioSampler />
        <CameraRig isMobile={isMobile} />
        <CathedralLighting isMobile={isMobile} />
        <GothicNave isMobile={isMobile} />
        <HangingChains isMobile={isMobile} />
        <NaveSmoke isMobile={isMobile} />

        <MazuEmblem3D isMobile={isMobile} />
        <HeroEye position={[1.15, 1.65, -0.8]} scale={1} isMobile={isMobile} />
        {entered && (
          <>
            <AboutChapel isMobile={isMobile} />
            <PresenceChapel isMobile={isMobile} />
            <MusicChapel isMobile={isMobile} />
            <DumpChapel isMobile={isMobile} onOpenLightbox={onOpenLightbox} />
            <GamesChapel isMobile={isMobile} />
            <TerminalChapel isMobile={isMobile} onOpenTerminal={onOpenTerminal} />
            <ExitChapel isMobile={isMobile} />
          </>
        )}

        <PostFX perfTier={perfTier} />
      </Canvas>
    </div>
  );
}
