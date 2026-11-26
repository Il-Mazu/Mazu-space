import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import HeroEye from './HeroEye.jsx';
import { sceneBus } from '../state/sceneBus.js';

export default function ExitChapel({ chapel, isMobile }) {
  const { stoneBump, chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const sigilGroupRef = useRef(null);

  useFrame((state) => {
    if (!sigilGroupRef.current || sceneBus.reducedMotion) return;
    const t = state.clock.elapsedTime;
    sigilGroupRef.current.children.forEach((child, i) => {
      child.rotation.y = t * 0.45 + i * 1.1;
      child.position.y = 0.7 + Math.sin(t * 1.2 + i * 2.0) * 0.14;
    });
  });

  const { floorY, z } = chapel;
  const spread = isMobile ? 2.15 : 3.2;

  return (
    <group>
      {/* Carved basalt ledger monoliths flanking the exit apse */}
      <group position={[0, floorY, z]}>
        {[-spread, spread].map((x, idx) => (
          <group key={idx} position={[x, 1.45, 0]} rotation={[0, idx === 0 ? 0.3 : -0.3, 0]}>
            <mesh>
              <boxGeometry args={[1.15, 3.3, 0.42]} />
              <meshStandardMaterial color="#18181f" metalness={0.35} roughness={0.68} bumpMap={stoneBump} bumpScale={0.08} />
            </mesh>
            <mesh position={[0, 1.82, 0]}>
              <coneGeometry args={[0.42, 0.72, 4]} />
              <meshStandardMaterial color="#4a4a58" metalness={0.96} roughness={0.14} roughnessMap={chromeRoughness} />
            </mesh>
            <mesh position={[0, 0.15, 0.22]}>
              <boxGeometry args={[0.88, 0.04, 0.03]} />
              <meshBasicMaterial color={[1.6, 0.12, 0.24]} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Orbiting chrome link sigils */}
        {/* kept up beside the eye, clear of the ledger text below it */}
        <group ref={sigilGroupRef} position={[0, 2.1, 0.6]}>
          {[-2.2, 2.2].map((x, i) => (
            <mesh key={i} position={[x, 0.7, 0]}>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#6a6a78" metalness={0.98} roughness={0.12} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Closing Eye at the very end of the nave */}
      <HeroEye
        position={[0, floorY + 3.45, z - 1.5]}
        scale={isMobile ? 0.72 : 0.88}
        spectral
        isMobile={isMobile}
      />
    </group>
  );
}
