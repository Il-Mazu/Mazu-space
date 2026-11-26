import { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SECTIONS } from '../data/content.js';
import { sampleAudio } from '../audio/AudioEngine.js';
import CameraRig from './CameraRig.jsx';

function AudioSampler() {
  useFrame(() => {
    sampleAudio();
  });
  return null;
}

function PlaceholderNave() {
  const bays = useMemo(() => {
    const arr = [];
    for (let z = 6; z >= -160; z -= 12) arr.push(z);
    return arr;
  }, []);

  return (
    <group>
      {bays.map((z) => {
        const y = 1.6 - ((-z + 6) / 166) * 4.8;
        return (
          <group key={z} position={[0, y, z]}>
            <mesh position={[-4.2, 0, 0]}>
              <boxGeometry args={[0.35, 8, 0.35]} />
              <meshStandardMaterial color="#18181d" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[4.2, 0, 0]}>
              <boxGeometry args={[0.35, 8, 0.35]} />
              <meshStandardMaterial color="#18181d" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[0, 4.1, 0]}>
              <boxGeometry args={[8.75, 0.28, 0.28]} />
              <meshStandardMaterial color="#18181d" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        );
      })}

      {SECTIONS.map((sec, idx) => (
        <group key={sec.id} position={[0, sec.lookAt[1], sec.z]}>
          <mesh>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color="#1c1c22"
              emissive={idx === 0 ? '#ff3352' : '#8a0f1f'}
              emissiveIntensity={1.6}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, -0.6, 1.5]} color="#ff3352" intensity={3.5} distance={14} decay={2} />
        </group>
      ))}
    </group>
  );
}

export default function CathedralCanvas({ isMobile }) {
  const maxDpr = isMobile ? 1.5 : 2;
  const eventSource = typeof document !== 'undefined' ? document.body : undefined;

  return (
    <div id="canvas-root" aria-hidden="true">
      <Canvas
        dpr={[1, maxDpr]}
        camera={{ position: SECTIONS[0].camPos, fov: isMobile ? 56 : 44, near: 0.1, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        eventSource={eventSource}
        eventPrefix="client"
      >
        <color attach="background" args={['#060607']} />
        <fogExp2 attach="fog" args={['#060607', 0.038]} />
        <ambientLight intensity={0.25} color="#d8d2c6" />
        <directionalLight position={[2, 8, 5]} intensity={0.55} color="#e9e4da" />

        <AudioSampler />
        <CameraRig isMobile={isMobile} />
        <PlaceholderNave />
      </Canvas>
    </div>
  );
}
