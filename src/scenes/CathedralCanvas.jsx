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

function AudioSampler() {
  useFrame(() => {
    sampleAudio();
  });
  return null;
}

function ChapelMarkers() {
  // Temporary subtle red floor beacons for downstream chapels until Phases 3-6 populate them.
  return (
    <group>
      {SECTIONS.slice(1).map((sec) => (
        <mesh key={sec.id} position={[0, sec.lookAt[1] - 0.8, sec.z]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshBasicMaterial color={[1.6, 0.14, 0.25]} toneMapped={false} wireframe />
        </mesh>
      ))}
    </group>
  );
}

export default function CathedralCanvas({ isMobile }) {
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
        <ChapelMarkers />

        <PostFX perfTier={perfTier} />
      </Canvas>
    </div>
  );
}
