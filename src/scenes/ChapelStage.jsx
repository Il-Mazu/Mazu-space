import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sceneBus } from '../state/sceneBus.js';

// Shows a chapel only while the camera is close enough to read it, so the next
// chapel never sits behind the current one's text. Fog hides the pop-in.
const AHEAD = 26;
const BEHIND = -6;

export default function ChapelStage({ chapel, children }) {
  const ref = useRef(null);
  // a chapel with a later camera stop deeper inside it stays up until past that stop
  const behind = Math.min(BEHIND, ...chapel.beats.map((b) => b.camPos[2] - chapel.z - 8));

  useFrame(({ camera }) => {
    if (!ref.current) return;
    const d = camera.position.z - chapel.z;
    ref.current.visible = sceneBus.precompiling || (d > behind && d < AHEAD);
  });

  return (
    <group ref={ref} userData={{ chapelStage: true }}>
      {children}
    </group>
  );
}
