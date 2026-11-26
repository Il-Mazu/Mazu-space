import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createEyeMaterial } from '../shaders/eyeShader.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';

function buildCrownArchGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-2.06, 0);
  s.lineTo(-2.06, 0.25);
  s.quadraticCurveTo(-1.35, 0.85, 0, 1.15);
  s.quadraticCurveTo(1.35, 0.85, 2.06, 0.25);
  s.lineTo(2.06, 0);
  s.lineTo(1.72, 0);
  s.quadraticCurveTo(1.12, 0.56, 0, 0.82);
  s.quadraticCurveTo(-1.12, 0.56, -1.72, 0);
  s.closePath();

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
}

function buildFinialCrossGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.04, -0.18);
  s.lineTo(0.04, -0.18);
  s.lineTo(0.04, 0.14);
  s.lineTo(0.24, 0.14);
  s.lineTo(0.24, 0.21);
  s.lineTo(0.04, 0.21);
  s.lineTo(0.04, 0.34);
  s.lineTo(0.15, 0.34);
  s.lineTo(0.15, 0.40);
  s.lineTo(0.04, 0.40);
  s.lineTo(0.04, 0.54);
  s.lineTo(-0.04, 0.54);
  s.lineTo(-0.04, 0.40);
  s.lineTo(-0.15, 0.40);
  s.lineTo(-0.15, 0.34);
  s.lineTo(-0.04, 0.34);
  s.lineTo(-0.04, 0.21);
  s.lineTo(-0.24, 0.21);
  s.lineTo(-0.24, 0.14);
  s.lineTo(-0.04, 0.14);
  s.closePath();

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
}

