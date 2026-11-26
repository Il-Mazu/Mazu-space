import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { CHAPELS } from '../data/chapels.js';
import { sceneBus } from '../state/sceneBus.js';

export default function CathedralLighting({ isMobile }) {
  const keyRedRef = useRef(null);
  const followerRedRef = useRef(null);
  const heroUnderRef = useRef(null);

  useFrame((state) => {
    const { bass, mid } = sceneBus.audioMetrics;
    const t = state.clock.elapsedTime;
    // slow procedural pulse while I'm listening (no audio stream to sync to)
    const listenPulse = sceneBus.listening && !sceneBus.reducedMotion ? Math.sin(t * 2.2) * 0.08 : 0;
    const flicker = 1 + Math.sin(t * 7.3) * 0.04 + bass * 0.9 + mid * 0.4 + listenPulse;

    if (heroUnderRef.current) {
      heroUnderRef.current.intensity = 11.5 * flicker;
    }

    // Track active section smoothly with one moving crimson pool so dynamic light count stays lean.
    const idx = Math.min(CHAPELS.length - 1, Math.max(0, sceneBus.activeSection));
    const sec = CHAPELS[idx];
    if (followerRedRef.current) {
      followerRedRef.current.position.set(0, sec.lookAt[1] + 0.6, sec.z + 4.5);
      followerRedRef.current.intensity = 13.0 * flicker;
    }

    if (keyRedRef.current) {
      keyRedRef.current.intensity = 9.0 * (1 + bass * 0.65);
    }
  });

  return (
    <>
      <Environment resolution={isMobile ? 128 : 256} frames={1}>
        {/* Sharp upper bone horizon band recreates the old Y2K metallic horizon reflection */}
        <Lightformer
          form="rect"
          intensity={5.5}
          color="#f4f4f7"
          position={[0, 7.5, -2]}
          rotation={[Math.PI / 2.2, 0, 0]}
          scale={[26, 2.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#d8d2c6"
          position={[-9, 3.5, -2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[22, 3.0, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#d8d2c6"
          position={[9, 3.5, -2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[22, 3.0, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4.2}
          color="#ff3352"
          position={[0, -6, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[22, 16, 1]}
        />
        {/* Front-facing reflection panels so +Z chrome bevels (like MAZU) catch sharp highlights */}
        <Lightformer
          form="rect"
          intensity={4.2}
          color="#f4f2ec"
          position={[0, 4.5, 11]}
          rotation={[0.25, Math.PI, 0]}
          scale={[24, 3.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.6}
          color="#ff3352"
          position={[0, -3.5, 10]}
          rotation={[-0.25, Math.PI, 0]}
          scale={[22, 4.0, 1]}
        />
      </Environment>

      <ambientLight intensity={0.22} color="#241f24" />
      <directionalLight position={[3.5, 14, 6]} intensity={0.85} color="#e9e4da" />
      <directionalLight position={[-4.5, 10, -8]} intensity={0.48} color="#b9b9c2" />

      <pointLight
        ref={heroUnderRef}
        position={[0.6, 1.4, 3.8]}
        color="#ff3352"
        intensity={11.5}
        distance={26}
        decay={1.6}
      />

      <pointLight
        ref={followerRedRef}
        position={[0, 1.5, -18]}
        color="#ff3352"
        intensity={13.0}
        distance={28}
        decay={1.5}
      />

      <pointLight
        ref={keyRedRef}
        position={[0, 3.6, -12]}
        color="#8a0f1f"
        intensity={9.0}
        distance={30}
        decay={1.5}
      />
    </>
  );
}
