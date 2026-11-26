import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { WING_ART } from '../data/ascii.js';
import { PRESENCE } from '../data/content.js';
import { trackUrl } from '../music/useMusic.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { createDuotoneMaterial, setDuotoneMap } from '../shaders/duotoneMaterial.js';
import { sceneBus } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import { MONO, useFontsReady } from '../utils/fonts.js';
import useRemoteTexture from '../utils/useRemoteTexture.js';

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wingTexture(mirrored) {
  return canvasTexture(512, 512, (ctx) => {
    if (mirrored) {
      ctx.translate(512, 0);
      ctx.scale(-1, 1);
    }
    ctx.font = `20px ${MONO}`;
    ctx.fillStyle = '#e9e4da';
    ctx.shadowColor = '#ff3352';
    ctx.shadowBlur = 10;
    WING_ART.split('\n').forEach((line, i) => ctx.fillText(line, 24, 48 + i * 24));
  });
}

function vinylTexture() {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#0c0c10';
    ctx.fillRect(0, 0, 512, 512);
    for (let r = 82; r < 248; r += 3) {
      const b = r % 15 === 0 ? 46 : 22 + (r % 7) * 2;
      ctx.strokeStyle = `rgb(${b},${b},${b + 4})`;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

// Label for when there is no cover: a stamped red relic, never a broken image.
function noCoverTexture() {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = '#2a0509';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#8a0f1f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e9e4da';
    ctx.textAlign = 'center';
    ctx.font = `92px ${MONO}`;
    ctx.fillText('♰', 128, 150);
    ctx.font = `18px ${MONO}`;
    ctx.fillStyle = '#ff3352';
    ctx.fillText('no cover', 128, 196);
  });
}

function carvedTexture(stats) {
  return canvasTexture(1024, 224, (ctx, w, h) => {
    ctx.fillStyle = '#121216';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6e6870';
    ctx.font = `30px ${MONO}`;
    if (stats) {
      const artists = stats.topArtists.slice(0, 4).map((a) => a.name.toLowerCase()).join('  ♰  ');
      ctx.fillText(artists, w / 2, 86, w - 80);
      ctx.fillStyle = '#8a0f1f';
      ctx.font = `26px ${MONO}`;
      ctx.fillText(`${stats.scrobbles.toLocaleString('en-US')} scrobbles`, w / 2, 150);
    } else {
      ctx.fillText('never fade away', w / 2, 124);
    }
  });
}

