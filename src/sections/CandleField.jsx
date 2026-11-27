import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { naveFloorY } from '../data/chapels.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';
import { playHoverTick } from '../audio/AudioEngine.js';

// The guestbook: one votive candle per entry on a dais before the exit apse.
// Oldest at the centre on a golden-angle spiral, so a new candle takes the
// next free place at the edge and nobody else moves.
const CENTER_DZ = 7.2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function ago(ms) {
  const mins = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

const dummy = new THREE.Object3D();

export default function CandleField({ chapel, entries, justLit, isMobile }) {
  const { gl } = useThree();
  const portal = useMemo(() => ({ current: gl.domElement.parentNode }), [gl]);
  const { stoneBump } = useMemo(() => getProceduralTextures(), []);
  const waxRef = useRef(null);
  const coreRef = useRef(null);
  const glowRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const litAt = useRef({});

  const offsetX = isMobile ? 0 : 0.9;
  const cz = chapel.z + CENTER_DZ;
  const baseY = naveFloorY(cz) + 0.08;

  // oldest first, so positions stay put as new entries arrive
  const candles = useMemo(() => {
    const ordered = [...entries].reverse();
    return ordered.map((e, k) => {
      const r = 0.32 * Math.sqrt(k + 0.6);
      const a = k * GOLDEN;
      const h = 0.14 + hash01(e.id) * 0.22;
      return {
        entry: e,
        x: offsetX + Math.cos(a) * r * 1.25,
        z: Math.sin(a) * r * 0.85,
        h,
        seed: hash01(`${e.id}:s`) * 10,
      };
    });
  }, [entries, offsetX]);

  useEffect(() => {
    if (justLit) litAt.current[justLit] = performance.now();
  }, [justLit]);

  useEffect(() => {
    const wax = waxRef.current;
    if (!wax) return;
    candles.forEach((c, i) => {
      dummy.position.set(c.x, c.h / 2, c.z);
      dummy.scale.set(1, c.h, 1);
      dummy.updateMatrix();
      wax.setMatrixAt(i, dummy.matrix);
    });
    wax.instanceMatrix.needsUpdate = true;
  }, [candles]);

  useFrame((state) => {
    const core = coreRef.current;
    const glow = glowRef.current;
    if (!core || !glow) return;
    const t = state.clock.elapsedTime;
    const still = sceneBus.reducedMotion;
    const now = performance.now();
    const focusId = sceneBus.guestFocus;
    candles.forEach((c, i) => {
      const flicker = still ? 1 : 1 + Math.sin(t * 9 + c.seed) * 0.08 + Math.sin(t * 21 + c.seed * 2) * 0.05;
      const since = litAt.current[c.entry.id] ? (now - litAt.current[c.entry.id]) / 1000 : 99;
      // a fresh candle flares up and settles over a couple of seconds
      const flare = since < 3 ? 1 + 3.2 * Math.exp(-since * 2.2) : 1;
      const focus = hovered === i || focusId === c.entry.id ? 1.7 : 1;
      const s = flicker * flare * focus;
      dummy.position.set(c.x, c.h + 0.05, c.z);
      dummy.scale.set(0.022 * s, 0.05 * s, 0.022 * s);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(0.07 * s, 0.1 * s, 0.07 * s);
      dummy.updateMatrix();
      glow.setMatrixAt(i, dummy.matrix);
    });
    core.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
  });

  const n = candles.length;
  const active = hovered !== null ? candles[hovered] : null;

  return (
    <group position={[0, baseY, cz]}>
      {/* low stone dais the candles stand on */}
      <mesh position={[offsetX, -0.04, 0]} scale={[1.25, 1, 0.85]}>
        <cylinderGeometry args={[Math.max(1.4, 0.32 * Math.sqrt(n + 1) + 0.5), Math.max(1.5, 0.32 * Math.sqrt(n + 1) + 0.6), 0.1, 48]} />
        <meshStandardMaterial color="#141418" metalness={0.3} roughness={0.8} bumpMap={stoneBump} bumpScale={0.05} />
      </mesh>
      {n > 0 && (
        <group key={n}>
          <instancedMesh ref={waxRef} args={[null, null, n]} frustumCulled={false}>
            <cylinderGeometry args={[0.045, 0.05, 1, 10]} />
            <meshStandardMaterial color="#c9c0b4" roughness={0.9} emissive="#3a0a10" emissiveIntensity={0.8} />
          </instancedMesh>
          <instancedMesh ref={coreRef} args={[null, null, n]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={[2.2, 1.9, 1.6]} toneMapped={false} />
          </instancedMesh>
          <instancedMesh ref={glowRef} args={[null, null, n]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={[2.4, 0.2, 0.36]} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </instancedMesh>
          {/* generous invisible hit volumes; the candles themselves are tiny */}
          <instancedMesh
            args={[null, null, n]}
            onUpdate={(m) => {
              candles.forEach((c, i) => {
                dummy.position.set(c.x, 0.3, c.z);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                m.setMatrixAt(i, dummy.matrix);
              });
              m.instanceMatrix.needsUpdate = true;
              m.computeBoundingSphere();
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              if (e.instanceId !== hovered) {
                setHovered(e.instanceId);
                playHoverTick();
              }
            }}
            onPointerOut={() => setHovered(null)}
            // touch has no hover: a tap toggles the note
            onClick={(e) => {
              e.stopPropagation();
              setHovered((cur) => (cur === e.instanceId ? null : e.instanceId));
            }}
          >
            <cylinderGeometry args={[0.13, 0.13, 0.6, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </instancedMesh>
        </group>
      )}
      {active && (
        <Html portal={portal} position={[active.x, active.h + 0.3, active.z]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className="candle-note">
            <span className="candle-note-name">
              {active.entry.name} <span className="candle-note-when">{ago(active.entry.createdAt)}</span>
            </span>
            <span className="candle-note-msg">{active.entry.message}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
