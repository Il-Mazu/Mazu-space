import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { naveFloorY } from '../scenes/GothicNave.jsx';
import { sceneBus } from '../state/sceneBus.js';

function createScreenIdleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = 'rgba(255, 51, 82, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 364);

  ctx.fillStyle = '#80808a';
  ctx.font = '18px monospace';
  ctx.fillText('mazu-space OS [v3.0.0]', 32, 54);
  ctx.fillText('(c) 2026 mazu', 32, 82);
  ctx.fillText('── confessional terminal ready', 32, 128);

  ctx.fillStyle = '#e9e4da';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('C:\\> click monitor to enter_', 32, 200);

  ctx.fillStyle = '#ff3352';
  ctx.font = '15px monospace';
  ctx.fillText('// commands: help, fastfetch, cmatrix, glitch', 32, 330);

  for (let y = 0; y < 384; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y, 512, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function TerminalChapel({ isMobile, onOpenTerminal }) {
  const { stoneBump, chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const screenTex = useMemo(() => createScreenIdleTexture(), []);
  const ledRef = useRef(null);
  const hoveredRef = useRef(false);
  const cableGeo = useMemo(() => {
    const curves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.78, -0.35, -0.2),
        new THREE.Vector3(-1.15, -1.1, 0.25),
        new THREE.Vector3(-1.45, -2.0, 0.45),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.78, -0.35, -0.2),
        new THREE.Vector3(1.1, -1.0, 0.15),
        new THREE.Vector3(1.5, -2.0, 0.35),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.05, -0.3),
        new THREE.Vector3(0.45, 1.85, -0.5),
        new THREE.Vector3(0.95, 3.1, -0.3),
      ]),
    ];
    return curves.map((c) => new THREE.TubeGeometry(c, 16, 0.032, 6, false));
  }, []);

  useEffect(() => () => {
    screenTex.dispose();
    cableGeo.forEach((g) => g.dispose());
  }, [screenTex, cableGeo]);

  useFrame((state) => {
    if (!ledRef.current) return;
    const pulse = hoveredRef.current
      ? 2.8
      : sceneBus.reducedMotion
        ? 1.5
        : 1.2 + Math.sin(state.clock.elapsedTime * 3.2) * 0.6;
    ledRef.current.color.setRGB(pulse, 0.1 * pulse, 0.2 * pulse);
  });

  const floorY = naveFloorY(-130); // ~ -4.53
  const centerY = -2.5;
  const plinthHeight = Math.max(0.6, centerY - 0.85 - floorY);

  return (
    <group position={[0, centerY, -130]} scale={isMobile ? 0.86 : 1}>
      {/* Stone confessional altar pedestal reaching from floor to CRT */}
      <mesh position={[0, -0.85 - plinthHeight * 0.5, -0.15]}>
        <boxGeometry args={[2.35, plinthHeight, 1.5]} />
        <meshStandardMaterial color="#16161c" metalness={0.35} roughness={0.7} bumpMap={stoneBump} bumpScale={0.08} />
      </mesh>

      {/* Confessional gothic side lattice wings */}
      {[-1.55, 1.55].map((x, i) => (
        <group key={i} position={[x, 0.15, -0.25]} rotation={[0, i === 0 ? 0.28 : -0.28, 0]}>
          <mesh>
            <boxGeometry args={[0.14, 2.8, 0.95]} />
            <meshStandardMaterial color="#1f1f27" metalness={0.7} roughness={0.35} roughnessMap={chromeRoughness} />
          </mesh>
          <mesh position={[0, 0, 0.48]}>
            <boxGeometry args={[0.04, 2.4, 0.03]} />
            <meshBasicMaterial color={[1.3, 0.1, 0.22]} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Heavy CRT Monitor Chassis */}
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTerminal();
        }}
      >
        {/* Outer monitor cabinet */}
        <mesh position={[0, 0, -0.45]}>
          <boxGeometry args={[2.05, 1.62, 0.95]} />
          <meshStandardMaterial color="#23232c" metalness={0.85} roughness={0.28} roughnessMap={chromeRoughness} />
        </mesh>

        {/* Chrome front bezel */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[2.12, 1.68, 0.12]} />
          <meshStandardMaterial color="#4c4c58" metalness={0.95} roughness={0.16} />
        </mesh>

        {/* Interactive CRT screen */}
        <mesh position={[0, 0.02, 0.11]}>
          <planeGeometry args={[1.78, 1.34]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>

        {/* Power LED indicator */}
        <mesh position={[0.78, -0.71, 0.11]}>
          <boxGeometry args={[0.11, 0.05, 0.03]} />
          <meshBasicMaterial ref={ledRef} color={[1.6, 0.12, 0.24]} toneMapped={false} />
        </mesh>
      </group>

      {/* Hanging confessional power cables */}
      {cableGeo.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color="#121216" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
