import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOOT_LOGO } from '../data/ascii.js';
import { buildMazuLogoGeometry } from './mazuPaths.js';
import { createShatterMaterial } from '../shaders/shatterShader.js';
import { getProceduralTextures } from './proceduralTextures.js';
import { emitSceneState, sceneBus, triggerGlitch } from '../state/sceneBus.js';

function sampleParticlesFromBootAndLogo(logoGeo, maxCount = 3200) {
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
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(logoGeom, 28), [logoGeom]);
  const particleGeom = useMemo(
    () => sampleParticlesFromBootAndLogo(logoGeom, isMobile ? 1800 : 3200),
    [logoGeom, isMobile],
  );
  const shatterMat = useMemo(() => createShatterMaterial(), []);
  const chromeMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: '#e0dcd4',
      metalness: 0.82,
      roughness: 0.18,
      roughnessMap: chromeRoughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: '#6e0b1a',
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0,
    }),
    [chromeRoughness],
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({
      color: new THREE.Color(1.55, 0.24, 0.36),
      toneMapped: false,
      transparent: true,
      opacity: 0,
    }),
    [],
  );

  const groupRef = useRef(null);
  const timerRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => () => {
    logoGeom.dispose();
    edgeGeom.dispose();
    particleGeom.dispose();
    shatterMat.dispose();
    chromeMat.dispose();
    edgeMat.dispose();
  }, [logoGeom, edgeGeom, particleGeom, shatterMat, chromeMat, edgeMat]);

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;

    if (sceneBus.bootPhase === 'done' || sceneBus.bootPhase !== 'shattering') {
      groupRef.current.visible = false;
      return;
    }

    const dt = Math.min(rawDelta, 0.12);
    groupRef.current.visible = true;
    timerRef.current += dt;
    const t = timerRef.current;

    // 0.0 -> 0.72s: ASCII particles shatter and assemble into MAZU
    // 0.18 -> 2.15s: Solid chrome MAZU gleams with bone key + red under-light
    // 2.15 -> 2.65s: Push forward past camera and cut into Hero Eye
    const p = THREE.MathUtils.clamp(t / 0.72, 0, 1);
    shatterMat.uniforms.uProgress.value = p;
    shatterMat.uniforms.uOpacity.value = t < 0.85 ? 0.92 : Math.max(0, 1 - (t - 0.85) / 0.35);

    const meshFadeIn = THREE.MathUtils.clamp((t - 0.18) / 0.28, 0, 1);
    const meshFadeOut = t > 2.25 ? Math.max(0, 1 - (t - 2.25) / 0.35) : 1;
    const solidAlpha = meshFadeIn * meshFadeOut;
    chromeMat.opacity = solidAlpha;
    edgeMat.opacity = solidAlpha * 0.75;

    const pushZ = t > 2.15 ? (t - 2.15) * 9.5 : 0;
    groupRef.current.position.set(0, 1.75, 5.4 + pushZ);
    groupRef.current.rotation.x = -0.06;
    groupRef.current.rotation.y = Math.sin(t * 1.6) * 0.14;

    if (t >= 2.60 && !finishedRef.current) {
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
      <lineSegments geometry={edgeGeom} material={edgeMat} scale={0.85} />
      <pointLight position={[0, 2.3, 3.2]} color="#f4f0e8" intensity={24} distance={12} decay={1.4} />
      <pointLight position={[0, -1.9, 2.6]} color="#ff3352" intensity={34} distance={12} decay={1.4} />
    </group>
  );
}
