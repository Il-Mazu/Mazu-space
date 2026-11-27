import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHRONICLE, isOngoing } from '../data/content.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';
import { DISPLAY, MONO, useFontsReady } from '../utils/fonts.js';

// Whoami's second beat: the chronicle carved along the left wall, a votive
// candle on the ledge for each step. Ongoing steps still burn; the rest have
// guttered low.
const WALL_X = -4.2;
const FIRST_Z = -5.2;
const STEP_Z = -2.6;

function plaqueTexture(entry) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#121216';
  ctx.fillRect(0, 0, 640, 360);
  // chiselled border
  ctx.strokeStyle = '#2a2a32';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, 608, 328);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3352';
  ctx.font = `34px ${MONO}`;
  ctx.fillText(entry.when, 320, 92, 560);
  ctx.fillStyle = '#e9e4da';
  ctx.font = `60px ${DISPLAY}`;
  ctx.fillText(entry.title, 320, 190, 580);
  ctx.fillStyle = '#8f8590';
  ctx.font = `26px ${MONO}`;
  ctx.fillText(entry.detail, 320, 262, 580);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Station({ entry, index, z }) {
  const fontsReady = useFontsReady();
  const tex = useMemo(() => plaqueTexture(entry), [entry, fontsReady]);
  const flameRef = useRef(null);
  const burning = isOngoing(entry);
  const wax = burning ? 0.62 : 0.24;

  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((state) => {
    if (!flameRef.current || sceneBus.reducedMotion) return;
    const t = state.clock.elapsedTime;
    const f = 1 + Math.sin(t * 10 + index * 2.1) * 0.07 + Math.sin(t * 23 + index) * 0.04;
    flameRef.current.scale.set(f, f * 1.15, f);
  });

  return (
    <group position={[0, 0, z]}>
      <mesh position={[WALL_X + 0.09, 2.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.95, 1.1]} />
        <meshStandardMaterial map={tex} roughness={0.85} metalness={0.1} />
      </mesh>
      <group position={[WALL_X + 0.42, 1.02, 0]}>
        <mesh position={[0, wax / 2, 0]}>
          <cylinderGeometry args={[0.075, 0.08, wax, 16]} />
          <meshStandardMaterial color="#c9c0b4" roughness={0.9} emissive="#3a0a10" emissiveIntensity={burning ? 0.9 : 0.4} />
        </mesh>
        <group ref={flameRef} position={[0, wax + 0.07, 0]}>
          <mesh scale={[0.028, 0.06, 0.028]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color={burning ? [2.2, 1.9, 1.6] : [1.2, 0.5, 0.4]} toneMapped={false} />
          </mesh>
          <mesh scale={burning ? [0.06, 0.12, 0.06] : [0.04, 0.07, 0.04]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color={[2.4, 0.2, 0.36]} transparent opacity={burning ? 0.55 : 0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function ChronicleWall({ chapel }) {
  const { stoneBump } = useMemo(() => getProceduralTextures(), []);
  const length = Math.abs(STEP_Z) * CHRONICLE.length + 1.6;
  const midZ = FIRST_Z + (STEP_Z * (CHRONICLE.length - 1)) / 2;

  return (
    <group position={[0, chapel.floorY, chapel.z]}>
      {/* stone wall panel between the pillars */}
      <mesh position={[WALL_X - 0.1, 1.9, midZ]}>
        <boxGeometry args={[0.2, 3.8, length]} />
        <meshStandardMaterial color="#17171c" metalness={0.25} roughness={0.8} bumpMap={stoneBump} bumpScale={0.07} />
      </mesh>
      {/* ledge the candles stand on */}
      <mesh position={[WALL_X + 0.3, 0.95, midZ]}>
        <boxGeometry args={[0.6, 0.14, length - 0.4]} />
        <meshStandardMaterial color="#1f1f26" metalness={0.35} roughness={0.7} bumpMap={stoneBump} bumpScale={0.05} />
      </mesh>
      <mesh position={[WALL_X + 0.61, 0.9, midZ]}>
        <boxGeometry args={[0.02, 0.025, length - 0.5]} />
        <meshBasicMaterial color={[1.4, 0.1, 0.2]} toneMapped={false} />
      </mesh>
      {CHRONICLE.map((entry, i) => (
        <Station key={entry.title} entry={entry} index={i} z={FIRST_Z + STEP_Z * i} />
      ))}
    </group>
  );
}
