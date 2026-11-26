import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SECTIONS } from '../data/content.js';
import { sceneBus } from '../state/sceneBus.js';

export default function CameraRig({ isMobile }) {
  const { camera } = useThree();

  const { posCurve, lookCurve } = useMemo(() => {
    const xScale = isMobile ? 0.45 : 1.0;
    const posPoints = SECTIONS.map((s) => new THREE.Vector3(s.camPos[0] * xScale, s.camPos[1], s.camPos[2]));
    const lookPoints = SECTIONS.map((s) => new THREE.Vector3(s.lookAt[0] * xScale, s.lookAt[1], s.lookAt[2]));
    return {
      posCurve: new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.45),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.45),
    };
  }, [isMobile]);

  const targetPos = useRef(new THREE.Vector3(...SECTIONS[0].camPos));
  const targetLook = useRef(new THREE.Vector3(...SECTIONS[0].lookAt));
  const currentLook = useRef(new THREE.Vector3(...SECTIONS[0].lookAt));
  const parallax = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const targetFov = isMobile ? 56 : 44;
    if (camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }, [camera, isMobile]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.14);
    const t = THREE.MathUtils.clamp(sceneBus.scrollProgress, 0, 1);

    posCurve.getPointAt(t, targetPos.current);
    lookCurve.getPointAt(t, targetLook.current);

    if (!sceneBus.reducedMotion && !sceneBus.terminalOpen) {
      const pxTarget = sceneBus.pointer.x * (isMobile ? 0.14 : 0.38);
      const pyTarget = sceneBus.pointer.y * (isMobile ? 0.10 : 0.24);
      parallax.current.x = THREE.MathUtils.damp(parallax.current.x, pxTarget, 5.0, dt);
      parallax.current.y = THREE.MathUtils.damp(parallax.current.y, pyTarget, 5.0, dt);
      targetPos.current.x += parallax.current.x;
      targetPos.current.y += parallax.current.y;
    }

    if (sceneBus.terminalFocus > 0.001) {
      const termPos = new THREE.Vector3(0, -2.5, -127.6);
      const termLook = new THREE.Vector3(0, -2.5, -130.0);
      targetPos.current.lerp(termPos, sceneBus.terminalFocus);
      targetLook.current.lerp(termLook, sceneBus.terminalFocus);
    }

    if (sceneBus.reducedMotion) {
      camera.position.copy(targetPos.current);
      currentLook.current.copy(targetLook.current);
    } else {
      const distZ = Math.abs(camera.position.z - targetPos.current.z);
      const dampLambda = sceneBus.terminalFocus > 0.05 ? 9.5 : distZ > 15 ? 24.0 : 9.0;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.current.x, dampLambda, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.current.y, dampLambda, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.current.z, dampLambda, dt);
      currentLook.current.x = THREE.MathUtils.damp(currentLook.current.x, targetLook.current.x, dampLambda, dt);
      currentLook.current.y = THREE.MathUtils.damp(currentLook.current.y, targetLook.current.y, dampLambda, dt);
      currentLook.current.z = THREE.MathUtils.damp(currentLook.current.z, targetLook.current.z, dampLambda, dt);
    }

    camera.lookAt(currentLook.current);
  });

  return null;
}