function HaloShrine({ lanyard, isMobile, offset }) {
  const fontsReady = useFontsReady();
  const { chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const leftWingTex = useMemo(() => wingTexture(false), [fontsReady]);
  const rightWingTex = useMemo(() => wingTexture(true), [fontsReady]);
  const avatarMat = useMemo(() => createDuotoneMaterial(), []);
  const haloMatRef = useRef(null);
  const glowMatRef = useRef(null);
  const haloRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);
  const wingMatRefs = [useRef(null), useRef(null)];
  const color = useMemo(() => new THREE.Color(), []);

  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const awake = status !== 'offline';
  const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256` : null;
  const avatarTex = useRemoteTexture(avatarUrl);

  useEffect(() => setDuotoneMap(avatarMat, avatarTex), [avatarMat, avatarTex]);
  useEffect(() => () => {
    leftWingTex.dispose();
    rightWingTex.dispose();
  }, [leftWingTex, rightWingTex]);
  useEffect(() => () => avatarMat.dispose(), [avatarMat]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const still = sceneBus.reducedMotion;
    const k = Math.min(1, dt * 3);

    // Unlit and still when offline; a slow breath otherwise.
    const pulse = awake && !still ? 1 + Math.sin(t * 1.6) * 0.18 : 1;
    const strength = (awake ? 2.4 : 0.22) * pulse;
    color.set(PRESENCE.statusColors[status] || PRESENCE.statusColors.offline).multiplyScalar(strength);
    haloMatRef.current?.color.lerp(color, k);
    if (glowMatRef.current) {
      glowMatRef.current.opacity = THREE.MathUtils.lerp(glowMatRef.current.opacity, awake ? 0.22 * pulse : 0.03, k);
      glowMatRef.current.color.lerp(color, k);
    }

    avatarMat.uniforms.uDim.value = THREE.MathUtils.lerp(avatarMat.uniforms.uDim.value, awake ? 1 : 0.14, k);

    const wingOpacity = awake ? 1 : 0.16;
    wingMatRefs.forEach((r) => {
      if (r.current) r.current.opacity = THREE.MathUtils.lerp(r.current.opacity, wingOpacity, k);
    });
    const flap = awake && !still ? Math.sin(t * 1.1) * 0.08 : 0;
    const droop = awake ? 0 : 0.32;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = 0.24 + flap;
      leftWingRef.current.rotation.z = THREE.MathUtils.lerp(leftWingRef.current.rotation.z, droop, k);
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -0.24 - flap;
      rightWingRef.current.rotation.z = THREE.MathUtils.lerp(rightWingRef.current.rotation.z, -droop, k);
    }
    if (haloRef.current && !still) {
      haloRef.current.position.y = 1.62 + (awake ? Math.sin(t * 1.4) * 0.05 : 0);
    }
  });

  return (
    <group position={[offset, isMobile ? 3.4 : 3.2, -0.6]} scale={isMobile ? 0.7 : 0.82}>
      <mesh position={[0, 0.55, -0.02]}>
        <torusGeometry args={[0.8, 0.07, 16, 64]} />
        <meshStandardMaterial color="#4a4a56" metalness={0.97} roughness={0.16} roughnessMap={chromeRoughness} />
      </mesh>
      <mesh position={[0, 0.55, -0.04]} material={avatarMat}>
        <circleGeometry args={[0.76, 64]} />
      </mesh>

      {/* Halo: tilted so it reads as a ring above the head, not a flat ellipse */}
      <group ref={haloRef} position={[0, 1.62, 0]} rotation={[Math.PI / 2 - 0.32, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.66, 0.045, 24, 96]} />
          <meshBasicMaterial ref={haloMatRef} color="#222" toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.66, 0.16, 16, 96]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color="#222"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh ref={leftWingRef} position={[-1.7, 0.72, -0.14]} rotation={[0, 0.24, 0]}>
        <planeGeometry args={[2.35, 2.35]} />
        <meshBasicMaterial ref={wingMatRefs[0]} map={leftWingTex} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWingRef} position={[1.7, 0.72, -0.14]} rotation={[0, -0.24, 0]}>
        <planeGeometry args={[2.35, 2.35]} />
        <meshBasicMaterial ref={wingMatRefs[1]} map={rightWingTex} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function TurntableAltar({ music, isMobile, offset }) {
  const fontsReady = useFontsReady();
  const { stoneBump, chromeRoughness } = useMemo(() => getProceduralTextures(), []);
  const vinylTex = useMemo(() => vinylTexture(), []);
  const noCoverTex = useMemo(() => noCoverTexture(), [fontsReady]);
  const carvedTex = useMemo(() => carvedTexture(music.stats), [music.stats, fontsReady]);
  const labelMat = useMemo(() => createDuotoneMaterial(), []);
  const discRef = useRef(null);
  const armRef = useRef(null);

  const shown = music.now || music.lastHeard;
  const artTex = useRemoteTexture(shown?.art || null);

  useEffect(() => setDuotoneMap(labelMat, artTex || noCoverTex), [labelMat, artTex, noCoverTex]);
  useEffect(() => () => {
    vinylTex.dispose();
    labelMat.dispose();
  }, [vinylTex, labelMat]);
  useEffect(() => () => noCoverTex.dispose(), [noCoverTex]);
  useEffect(() => () => carvedTex.dispose(), [carvedTex]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const listening = music.listening;
    if (discRef.current && listening && !sceneBus.reducedMotion) {
      // 33 rpm
      discRef.current.rotation.y -= dt * 3.46;
    }
    if (armRef.current) {
      // swings onto the record while listening, lifts and parks when not
      armRef.current.rotation.y = THREE.MathUtils.damp(armRef.current.rotation.y, listening ? -0.36 : 0.12, 4, dt);
      armRef.current.rotation.z = THREE.MathUtils.damp(armRef.current.rotation.z, listening ? 0 : 0.12, 4, dt);
    }
    labelMat.uniforms.uDim.value = THREE.MathUtils.damp(labelMat.uniforms.uDim.value, listening ? 1 : 0.38, 4, dt);
  });

  return (
    <group position={[offset, isMobile ? 0.9 : 0.25, 0.8]} scale={isMobile ? 0.68 : 0.92}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[2.9, 0.9, 2.3]} />
        <meshStandardMaterial color="#17171d" metalness={0.38} roughness={0.68} bumpMap={stoneBump} bumpScale={0.08} />
      </mesh>
      {/* top artists and scrobble count carved into the base */}
      <mesh position={[0, 0.42, 1.152]}>
        <planeGeometry args={[2.7, 0.59]} />
        <meshStandardMaterial map={carvedTex} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.45, 0.22, 1.95]} />
        <meshStandardMaterial color="#282832" metalness={0.86} roughness={0.22} roughnessMap={chromeRoughness} />
      </mesh>
      <mesh position={[0, 0.88, 0.98]}>
        <boxGeometry args={[2.25, 0.035, 0.04]} />
        <meshBasicMaterial color={music.listening ? [1.8, 0.14, 0.28] : [0.5, 0.04, 0.08]} toneMapped={false} />
      </mesh>

      <group position={[0, 1.38, 0.1]} rotation={[0.42, -0.18, 0]}>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[2.2, 0.1, 1.85]} />
          <meshStandardMaterial color="#141419" metalness={0.82} roughness={0.25} />
        </mesh>
        <group ref={discRef} position={[-0.14, 0.04, 0]}>
          <mesh>
            <cylinderGeometry args={[0.84, 0.84, 0.024, 64]} />
            <meshStandardMaterial map={vinylTex} metalness={0.45} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} material={labelMat}>
            <circleGeometry args={[0.36, 48]} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
            <meshStandardMaterial color="#b9b9c2" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>

        <group ref={armRef} position={[0.84, 0.08, -0.58]} rotation={[0, 0.12, 0.12]}>
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
  );
}

// Angles (around the altar, 0 = toward the camera) for up to 8 candles,
// alternating sides so rank 1 and 2 sit closest to the front.
const CANDLE_ANGLES = [40, -40, 72, -72, 106, -106, 140, -140].map((d) => (d * Math.PI) / 180);

function Candle({ track, rank, maxPlays, position }) {
  const [hovered, setHovered] = useState(false);
  // drei <Html> would otherwise mount into the event source (document.body)
  // and be placed against the scrolled page instead of the fixed canvas.
  const gl = useThree((st) => st.gl);
  const portal = useMemo(() => ({ current: gl.domElement.parentNode }), [gl]);
  const flameRef = useRef(null);
  const haloRef = useRef(null);
  const height = 0.22 + (track.plays / Math.max(1, maxPlays)) * 0.42;
  const seed = rank * 1.7;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const still = sceneBus.reducedMotion;
    // slow shared breath while I'm listening; no beat sync, there is no stream to sync to
    const breath = sceneBus.listening && !still ? 1 + Math.sin(t * 2.2) * 0.12 : 1;
    const flicker = still ? 1 : 1 + Math.sin(t * 11 + seed) * 0.06 + Math.sin(t * 23 + seed * 3) * 0.04;
    const s = (hovered ? 1.6 : 1) * flicker * breath;
    if (flameRef.current) flameRef.current.scale.set(s, s * 1.15, s);
    if (haloRef.current) haloRef.current.material.opacity = (hovered ? 0.4 : 0.12) * breath;
  });

  const open = () => {
    playClickHit();
    window.open(trackUrl(track), '_blank', 'noopener,noreferrer');
  };

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.04, 16]} />
        <meshStandardMaterial color="#2a2a32" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.04 + height / 2, 0]}>
        <cylinderGeometry args={[0.065, 0.07, height, 16]} />
        <meshStandardMaterial color="#c9c0b4" roughness={0.9} emissive="#3a0a10" emissiveIntensity={hovered ? 1.4 : 0.6} />
      </mesh>
      <group ref={flameRef} position={[0, 0.1 + height, 0]}>
        <mesh scale={[0.028, 0.06, 0.028]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshBasicMaterial color={[2.2, 1.9, 1.6]} toneMapped={false} />
        </mesh>
        <mesh scale={[0.05, 0.1, 0.05]} position={[0, 0.01, 0]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshBasicMaterial color={[2.4, 0.2, 0.36]} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={haloRef} position={[0, 0.1 + height, 0]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshBasicMaterial color={[1.4, 0.1, 0.2]} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* generous invisible hit area; candles are small */}
      <mesh
        position={[0, 0.4, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          playHoverTick();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.9, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {hovered && (
        <Html portal={portal} position={[0, 0.32 + height, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className="candle-label">
            <span className="candle-label-title">{track.title}</span>
            <span className="candle-label-meta">
              {track.artist} · {track.plays} {track.plays === 1 ? 'play' : 'plays'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

function VotiveRing({ music, isMobile, offset }) {
  const tracks = music.stats?.topTracks?.slice(0, 8) || [];
  const maxPlays = tracks[0]?.plays || 1;
  const rx = isMobile ? 1.6 : 2.15;
  const rz = isMobile ? 1.2 : 1.55;
  return (
    <group position={[offset, 0, 0.8]}>
      {tracks.map((track, i) => {
        const a = CANDLE_ANGLES[i];
        return (
          <Candle
            key={`${track.artist}-${track.title}`}
            track={track}
            rank={i}
            maxPlays={maxPlays}
            position={[Math.sin(a) * rx, 0, Math.cos(a) * rz]}
          />
        );
      })}
    </group>
  );
}

export default function LiveChapel({ chapel, isMobile, lanyard, music }) {
  useEffect(() => {
    sceneBus.listening = music.listening;
  }, [music.listening]);
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);

  // pushed right on desktop so the chapel text on the left has room
  const offset = isMobile ? 0 : 0.9;
  return (
    <group position={[0, chapel.floorY, chapel.z]}>
      <HaloShrine lanyard={lanyard} isMobile={isMobile} offset={offset} />
      <TurntableAltar music={music} isMobile={isMobile} offset={offset} />
      <VotiveRing music={music} isMobile={isMobile} offset={offset} />
    </group>
  );
}
