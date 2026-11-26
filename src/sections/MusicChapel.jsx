import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';

function createVinylTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const cx = 256;
  const cy = 256;

  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, 512, 512);

  for (let r = 82; r < 248; r += 3) {
    const bright = (r % 15 === 0) ? 46 : 22 + (r % 7) * 2;
    ctx.strokeStyle = `rgb(${bright},${bright},${bright + 4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Turntable altar of the Live chapel. `listening` spins the record and drops the tonearm.
export default function MusicChapel({ chapel, isMobile, listening = false }) {
  const { stoneBump, chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const vinylTex = useMemo(() => createVinylTexture(), []);
  const labelMatRef = useRef(null);
  const discRef = useRef(null);
  const armRef = useRef(null);

  useEffect(() => () => vinylTex.dispose(), [vinylTex]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (discRef.current && listening && !sceneBus.reducedMotion) {
      discRef.current.rotation.y -= dt * (1.2 + sceneBus.audioMetrics.bass * 0.35);
    }
    if (armRef.current) {
      const targetArm = listening ? -0.34 : 0.06;
      armRef.current.rotation.y = THREE.MathUtils.damp(armRef.current.rotation.y, targetArm, 6.0, dt);
    }
  });

  const { floorY, z } = chapel;
  const altarPos = [0, floorY + (isMobile ? 0.9 : 0.25), z + 0.8];
  const altarScale = isMobile ? 0.68 : 0.92;

  return (
    <group>
      {/* Stone turntable altar */}
      <group position={altarPos} scale={altarScale}>
        {/* Stepped basalt plinth */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[2.9, 0.9, 2.3]} />
          <meshStandardMaterial color="#17171d" metalness={0.38} roughness={0.68} bumpMap={stoneBump} bumpScale={0.08} />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[2.45, 0.22, 1.95]} />
          <meshStandardMaterial color="#282832" metalness={0.86} roughness={0.22} roughnessMap={chromeRoughness} />
        </mesh>

        {/* Crimson front LED slit */}
        <mesh position={[0, 0.88, 0.98]}>
          <boxGeometry args={[2.25, 0.035, 0.04]} />
          <meshBasicMaterial color={[1.8, 0.14, 0.28]} toneMapped={false} />
        </mesh>

        {/* Angled Turntable Platter Assembly facing camera */}
        <group position={[0, 1.38, 0.1]} rotation={[0.42, -0.18, 0]}>
          {/* Platter deck */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[2.2, 0.1, 1.85]} />
            <meshStandardMaterial color="#141419" metalness={0.82} roughness={0.25} />
          </mesh>

          {/* Spinning grooved vinyl disc + cover art label */}
          <group ref={discRef} position={[-0.14, 0.04, 0]}>
            <mesh>
              <cylinderGeometry args={[0.84, 0.84, 0.024, 48]} />
              <meshStandardMaterial map={vinylTex} metalness={0.45} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.33, 36]} />
              <meshStandardMaterial ref={labelMatRef} color="#8a0f1f" roughness={0.45} metalness={0.15} />
            </mesh>
            {/* Chrome center spindle */}
            <mesh position={[0, 0.035, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
              <meshStandardMaterial color="#b9b9c2" metalness={0.98} roughness={0.1} />
            </mesh>
          </group>

          {/* Chrome tonearm */}
          <group ref={armRef} position={[0.84, 0.08, -0.58]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.09, 0.08, 12]} />
              <meshStandardMaterial color="#585866" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0.04, 0.48]}>
              <boxGeometry args={[0.035, 0.035, 0.96]} />
              <meshStandardMaterial color="#7a7a88" metalness={0.96} roughness={0.14} />
            </mesh>
            <mesh position={[-0.04, 0.02, 0.96]}>
              <boxGeometry args={[0.08, 0.05, 0.14]} />
              <meshStandardMaterial color="#ff3352" emissive="#8a0f1f" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
      </group>

    </group>
  );
}
