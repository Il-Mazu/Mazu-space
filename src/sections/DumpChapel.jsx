import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { images } from 'virtual:dump-images';
import { createStainedGlassMaterial } from '../shaders/stainedGlassShader.js';
import { naveFloorY } from '../scenes/GothicNave.jsx';
import { sceneBus } from '../state/sceneBus.js';

function createShardGeometry(seed, w = 1.25, h = 1.65) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const jx = (Math.sin(seed * 7.1) * 0.12);
  const jy = (Math.cos(seed * 5.3) * 0.14);

  const pts = [
    [-hw * 0.88, -hh * 0.92],
    [hw * 0.78 + jx, -hh * 0.98],
    [hw * 0.96, -hh * 0.15 + jy],
    [hw * 0.82, hh * 0.72],
    [0.05 + jx * 0.5, hh * 1.02],
    [-hw * 0.92, hh * 0.68 - jy],
    [-hw * 0.98, -hh * 0.12],
  ];

  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();

  const paneGeo = new THREE.ShapeGeometry(shape);
  // Normalize UVs cleanly to [0..1] across bounding box
  paneGeo.computeBoundingBox();
  const bb = paneGeo.boundingBox;
  const pos = paneGeo.getAttribute('position');
  const uvs = new Float32Array(pos.count * 2);
  const dx = Math.max(0.001, bb.max.x - bb.min.x);
  const dy = Math.max(0.001, bb.max.y - bb.min.y);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = (pos.getX(i) - bb.min.x) / dx;
    uvs[i * 2 + 1] = (pos.getY(i) - bb.min.y) / dy;
  }
  paneGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Dark chrome leaded frame around the shard
  const frameShape = new THREE.Shape();
  frameShape.moveTo(pts[0][0] * 1.07, pts[0][1] * 1.07);
  for (let i = 1; i < pts.length; i++) frameShape.lineTo(pts[i][0] * 1.07, pts[i][1] * 1.07);
  frameShape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(pts[0][0] * 0.99, pts[0][1] * 0.99);
  for (let i = 1; i < pts.length; i++) hole.lineTo(pts[i][0] * 0.99, pts[i][1] * 0.99);
  hole.closePath();
  frameShape.holes.push(hole);

  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  frameGeo.translate(0, 0, -0.04);

  return { paneGeo, frameGeo };
}

function Shard({ img, idx, total, position, rotationY, loadedEnabled, onSelect }) {
  const groupRef = useRef(null);
  const hoveredRef = useRef(false);
  const hoverAmtRef = useRef(0);
  const { paneGeo, frameGeo } = useMemo(() => createShardGeometry(idx + 1), [idx]);
  const material = useMemo(() => createStainedGlassMaterial(), []);
  const texRef = useRef(null);

  useEffect(() => {
    if (!loadedEnabled || texRef.current) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(img.thumb, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      texRef.current = tex;
      material.uniforms.uMap.value = tex;
      material.uniforms.uHasMap.value = 1;
    });
    return () => {
      cancelled = true;
    };
  }, [loadedEnabled, img.thumb, material]);

  useEffect(() => () => {
    paneGeo.dispose();
    frameGeo.dispose();
    material.dispose();
    if (texRef.current) texRef.current.dispose();
  }, [paneGeo, frameGeo, material]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const targetHover = hoveredRef.current ? 1 : 0;
    hoverAmtRef.current = THREE.MathUtils.damp(hoverAmtRef.current, targetHover, 8.0, dt);

    material.uniforms.uHover.value = hoverAmtRef.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    if (groupRef.current) {
      const floatY = sceneBus.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.9 + idx * 1.1) * 0.06;
      groupRef.current.position.y = position[1] + floatY;
      groupRef.current.position.z = position[2] + hoverAmtRef.current * 0.58;
      groupRef.current.rotation.y = rotationY + (hoveredRef.current ? sceneBus.pointer.x * 0.12 : 0);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh
        geometry={paneGeo}
        material={material}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(idx);
        }}
      />
      <mesh geometry={frameGeo}>
        <meshStandardMaterial color="#464652" metalness={0.96} roughness={0.18} />
      </mesh>
    </group>
  );
}

export default function DumpChapel({ isMobile, onOpenLightbox }) {
  const [loadedEnabled, setLoadedEnabled] = useState(false);

  useFrame(() => {
    if (!loadedEnabled && sceneBus.scrollProgress > 0.36) {
      setLoadedEnabled(true);
    }
  });

  const floorY = naveFloorY(-86);
  const layout = useMemo(() => {
    const count = images.length;
    const cols = Math.min(4, Math.max(2, Math.ceil(count / 2)));
    return images.map((img, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const spreadX = isMobile ? 1.38 : 1.52;
      const x = (col - (cols - 1) / 2) * spreadX + (isMobile ? 0 : -0.75);
      const archCurve = Math.cos(((col - (cols - 1) / 2) / Math.max(1, cols / 2)) * 0.9) * 0.45;
      const y = floorY + (row === 0 ? 3.1 : 1.35) + archCurve + (isMobile ? 0.55 : 0);
      const z = -86.2 - Math.abs(col - (cols - 1) / 2) * 0.65;
      const rotY = (col - (cols - 1) / 2) * -0.14;
      return { img, position: [x, y, z], rotationY: rotY };
    });
  }, [floorY, isMobile]);

  return (
    <group>
      {layout.map((item, idx) => (
        <Shard
          key={item.img.src}
          img={item.img}
          idx={idx}
          total={layout.length}
          position={item.position}
          rotationY={item.rotationY}
          loadedEnabled={loadedEnabled}
          onSelect={onOpenLightbox}
        />
      ))}
    </group>
  );
}
