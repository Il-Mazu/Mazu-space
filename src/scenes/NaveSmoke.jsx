import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSmokeMaterial } from '../shaders/smokeShader.js';
import { getProceduralTextures } from './proceduralTextures.js';
import { NAVE_END_Z, naveFloorY } from '../data/chapels.js';
import { sceneBus } from '../state/sceneBus.js';

export default function NaveSmoke({ isMobile }) {
  const { ashSprite } = useMemo(() => getProceduralTextures(), []);

  const plumes = useMemo(() => {
    const arr = [];
    const step = isMobile ? 22 : 16;
    for (let z = 3; z >= NAVE_END_Z + 4; z -= step) {
      const fy = naveFloorY(z);
      arr.push({
        pos: [((arr.length % 2) - 0.5) * 1.4, fy + 1.05, z],
        rotY: ((arr.length % 3) - 1) * 0.14,
        scale: [9.5, 4.2, 1],
        seed: arr.length * 3.17,
        opacity: arr.length === 0 ? 0.42 : 0.28,
      });
    }
    return arr;
  }, [isMobile]);

  const materials = useMemo(
    () => plumes.map((p) => createSmokeMaterial(p.seed, p.opacity)),
    [plumes],
  );

  useEffect(() => () => {
    materials.forEach((m) => m.dispose());
  }, [materials]);

  // Drifting cathedral ash particles
  const ashCount = isMobile ? 220 : 480;
  const { ashGeo, ashVel } = useMemo(() => {
    const positions = new Float32Array(ashCount * 3);
    const colors = new Float32Array(ashCount * 3);
    const vel = new Float32Array(ashCount);
    const bone = new THREE.Color('#e9e4da');
    const red = new THREE.Color('#ff3352');

    for (let i = 0; i < ashCount; i++) {
      const z = 8 - Math.random() * (8 - NAVE_END_Z);
      const fy = naveFloorY(z);
      positions[i * 3] = (Math.random() - 0.5) * 9.0;
      positions[i * 3 + 1] = fy + 0.3 + Math.random() * 7.2;
      positions[i * 3 + 2] = z;
      vel[i] = 0.15 + Math.random() * 0.35;

      const c = Math.random() < 0.24 ? red : bone;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { ashGeo: geo, ashVel: vel };
  }, [ashCount]);

  useEffect(() => () => ashGeo.dispose(), [ashGeo]);

  const ashRef = useRef(null);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = sceneBus.reducedMotion ? 0 : state.clock.elapsedTime;
    const bass = sceneBus.audioMetrics.bass;

    for (let i = 0; i < materials.length; i++) {
      materials[i].uniforms.uTime.value = t;
      materials[i].uniforms.uAudioBass.value = bass;
    }

    if (!sceneBus.reducedMotion && ashRef.current) {
      const posAttr = ashGeo.getAttribute('position');
      const arr = posAttr.array;
      for (let i = 0; i < ashCount; i++) {
        const idx = i * 3;
        arr[idx + 1] += ashVel[i] * dt * (1 + bass * 1.4);
        arr[idx] += Math.sin(t * 0.6 + i) * 0.08 * dt;
        const floor = naveFloorY(arr[idx + 2]);
        if (arr[idx + 1] > floor + 7.8) {
          arr[idx + 1] = floor + 0.2;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {plumes.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rotY, 0]} scale={p.scale} material={materials[i]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}

      <points ref={ashRef} geometry={ashGeo} frustumCulled={false}>
        <pointsMaterial
          size={0.09}
          map={ashSprite}
          vertexColors
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
