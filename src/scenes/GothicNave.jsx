import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getProceduralTextures } from './proceduralTextures.js';
import { NAVE_END_Z, naveFloorY } from '../data/chapels.js';

const FLOOR_START_Z = 20;
const FLOOR_END_Z = NAVE_END_Z - 10;
const FLOOR_LEN = FLOOR_START_Z - FLOOR_END_Z;
const FLOOR_MID_Z = (FLOOR_START_Z + FLOOR_END_Z) / 2;
const FLOOR_MID_Y = naveFloorY(FLOOR_MID_Z) - 0.05;

function buildLancetArchGeometry() {
  const outer = new THREE.Shape();
  const ow = 5.4;
  const springY = 2.6;
  const apexY = 6.9;

  outer.moveTo(-ow, -3.2);
  outer.lineTo(-ow, springY);
  outer.quadraticCurveTo(-ow * 0.85, apexY - 0.8, 0, apexY);
  outer.quadraticCurveTo(ow * 0.85, apexY - 0.8, ow, springY);
  outer.lineTo(ow, -3.2);
  outer.lineTo(ow - 0.9, -3.2);
  outer.lineTo(ow - 0.9, springY - 0.1);
  outer.quadraticCurveTo((ow - 0.9) * 0.8, apexY - 1.35, 0, apexY - 0.72);
  outer.quadraticCurveTo(-(ow - 0.9) * 0.8, apexY - 1.35, -(ow - 0.9), springY - 0.1);
  outer.lineTo(-(ow - 0.9), -3.2);
  outer.closePath();

  const geom = new THREE.ExtrudeGeometry(outer, {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: 18,
  });
  geom.center();
  return geom;
}

function buildInnerSpandrelGeometry() {
  const shape = new THREE.Shape();
  const iw = 4.52;
  const springY = 2.52;
  const apexY = 6.2;

  shape.moveTo(-iw, springY - 0.4);
  shape.lineTo(-iw, springY);
  shape.quadraticCurveTo(-iw * 0.8, apexY - 0.75, 0, apexY);
  shape.quadraticCurveTo(iw * 0.8, apexY - 0.75, iw, springY);
  shape.lineTo(iw, springY - 0.4);
  shape.lineTo(iw - 0.2, springY - 0.4);
  shape.lineTo(iw - 0.2, springY);
  shape.quadraticCurveTo((iw - 0.2) * 0.78, apexY - 0.9, 0, apexY - 0.24);
  shape.quadraticCurveTo(-(iw - 0.2) * 0.78, apexY - 0.9, -(iw - 0.2), springY);
  shape.lineTo(-(iw - 0.2), springY - 0.4);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    curveSegments: 16,
  });
  geom.translate(0, 0, -0.08);
  return geom;
}

function buildCrossGeometry() {
  const s = new THREE.Shape();
  // Orthodox/gothic patriarchal silhouette echoing ♰
  s.moveTo(-0.045, -0.45);
  s.lineTo(0.045, -0.45);
  s.lineTo(0.045, 0.06);
  s.lineTo(0.28, 0.06);
  s.lineTo(0.28, 0.14);
  s.lineTo(0.045, 0.14);
  s.lineTo(0.045, 0.28);
  s.lineTo(0.18, 0.28);
  s.lineTo(0.18, 0.35);
  s.lineTo(0.045, 0.35);
  s.lineTo(0.045, 0.48);
  s.lineTo(-0.045, 0.48);
  s.lineTo(-0.045, 0.35);
  s.lineTo(-0.18, 0.35);
  s.lineTo(-0.18, 0.28);
  s.lineTo(-0.045, 0.28);
  s.lineTo(-0.045, 0.14);
  s.lineTo(-0.28, 0.14);
  s.lineTo(-0.28, 0.06);
  s.lineTo(-0.045, 0.06);
  s.closePath();

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
}

