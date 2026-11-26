import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAMES } from '../data/games.js';
import covers from 'virtual:game-covers';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';
import { MONO, useFontsReady } from '../utils/fonts.js';

function makePlaqueTexture(game) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, 256, 360);

  ctx.strokeStyle = game.category === 'favorites' ? '#ff3352' : '#50505a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 340);

  ctx.fillStyle = '#ff3352';
  ctx.font = `16px ${MONO}`;
  ctx.fillText(game.category === 'favorites' ? '♰ relic' : '♰ active', 24, 44);

  ctx.fillStyle = '#e9e4da';
  ctx.font = `20px ${MONO}`;
  const words = game.name.split(' ');
  let line = '';
  let y = 128;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > 16) {
      ctx.fillText(line, 24, y);
      line = w;
      y += 28;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 24, y);

  if (game.vote !== undefined) {
    ctx.fillStyle = '#ff3352';
    ctx.font = `64px ${MONO}`;
    ctx.fillText(String(game.vote), 24, 308);
    ctx.fillStyle = '#80808a';
    ctx.font = `18px ${MONO}`;
    ctx.fillText('/100', 24 + ctx.measureText(String(game.vote)).width + 30, 308);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function RelicCase({ game, position, rotationY, textures, loadedEnabled, onOpenCrypt }) {
  const groupRef = useRef(null);
  const fontsReady = useFontsReady();
  const plaqueTex = useMemo(() => makePlaqueTexture(game), [game, fontsReady]);
  const [coverTex, setCoverTex] = useState(null);

  useEffect(() => {
    const url = covers[game.name]?.background_image;
    if (!loadedEnabled || !url) return undefined;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        setCoverTex(tex);
      },
      undefined,
      () => {},
    );
    return () => { cancelled = true; };
  }, [loadedEnabled, game.name]);

  useEffect(() => () => plaqueTex.dispose(), [plaqueTex]);
  useEffect(() => () => {
    if (coverTex) coverTex.dispose();
  }, [coverTex]);

  useFrame((state) => {
    if (!groupRef.current || sceneBus.reducedMotion) return;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.1 + position[0]) * 0.08;
  });

  const activeMap = coverTex || plaqueTex;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={onOpenCrypt ? (e) => { e.stopPropagation(); onOpenCrypt(); } : undefined}
      onPointerOver={onOpenCrypt ? () => { document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={onOpenCrypt ? () => { document.body.style.cursor = ''; } : undefined}
    >
      <mesh>
        <boxGeometry args={[0.92, 1.28, 0.1]} />
        <meshStandardMaterial
          color="#3a3a46"
          metalness={0.94}
          roughness={0.2}
          roughnessMap={textures.chromeRoughness}
        />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[0.82, 1.18]} />
        <meshStandardMaterial key={activeMap.uuid} map={activeMap} roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[0.94, 0.025, 0.12]} />
        <meshBasicMaterial color={[1.6, 0.12, 0.25]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function makePlayingLabelTexture(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#09090c';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#ff3352';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 88);
  ctx.fillStyle = '#ff3352';
  ctx.font = `14px ${MONO}`;
  ctx.fillText('♰ playing', 16, 28);
  ctx.fillStyle = '#e9e4da';
  ctx.font = `18px ${MONO}`;
  ctx.fillText(name.slice(0, 18), 16, 62);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function PlayingBeacon({ game, position }) {
  const fontsReady = useFontsReady();
  const tex = useMemo(() => makePlayingLabelTexture(game.name), [game.name, fontsReady]);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.30, 24]} />
        <meshBasicMaterial color={[1.6, 0.12, 0.24]} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.28, -0.08]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.84, 0.32]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </group>
  );
}

export default function GamesChapel({ chapel, isMobile, onOpenCrypt }) {
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);
  const textures = useMemo(() => getProceduralTextures(), []);
  const favorites = useMemo(() => GAMES.filter((g) => g.category === 'favorites'), []);
  const playing = useMemo(() => GAMES.filter((g) => g.category === 'playing'), []);
  const loadedRef = useRef(false);
  const markersRef = useRef(null);

  useFrame((state) => {
    if (!loadedRef.current && sceneBus.activeSection >= chapel.index - 1) {
      loadedRef.current = true;
    }
    if (markersRef.current && !sceneBus.reducedMotion) {
      const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 3.8) * 0.6;
      markersRef.current.children.forEach((group) => {
        const ring = group.children?.[0];
        if (ring?.material) ring.material.color.setRGB(pulse, 0.08 * pulse, 0.18 * pulse);
      });
    }
  });

  const { floorY, z: chapelZ } = chapel;
  const centerX = isMobile ? 0 : 1.35;

  return (
    <group>
      {/* Curved upper arc of 8 Favorite Relics */}
      {favorites.map((game, i) => {
        const angle = ((i / (favorites.length - 1)) - 0.5) * 1.15;
        const rowOffset = i % 2 === 0 ? 3.15 : 1.85;
        const radius = isMobile ? 2.6 : 3.8;
        const x = centerX + Math.sin(angle) * radius;
        const z = chapelZ - 0.5 - (1 - Math.cos(angle)) * 2.2;
        const y = floorY + rowOffset + (isMobile ? 1.15 : 0);
        return (
          <RelicCase
            key={game.name}
            game={game}
            position={[x, y, z]}
            rotationY={-angle * 0.75}
            textures={textures}
            loadedEnabled
            onOpenCrypt={onOpenCrypt}
          />
        );
      })}

      {/* Currently Playing podium + pulsing crimson markers */}
      <group position={[centerX, floorY + (isMobile ? 1.35 : 0.2), chapelZ + 3.2]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[3.1, 0.6, 1.1]} />
          <meshStandardMaterial color="#18181f" metalness={0.4} roughness={0.68} bumpMap={textures.stoneBump} bumpScale={0.07} />
        </mesh>
        <group ref={markersRef}>
          {playing.map((game, i) => (
            <PlayingBeacon key={game.name} game={game} position={[(i - 1) * 0.96, 0.62, 0]} />
          ))}
        </group>
      </group>
    </group>
  );
}
