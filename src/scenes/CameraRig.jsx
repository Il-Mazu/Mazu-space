import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_STOPS } from '../data/chapels.js';
import { sceneBus } from '../state/sceneBus.js';

export default function CameraRig({ isMobile }) {
  const { camera } = useThree();

  const { posCurve, lookCurve } = useMemo(() => {
    const xScale = isMobile ? 0.45 : 1.0;
    const posPoints = CAMERA_STOPS.map((s) => new THREE.Vector3(s.camPos[0] * xScale, s.camPos[1], s.camPos[2]));
    const lookPoints = CAMERA_STOPS.map((s) => new THREE.Vector3(s.lookAt[0] * xScale, s.lookAt[1], s.lookAt[2]));
    return {
      posCurve: new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.45),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.45),
    };
  }, [isMobile]);

  const targetPos = useRef(new THREE.Vector3(...CAMERA_STOPS[0].camPos));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_STOPS[0].lookAt));
  const currentLook = useRef(new THREE.Vector3(...CAMERA_STOPS[0].lookAt));
  const parallax = useRef(new THREE.Vector2(0, 0));
  const focusPos = useRef(new THREE.Vector3());
  const focusLook = useRef(new THREE.Vector3());

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

    // getPoint (not getPointAt) so each scroll stop lands exactly on its camera stop.
    posCurve.getPoint(t, targetPos.current);
    lookCurve.getPoint(t, targetLook.current);

    if (!sceneBus.reducedMotion && sceneBus.doorPush < 0.999) {
      const pushEase = 1 - Math.pow(1 - Math.max(0, Math.min(1, sceneBus.doorPush)), 3);
      targetPos.current.z += (1 - pushEase) * 4.4;
    }

    if (!sceneBus.reducedMotion) {
      const pxTarget = sceneBus.pointer.x * (isMobile ? 0.14 : 0.38);
      const pyTarget = sceneBus.pointer.y * (isMobile ? 0.10 : 0.24);
      parallax.current.x = THREE.MathUtils.damp(parallax.current.x, pxTarget, 5.0, dt);
      parallax.current.y = THREE.MathUtils.damp(parallax.current.y, pyTarget, 5.0, dt);
      targetPos.current.x += parallax.current.x;
      targetPos.current.y += parallax.current.y;
    }

    const wantFocus = sceneBus.focus ? 1 : 0;
    sceneBus.focusT = sceneBus.reducedMotion ? wantFocus : THREE.MathUtils.damp(sceneBus.focusT, wantFocus, 4.5, dt);
    if (sceneBus.focus) {
      focusPos.current.fromArray(sceneBus.focus.pos);
      focusLook.current.fromArray(sceneBus.focus.look);
    }
    if (sceneBus.focusT > 0.001) {
      targetPos.current.lerp(focusPos.current, sceneBus.focusT);
      targetLook.current.lerp(focusLook.current, sceneBus.focusT);
    }

    if (sceneBus.reducedMotion) {
      camera.position.copy(targetPos.current);
      currentLook.current.copy(targetLook.current);
    } else {
      const distZ = Math.abs(camera.position.z - targetPos.current.z);
      const dampLambda = distZ > 15 ? 24.0 : 9.0;
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
