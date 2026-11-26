import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WING_ART } from '../data/ascii.js';
import { PRESENCE } from '../data/content.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';
import { MONO, useFontsReady } from '../utils/fonts.js';

// Always the static png: a texture can't animate a gif anyway.
function avatarTextureUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
}

function useAvatarTexture(url) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    let loaded = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      if (cancelled) {
        t.dispose();
        return;
      }
      loaded = t;
      setTex(t);
    });
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url]);
  return tex;
}

function buildWingTexture(mirrored = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);

  if (mirrored) {
    ctx.translate(512, 0);
    ctx.scale(-1, 1);
  }

  ctx.font = `20px ${MONO}`;
  ctx.fillStyle = '#e9e4da';
  ctx.shadowColor = '#ff3352';
  ctx.shadowBlur = 10;

  const lines = WING_ART.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 24, 48 + i * 24);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function PresenceChapel({ chapel, isMobile, lanyard }) {
  const { chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const fontsReady = useFontsReady();
  const leftWingTex = useMemo(() => buildWingTexture(false), [fontsReady]);
  const rightWingTex = useMemo(() => buildWingTexture(true), [fontsReady]);

  const haloMatRef = useRef(null);
  const innerRingMatRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);
  const haloRef = useRef(null);
  const targetColor = useMemo(() => new THREE.Color('#8a8a94'), []);

  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const statusColor = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;
  const avatarTex = useAvatarTexture(avatarTextureUrl(user));

  useEffect(() => {
    sceneBus.presenceColor = statusColor;
  }, [statusColor]);

  useEffect(() => () => {
    leftWingTex.dispose();
    rightWingTex.dispose();
  }, [leftWingTex, rightWingTex]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    targetColor.set(sceneBus.presenceColor || '#8a8a94');

    if (haloMatRef.current) {
      haloMatRef.current.color.lerp(targetColor, Math.min(1, dt * 4));
      haloMatRef.current.emissive.lerp(targetColor, Math.min(1, dt * 4));
    }
    if (innerRingMatRef.current) {
      innerRingMatRef.current.emissive.lerp(targetColor, Math.min(1, dt * 4));
    }

    if (!sceneBus.reducedMotion) {
      const flap = Math.sin(t * 1.1) * 0.08;
      if (leftWingRef.current) leftWingRef.current.rotation.y = 0.24 + flap;
      if (rightWingRef.current) rightWingRef.current.rotation.y = -0.24 - flap;
      if (haloRef.current) {
        haloRef.current.rotation.z = t * 0.28;
        haloRef.current.position.y = 1.68 + Math.sin(t * 1.4) * 0.06;
      }
    }
  });

  // Floats above the turntable altar of the same chapel.
  const { floorY, z } = chapel;
  const pos = [0, floorY + (isMobile ? 3.5 : 3.25), z - 0.6];
  const scale = isMobile ? 0.7 : 0.82;

  return (
    <group position={pos} scale={scale}>
      {/* Central dark-chrome Discord medallion */}
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[0.88, 0.08, 16, 48]} />
        <meshStandardMaterial color="#585866" metalness={0.97} roughness={0.14} roughnessMap={chromeRoughness} />
      </mesh>
      <mesh position={[0, 0.55, 0.02]}>
        <torusGeometry args={[0.74, 0.025, 12, 48]} />
        <meshStandardMaterial
          ref={innerRingMatRef}
          color="#16161a"
          emissive="#8a8a94"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.55, -0.04]}>
        <circleGeometry args={[0.76, 36]} />
        <meshStandardMaterial color="#0b0b0e" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Discord avatar set into the medallion */}
      <mesh position={[0, 0.55, 0.0]}>
        <circleGeometry args={[0.7, 48]} />
        <meshBasicMaterial key={avatarTex?.uuid || 'none'} map={avatarTex} color={avatarTex ? '#d8d2c8' : '#120a0d'} />
      </mesh>

      {/* Live status halo ring hovering above */}
      <group ref={haloRef} position={[0, 1.68, 0]} rotation={[Math.PI * 0.43, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.72, 0.036, 12, 48]} />
          <meshStandardMaterial
            ref={haloMatRef}
            color="#8a8a94"
            emissive="#8a8a94"
            emissiveIntensity={1.85}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Left & Right 3D Wing Art panels flanking the medallion */}
      <mesh ref={leftWingRef} position={[-1.78, 0.72, -0.14]} rotation={[0, 0.24, 0]}>
        <planeGeometry args={[2.35, 2.35]} />
        <meshBasicMaterial map={leftWingTex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWingRef} position={[1.78, 0.72, -0.14]} rotation={[0, -0.24, 0]}>
        <planeGeometry args={[2.35, 2.35]} />
        <meshBasicMaterial map={rightWingTex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

    </group>
  );
}
