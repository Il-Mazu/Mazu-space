import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOOT_LOGO } from '../data/ascii.js';
import { buildMazuLogoGeometry } from './mazuPaths.js';
import { createShatterMaterial } from '../shaders/shatterShader.js';
import { getProceduralTextures } from './proceduralTextures.js';
import { emitSceneState, sceneBus, triggerGlitch } from '../state/sceneBus.js';

function sampleParticlesFromBootAndLogo(logoGeo, maxCount = 3200) {
  // Source points from BOOT_LOGO non-space glyph coordinates
  const lines = BOOT_LOGO.split('\n');
  const asciiPts = [];
  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      if (line[c] !== ' ') {
        const x = (c / cols - 0.5) * 6.8;
        const y = (0.5 - r / rows) * 1.9;
        asciiPts.push(x, y, 0);
      }
    }
  }

  // Target points from extruded MAZU 3D geometry vertices
  const posAttr = logoGeo.getAttribute('position');
  const vertCount = posAttr.count;

  const count = maxCount;
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const seed = new Float32Array(count);

  const asciiTotal = Math.max(1, asciiPts.length / 3);
  for (let i = 0; i < count; i++) {
    const ai = (i % asciiTotal) * 3;
    start[i * 3] = asciiPts[ai] + (Math.random() - 0.5) * 0.05;
    start[i * 3 + 1] = asciiPts[ai + 1] + (Math.random() - 0.5) * 0.05;
    start[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

    const vi = Math.floor((i / count) * vertCount) % vertCount;
    target[i * 3] = posAttr.getX(vi) * 0.85;
    target[i * 3 + 1] = posAttr.getY(vi) * 0.85;
    target[i * 3 + 2] = posAttr.getZ(vi) * 0.85;

    const angle = Math.random() * Math.PI * 2;
    const rad = 0.6 + Math.random() * 1.6;
    scatter[i * 3] = Math.cos(angle) * rad;
    scatter[i * 3 + 1] = Math.sin(angle) * rad * 0.75;
    scatter[i * 3 + 2] = (Math.random() - 0.25) * 2.2;

    seed[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return geo;
}

export default function MazuEmblem3D({ isMobile }) {
  const { chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const logoGeom = useMemo(() => buildMazuLogoGeometry(), []);
  const particleGeom = useMemo(
    () => sampleParticlesFromBootAndLogo(logoGeom, isMobile ? 1800 : 3200),
    [logoGeom, isMobile],
  );
  const shatterMat = useMemo(() => createShatterMaterial(), []);
  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#787886',
      metalness: 0.98,
      roughness: 0.08,
      roughnessMap: chromeRoughness,
      emissive: '#420610',
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0,
    }),
    [chromeRoughness],
  );

  const groupRef = useRef(null);
  const timerRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => () => {
    logoGeom.dispose();
    particleGeom.dispose();
    shatterMat.dispose();
    chromeMat.dispose();
  }, [logoGeom, particleGeom, shatterMat, chromeMat]);

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;

    if (sceneBus.bootPhase === 'done' || sceneBus.bootPhase !== 'shattering') {
      groupRef.current.visible = false;
      return;
    }

    const dt = Math.min(rawDelta, 0.045);
    groupRef.current.visible = true;
    timerRef.current += dt;
    const t = timerRef.current;

    // 0.0 -> 0.85s: ASCII particles shatter and assemble into MAZU
    // 0.50 -> 1.85s: Solid chrome MAZU glows with red light from below
    // 1.85 -> 2.35s: Push forward past camera and cut into Hero Eye
    const p = THREE.MathUtils.clamp(t / 0.85, 0, 1);
    shatterMat.uniforms.uProgress.value = p;
    shatterMat.uniforms.uOpacity.value = t < 0.95 ? 0.9 : Math.max(0, 1 - (t - 0.95) / 0.35);

    const meshFadeIn = THREE.MathUtils.clamp((t - 0.35) / 0.30, 0, 1);
    const meshFadeOut = t > 1.95 ? Math.max(0, 1 - (t - 1.95) / 0.35) : 1;
    chromeMat.opacity = meshFadeIn * meshFadeOut;

    const pushZ = t > 1.85 ? (t - 1.85) * 9.5 : 0;
    groupRef.current.position.set(0, 1.75, 5.4 + pushZ);
    groupRef.current.rotation.y = Math.sin(t * 1.4) * 0.08;

    if (t >= 2.25 && !finishedRef.current) {
      finishedRef.current = true;
      triggerGlitch(0.95);
      sceneBus.bootPhase = 'done';
      sceneBus.entered = true;
      emitSceneState();
    }
  });

  const scale = isMobile ? 0.56 : 0.85;

  return (
    <group ref={groupRef} position={[0, 1.75, 5.4]} scale={scale} visible={false}>
      <points geometry={particleGeom} material={shatterMat} frustumCulled={false} />
      <mesh geometry={logoGeom} material={chromeMat} scale={0.85} />
      <pointLight position={[0, -2.2, 1.2]} color="#ff3352" intensity={18} distance={10} decay={1.5} />
    </group>
  );
}
