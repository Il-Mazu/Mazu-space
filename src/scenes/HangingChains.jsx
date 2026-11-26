import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { naveFloorY } from './GothicNave.jsx';
import { patchChainSwayMaterial } from '../shaders/chainSwayShader.js';
import { sceneBus } from '../state/sceneBus.js';

function buildChainStrandGeometry(links = 16) {
  const parts = [];
  const baseLink = new THREE.TorusGeometry(0.11, 0.028, 7, 14);
  baseLink.scale(0.68, 1.45, 1.0);

  for (let i = 0; i < links; i++) {
    const link = baseLink.clone();
    if (i % 2 === 1) link.rotateY(Math.PI / 2);
    link.translate(0, -i * 0.24 - 0.16, 0);
    parts.push(link);
  }
  baseLink.dispose();
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

export default function HangingChains({ isMobile }) {
  const chainGeom = useMemo(() => buildChainStrandGeometry(isMobile ? 13 : 17), [isMobile]);
  const meshRef = useRef(null);

  const uniformsRef = useRef({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uReduced: { value: 0 },
  });

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#3c3c46',
      metalness: 0.96,
      roughness: 0.22,
    });
    patchChainSwayMaterial(mat, uniformsRef);
    return mat;
  }, []);

  const anchors = useMemo(() => {
    const list = [];
    const step = isMobile ? 16 : 11;
    for (let z = 4; z >= -156; z -= step) {
      const fy = naveFloorY(z);
      list.push({ x: -3.25, y: fy + 7.4, z, scale: 1.0 });
      list.push({ x: 3.25, y: fy + 7.4, z: z - 2.4, scale: 0.95 });
      if (!isMobile && Math.abs(z % 22) < 11) {
        list.push({ x: -1.9, y: fy + 8.0, z: z - 5.2, scale: 0.72 });
        list.push({ x: 1.9, y: fy + 8.0, z: z - 5.2, scale: 0.72 });
      }
    }
    return list;
  }, [isMobile]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    anchors.forEach((a, i) => {
      dummy.position.set(a.x, a.y, a.z);
      dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
      dummy.scale.setScalar(a.scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
  }, [anchors]);

  useEffect(() => () => {
    chainGeom.dispose();
    material.dispose();
  }, [chainGeom, material]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    uniformsRef.current.uTime.value = state.clock.elapsedTime;
    uniformsRef.current.uReduced.value = sceneBus.reducedMotion ? 1.0 : 0.0;
    uniformsRef.current.uPointer.value.x = THREE.MathUtils.damp(
      uniformsRef.current.uPointer.value.x,
      sceneBus.pointer.x + sceneBus.pointer.vx * 3.0,
      3.5,
      dt,
    );
    uniformsRef.current.uPointer.value.y = THREE.MathUtils.damp(
      uniformsRef.current.uPointer.value.y,
      sceneBus.pointer.y + sceneBus.pointer.vy * 3.0,
      3.5,
      dt,
    );
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[chainGeom, material, anchors.length]}
      frustumCulled={false}
    />
  );
}
