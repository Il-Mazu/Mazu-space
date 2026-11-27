import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANGEL_ART, CROSS_SWORD_ART } from '../data/ascii.js';
import { getProceduralTextures } from '../scenes/proceduralTextures.js';
import { sceneBus } from '../state/sceneBus.js';
import { MONO, useFontsReady } from '../utils/fonts.js';

// Each Braille glyph (0x2800..0x28FF) encodes a 2x4 sub-pixel bitmask.
function buildAngelPoints() {
  const lines = ANGEL_ART.split('\n');
  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));
  const coords = [];
  const colors = [];

  const dotOffsets = [
    [0, 0, 0x01], [0, 1, 0x02], [0, 2, 0x04], [0, 3, 0x40],
    [1, 0, 0x08], [1, 1, 0x10], [1, 2, 0x20], [1, 3, 0x80],
  ];

  const bone = new THREE.Color(1.05, 1.02, 0.95);
  const crimson = new THREE.Color(1.65, 0.16, 0.28);

  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      const code = line.charCodeAt(c);
      if (code < 0x2801 || code > 0x28ff) continue;
      const mask = code - 0x2800;

      for (let d = 0; d < 8; d++) {
        const [dx, dy, bit] = dotOffsets[d];
        if ((mask & bit) === 0) continue;
        const gx = (c + dx * 0.45) / cols - 0.5;
        const gy = 0.5 - (r + dy * 0.24) / rows;
        const distEdge = Math.hypot(gx * 1.4, gy - 0.05);
        const zCurve = -distEdge * distEdge * 0.45;

        coords.push(gx * 2.55, gy * 3.1, zCurve);
        const edgeMix = THREE.MathUtils.smoothstep(distEdge, 0.25, 0.65);
        const col = bone.clone().lerp(crimson, edgeMix * 0.65);
        colors.push(col.r, col.g, col.b);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

function buildCrossStoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#121216';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = 'rgba(255, 51, 82, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 484, 228);

  ctx.font = `13px ${MONO}`;
  ctx.fillStyle = '#e9e4da';
  const lines = CROSS_SWORD_ART.split('\n');
  lines.forEach((line, idx) => {
    ctx.fillText(line, 36, 44 + idx * 16);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function AboutChapel({ chapel, isMobile }) {
  const { stoneBump, chromeRoughness, ashSprite } = useMemo(() => getProceduralTextures(), []);
  const angelGeo = useMemo(() => buildAngelPoints(), []);
  const fontsReady = useFontsReady();
  const crossTex = useMemo(() => buildCrossStoneTexture(), [fontsReady]);
  const angelRef = useRef(null);

  useEffect(() => () => {
    angelGeo.dispose();
    crossTex.dispose();
  }, [angelGeo, crossTex]);

  useFrame((state) => {
    if (!angelRef.current || sceneBus.reducedMotion) return;
    const t = state.clock.elapsedTime;
    angelRef.current.position.y = 2.0 + Math.sin(t * 1.1) * 0.08;
    angelRef.current.rotation.y = -0.18 + Math.sin(t * 0.55) * 0.08 + sceneBus.pointer.x * 0.1;
  });

  const { floorY, z } = chapel;
  // On mobile the text takes the lower half of the screen, so the altar sits higher.
  const pos = isMobile ? [1.1, floorY + 3.3, z + 0.2] : [1.25, floorY, z];
  const scale = isMobile ? 0.45 : 1;

  return (
    <group position={pos} scale={scale}>
      {/* Stepped dark basalt altar base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[3.4, 0.4, 2.1]} />
        <meshStandardMaterial color="#18181e" metalness={0.35} roughness={0.72} bumpMap={stoneBump} bumpScale={0.08} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.7, 0.68, 1.5]} />
        <meshStandardMaterial color="#1d1d24" metalness={0.4} roughness={0.62} bumpMap={stoneBump} bumpScale={0.07} />
      </mesh>

      {/* Recessed HDR crimson under-slit */}
      <mesh position={[0, 0.41, 0.76]}>
        <boxGeometry args={[2.55, 0.04, 0.04]} />
        <meshBasicMaterial color={[1.8, 0.12, 0.25]} toneMapped={false} />
      </mesh>

      {/* Etched cross-sword relief slab */}
      <mesh position={[0, 0.72, 0.76]}>
        <planeGeometry args={[2.45, 0.58]} />
        <meshStandardMaterial map={crossTex} roughness={0.55} metalness={0.25} />
      </mesh>

      {/* Flanking chrome altar rails */}
      <mesh position={[-1.45, 1.05, 0]}>
        <boxGeometry args={[0.14, 1.35, 0.14]} />
        <meshStandardMaterial color="#4e4e5c" metalness={0.96} roughness={0.16} roughnessMap={chromeRoughness} />
      </mesh>
      <mesh position={[1.45, 1.05, 0]}>
        <boxGeometry args={[0.14, 1.35, 0.14]} />
        <meshStandardMaterial color="#4e4e5c" metalness={0.96} roughness={0.16} roughnessMap={chromeRoughness} />
      </mesh>

      {/* Suspended luminous 3D Braille Angel */}
      <points ref={angelRef} geometry={angelGeo} position={[0, 2.0, 0]} rotation={[0, -0.18, 0]}>
        <pointsMaterial
          size={0.062}
          map={ashSprite}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