export default function GothicNave({ isMobile }) {
  const textures = useMemo(() => getProceduralTextures(), []);
  const stepZ = isMobile ? 16 : 12;

  const bays = useMemo(() => {
    const arr = [];
    for (let z = 6; z >= NAVE_END_Z; z -= stepZ) {
      arr.push(z);
    }
    return arr;
  }, [stepZ]);

  const { archGeom, trimGeom, pillarGeom, capitalGeom, crossGeom, railGeom } = useMemo(() => ({
    archGeom: buildLancetArchGeometry(),
    trimGeom: buildInnerSpandrelGeometry(),
    pillarGeom: new THREE.CylinderGeometry(0.30, 0.36, 7.2, 10),
    capitalGeom: new THREE.CylinderGeometry(0.54, 0.34, 0.46, 8),
    crossGeom: buildCrossGeometry(),
    railGeom: new THREE.BoxGeometry(0.14, 0.18, stepZ + 0.5),
  }), [stepZ]);

  useEffect(() => () => {
    archGeom.dispose();
    trimGeom.dispose();
    pillarGeom.dispose();
    capitalGeom.dispose();
    crossGeom.dispose();
    railGeom.dispose();
  }, [archGeom, trimGeom, pillarGeom, capitalGeom, crossGeom, railGeom]);

  const archRef = useRef(null);
  const trimRef = useRef(null);
  const pillarRef = useRef(null);
  const capRef = useRef(null);
  const crossRef = useRef(null);
  const railRef = useRef(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const n = bays.length;

    bays.forEach((z, i) => {
      const floorY = naveFloorY(z);

      dummy.position.set(0, floorY + 3.85, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      archRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(0, floorY + 2.05, z);
      dummy.updateMatrix();
      trimRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(0, floorY + 7.45, z + 0.25);
      dummy.scale.set(1.25, 1.25, 1.25);
      dummy.updateMatrix();
      crossRef.current?.setMatrixAt(i, dummy.matrix);

      // Left + right pillars and capitals
      [-4.65, 4.65].forEach((x, side) => {
        const idx = i * 2 + side;
        dummy.position.set(x, floorY + 3.4, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pillarRef.current?.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(x, floorY + 6.95, z);
        dummy.updateMatrix();
        capRef.current?.setMatrixAt(idx, dummy.matrix);

        if (i < n - 1) {
          const nextFloorY = naveFloorY(z - stepZ);
          const slope = Math.atan2(floorY - nextFloorY, stepZ);
          dummy.position.set(x, (floorY + nextFloorY) * 0.5 + 0.2, z - stepZ * 0.5);
          dummy.rotation.set(slope, 0, 0);
          dummy.updateMatrix();
          railRef.current?.setMatrixAt(idx, dummy.matrix);
        }
      });
    });

    [archRef, trimRef, pillarRef, capRef, crossRef, railRef].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  }, [bays, stepZ]);

  const floorSlope = Math.atan2(4.8, 166);

  return (
    <group>
      {/* Obsidian wet flagstone cathedral aisle */}
      <mesh
        position={[0, FLOOR_MID_Y, FLOOR_MID_Z]}
        rotation={[-Math.PI / 2 - floorSlope, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[12.5, FLOOR_LEN]} />
        {/* At grazing angles the glossy tiles mirrored the bone key lights as beige
            patches. specularIntensity caps that grazing (F90) reflectance, and the
            red specularColor keeps the head-on sheen in palette. */}
        <meshPhysicalMaterial
          color="#0e0e12"
          metalness={0}
          roughness={0.82}
          roughnessMap={textures.floorRoughness}
          specularColor="#ff3352"
          specularIntensity={0.28}
          envMapIntensity={0.04}
        />
      </mesh>

      {/* Recessed center crimson aisle veins */}
      <mesh position={[-1.65, FLOOR_MID_Y + 0.02, FLOOR_MID_Z]} rotation={[-Math.PI / 2 - floorSlope, 0, 0]}>
        <planeGeometry args={[0.035, FLOOR_LEN - 6]} />
        <meshBasicMaterial color={[1.25, 0.12, 0.22]} toneMapped={false} transparent opacity={0.45} />
      </mesh>
      <mesh position={[1.65, FLOOR_MID_Y + 0.02, FLOOR_MID_Z]} rotation={[-Math.PI / 2 - floorSlope, 0, 0]}>
        <planeGeometry args={[0.035, FLOOR_LEN - 6]} />
        <meshBasicMaterial color={[1.25, 0.12, 0.22]} toneMapped={false} transparent opacity={0.45} />
      </mesh>

      {/* Lancet stone arches */}
      <instancedMesh ref={archRef} args={[archGeom, null, bays.length]} frustumCulled={false}>
        <meshStandardMaterial
          color="#1e1e25"
          metalness={0.35}
          roughness={0.68}
          bumpMap={textures.stoneBump}
          bumpScale={0.08}
        />
      </instancedMesh>

      {/* Chrome inner arch molding */}
      <instancedMesh ref={trimRef} args={[trimGeom, null, bays.length]} frustumCulled={false}>
        <meshStandardMaterial
          color="#464652"
          metalness={0.95}
          roughness={0.16}
          roughnessMap={textures.chromeRoughness}
        />
      </instancedMesh>

      {/* Fluted pillars */}
      <instancedMesh ref={pillarRef} args={[pillarGeom, null, bays.length * 2]} frustumCulled={false}>
        <meshStandardMaterial
          color="#24242c"
          metalness={0.48}
          roughness={0.54}
          bumpMap={textures.stoneBump}
          bumpScale={0.06}
        />
      </instancedMesh>

      {/* Molded chrome capitals */}
      <instancedMesh ref={capRef} args={[capitalGeom, null, bays.length * 2]} frustumCulled={false}>
        <meshStandardMaterial
          color="#444450"
          metalness={0.94}
          roughness={0.18}
          roughnessMap={textures.chromeRoughness}
        />
      </instancedMesh>

      {/* Keystone gothic crosses */}
      <instancedMesh ref={crossRef} args={[crossGeom, null, bays.length]} frustumCulled={false}>
        <meshStandardMaterial
          color="#5c5c68"
          metalness={0.97}
          roughness={0.14}
        />
      </instancedMesh>

      {/* Nave aisle iron rails */}
      <instancedMesh ref={railRef} args={[railGeom, null, (bays.length - 1) * 2]} frustumCulled={false}>
        <meshStandardMaterial color="#1f1f26" metalness={0.85} roughness={0.28} />
      </instancedMesh>
    </group>
  );
}
