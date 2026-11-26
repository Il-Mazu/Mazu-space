import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACKS } from '../data/tracks.js';
import { useAudioState } from '../audio/AudioEngine.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { naveFloorY } from '../scenes/GothicNave.jsx';
import Oscilloscope3D from '../scenes/Oscilloscope3D.jsx';
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

export default function MusicChapel({ isMobile }) {
  const audio = useAudioState();
  const { stoneBump, chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const vinylTex = useMemo(() => createVinylTexture(), []);
  const coverCacheRef = useRef(new Map());
  const labelMatRef = useRef(null);
  const discRef = useRef(null);
  const armRef = useRef(null);

  useEffect(() => {
    const track = TRACKS[audio.currentTrack];
    if (!track?.cover || !labelMatRef.current) return;

    const cached = coverCacheRef.current.get(track.cover);
    if (cached) {
      labelMatRef.current.map = cached;
      labelMatRef.current.needsUpdate = true;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(track.cover, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      coverCacheRef.current.set(track.cover, tex);
      if (labelMatRef.current) {
        labelMatRef.current.map = tex;
        labelMatRef.current.needsUpdate = true;
      }
    });
  }, [audio.currentTrack]);

  useEffect(() => () => {
    vinylTex.dispose();
    coverCacheRef.current.forEach((tex) => tex.dispose());
    coverCacheRef.current.clear();
  }, [vinylTex]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (discRef.current && audio.playing && !sceneBus.reducedMotion) {
      discRef.current.rotation.y -= dt * (1.2 + sceneBus.audioMetrics.bass * 0.35);
    }
    if (armRef.current) {
      const targetArm = audio.playing ? -0.34 : 0.06;
      armRef.current.rotation.y = THREE.MathUtils.damp(armRef.current.rotation.y, targetArm, 6.0, dt);
    }
  });

  const floorY = naveFloorY(-64);
  const altarPos = isMobile ? [0, floorY + 1.45, -64] : [1.18, floorY + 0.25, -64];
  const altarScale = isMobile ? 0.68 : 1.04;

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
              <meshStandardMaterial ref={labelMatRef} color="#ffffff" roughness={0.45} metalness={0.15} />
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

      {/* Wide 3D neon waveform oscilloscope spanning the arch */}
      <Oscilloscope3D
        position={[0, floorY + (isMobile ? 3.95 : 2.95), -67.8]}
        width={isMobile ? 5.6 : 8.4}
        height={isMobile ? 1.5 : 2.1}
      />
    </group>
  );
}
