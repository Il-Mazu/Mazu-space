import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneBus } from '../state/sceneBus.js';

const SAMPLES = 128;

function createRibbonGeometry() {
  const positions = new Float32Array(SAMPLES * 2 * 3);
  const indices = [];
  for (let i = 0; i < SAMPLES - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

export default function Oscilloscope3D({ position = [0, 0, 0], width = 8.4, height = 2.0 }) {
  const coreGeo = useMemo(() => createRibbonGeometry(), []);
  const glowGeo = useMemo(() => createRibbonGeometry(), []);
  const coreMatRef = useRef(null);
  const idleNoise = useMemo(() => new Float32Array(SAMPLES), []);

  useEffect(() => () => {
    coreGeo.dispose();
    glowGeo.dispose();
  }, [coreGeo, glowGeo]);

  useFrame((state) => {
    const { isPlaying, timeDomain, rms } = sceneBus.audioMetrics;
    const t = state.clock.elapsedTime;
    const coreAttr = coreGeo.getAttribute('position');
    const glowAttr = glowGeo.getAttribute('position');
    const cArr = coreAttr.array;
    const gArr = glowAttr.array;

    const halfCore = 0.022 + rms * 0.022;
    const halfGlow = 0.095 + rms * 0.085;

    for (let i = 0; i < SAMPLES; i++) {
      const x = ((i / (SAMPLES - 1)) - 0.5) * width;
      let y = 0;

      if (isPlaying) {
        y = ((timeDomain[i] / 128) - 1) * (height * 0.52);
      } else {
        const limit = height * 0.12;
        const delta = sceneBus.reducedMotion ? 0 : (Math.random() - 0.5) * 0.045;
        idleNoise[i] = Math.max(-limit, Math.min(limit, (idleNoise[i] + delta) * 0.97));
        y = idleNoise[i] + Math.sin(i * 0.16 + t * 2.1) * 0.028;
      }

      const idx = i * 6;
      cArr[idx] = x;
      cArr[idx + 1] = y - halfCore;
      cArr[idx + 2] = 0;
      cArr[idx + 3] = x;
      cArr[idx + 4] = y + halfCore;
      cArr[idx + 5] = 0;

      gArr[idx] = x;
      gArr[idx + 1] = y - halfGlow;
      gArr[idx + 2] = -0.02;
      gArr[idx + 3] = x;
      gArr[idx + 4] = y + halfGlow;
      gArr[idx + 5] = -0.02;
    }

    coreAttr.needsUpdate = true;
    glowAttr.needsUpdate = true;

    if (coreMatRef.current) {
      const boost = isPlaying ? 1.85 + rms * 2.4 : 1.25;
      coreMatRef.current.color.setRGB(boost, 0.11 * boost, 0.21 * boost);
    }
  });

  return (
    <group position={position}>
      {/* Horizontal oscilloscope reticle */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[width, 0.012]} />
        <meshBasicMaterial color="#401018" transparent opacity={0.55} />
      </mesh>
      <mesh position={[-width * 0.5, 0, 0]}>
        <boxGeometry args={[0.08, height * 0.85, 0.08]} />
        <meshStandardMaterial color="#4c4c58" metalness={0.96} roughness={0.18} />
      </mesh>
      <mesh position={[width * 0.5, 0, 0]}>
        <boxGeometry args={[0.08, height * 0.85, 0.08]} />
        <meshStandardMaterial color="#4c4c58" metalness={0.96} roughness={0.18} />
      </mesh>

      {/* Outer soft crimson bloom ribbon */}
      <mesh geometry={glowGeo} frustumCulled={false}>
        <meshBasicMaterial
          color="#ff3352"
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sharp HDR waveform core */}
      <mesh geometry={coreGeo} frustumCulled={false}>
        <meshBasicMaterial
          ref={coreMatRef}
          color={[1.4, 0.14, 0.28]}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