export default function HeroEye({ position = [1.0, 1.65, -0.5], scale = 1, spectral = false, isMobile = false }) {
  const groupRef = useRef(null);
  const { chromeRoughness } = useMemo(() => getProceduralTextures(), []);

  const crownGeom = useMemo(() => buildCrownArchGeometry(), []);
  const crossGeom = useMemo(() => buildFinialCrossGeometry(), []);

  const fallbackTex = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/wallpapers/eye.webp');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  const eyeMaterial = useMemo(() => {
    const mat = createEyeMaterial(fallbackTex);
    mat.uniforms.uSpectral.value = spectral ? 1.0 : 0.0;
    return mat;
  }, [fallbackTex, spectral]);

  useEffect(() => {
    if (sceneBus.reducedMotion) return undefined;

    const video = document.createElement('video');
    video.src = '/wallpapers/eye.mp4';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let videoTex = null;
    const onReady = () => {
      if (!videoTex) {
        videoTex = new THREE.VideoTexture(video);
        videoTex.minFilter = THREE.LinearFilter;
        videoTex.magFilter = THREE.NearestFilter;
        videoTex.colorSpace = THREE.SRGBColorSpace;
        eyeMaterial.uniforms.uMap.value = videoTex;
      }
      eyeMaterial.uniforms.uHasVideo.value = 1.0;
    };

    video.addEventListener('canplay', onReady, { once: true });
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('canplay', onReady);
      video.pause();
      video.src = '';
      if (videoTex) videoTex.dispose();
    };
  }, [eyeMaterial]);

  useEffect(() => () => {
    fallbackTex.dispose();
    eyeMaterial.dispose();
    crownGeom.dispose();
    crossGeom.dispose();
  }, [fallbackTex, eyeMaterial, crownGeom, crossGeom]);

  const blinkRef = useRef({ timer: 3.5, close: 0 });
  const awakeRef = useRef(spectral ? 0 : (sceneBus.bootPhase === 'done' ? 0 : 1));

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const { bass } = sceneBus.audioMetrics;

    eyeMaterial.uniforms.uTime.value = t;
    eyeMaterial.uniforms.uAudioBass.value = bass;

    if (!sceneBus.reducedMotion) {
      eyeMaterial.uniforms.uGaze.value.x = THREE.MathUtils.damp(
        eyeMaterial.uniforms.uGaze.value.x,
        sceneBus.pointer.x,
        5.0,
        dt,
      );
      eyeMaterial.uniforms.uGaze.value.y = THREE.MathUtils.damp(
        eyeMaterial.uniforms.uGaze.value.y,
        sceneBus.pointer.y,
        5.0,
        dt,
      );
    }

    if (spectral) {
      eyeMaterial.uniforms.uClose.value = sceneBus.eyeClose;
      eyeMaterial.uniforms.uPowerOn.value = 1.0;
    } else {
      eyeMaterial.uniforms.uPowerOn.value = sceneBus.bootPhase === 'done' ? 1.0 : sceneBus.eyePower;
      const eyeShouldOpen = sceneBus.bootPhase === 'done' || sceneBus.eyePower > 0.58;
      const targetAwake = eyeShouldOpen ? 0 : 1;
      awakeRef.current = THREE.MathUtils.damp(awakeRef.current, targetAwake, 4.2, dt);

      let blinkVal = 0;
      if (!sceneBus.reducedMotion && sceneBus.bootPhase === 'done') {
        const b = blinkRef.current;
        b.timer -= dt;
        if (b.timer <= 0) {
          b.timer = 4.2 + Math.random() * 4.5;
          b.close = 1.0;
        }
        b.close = THREE.MathUtils.damp(b.close, 0, 9.0, dt);
        blinkVal = b.close > 0.08 ? b.close : 0;
      }
      eyeMaterial.uniforms.uClose.value = Math.max(awakeRef.current, blinkVal);
    }

    if (groupRef.current && !sceneBus.reducedMotion) {
      const targetRy = (spectral ? 0 : -0.14) + sceneBus.pointer.x * 0.22;
      const targetRx = -sceneBus.pointer.y * 0.14;
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRy, 4.0, dt);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRx, 4.0, dt);
      groupRef.current.position.y = position[1] + Math.sin(t * 0.85) * 0.08;
    }
  });

  const pos = isMobile ? [0, position[1] + 0.55, position[2]] : position;
  const s = isMobile ? scale * 0.72 : scale;

  return (
    <group ref={groupRef} position={pos} scale={s}>
      {/* Curved square CRT Eye Screen */}
      <mesh position={[0, 0, 0.10]} material={eyeMaterial}>
        <planeGeometry args={[3.44, 3.44, 24, 24]} />
      </mesh>

      {/* Razor-thin recessed blood-red slit framing the glass */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.50, 3.50]} />
        <meshBasicMaterial color={[1.45, 0.06, 0.16]} toneMapped={false} />
      </mesh>

      {/* Heavy dark-chrome CRT chassis housing */}
      <mesh position={[0, 0, -0.24]}>
        <boxGeometry args={[3.9, 3.9, 0.56]} />
        <meshStandardMaterial
          color="#1e1e26"
          metalness={0.88}
          roughness={0.26}
          roughnessMap={chromeRoughness}
        />
      </mesh>

      {/* Stepped chrome frame rails */}
      <mesh position={[0, 1.94, 0.08]}>
        <boxGeometry args={[4.12, 0.22, 0.24]} />
        <meshStandardMaterial color="#585866" metalness={0.96} roughness={0.14} />
      </mesh>
      <mesh position={[0, -1.94, 0.08]}>
        <boxGeometry args={[4.12, 0.22, 0.24]} />
        <meshStandardMaterial color="#585866" metalness={0.96} roughness={0.14} />
      </mesh>
      <mesh position={[-1.94, 0, 0.08]}>
        <boxGeometry args={[0.22, 3.96, 0.24]} />
        <meshStandardMaterial color="#585866" metalness={0.96} roughness={0.14} />
      </mesh>
      <mesh position={[1.94, 0, 0.08]}>
        <boxGeometry args={[0.22, 3.96, 0.24]} />
        <meshStandardMaterial color="#585866" metalness={0.96} roughness={0.14} />
      </mesh>

      {/* Sculpted Gothic Arch Crown + Patriarchal Cross Finial */}
      <mesh geometry={crownGeom} position={[0, 1.96, -0.02]}>
        <meshStandardMaterial color="#555562" metalness={0.95} roughness={0.16} roughnessMap={chromeRoughness} />
      </mesh>
      <mesh geometry={crossGeom} position={[0, 3.12, 0.06]}>
        <meshStandardMaterial color="#727282" metalness={0.98} roughness={0.12} />
      </mesh>

      {/* Corner Iron Rivets */}
      {[[-1.92, 1.92], [1.92, 1.92], [-1.92, -1.92], [1.92, -1.92]].map(([rx, ry], i) => (
        <mesh key={i} position={[rx, ry, 0.20]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#686876" metalness={0.98} roughness={0.12} />
        </mesh>
      ))}
    </group>
  );
}
