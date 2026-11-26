import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Scanline,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { GlitchCut } from '../shaders/GlitchCutEffect.js';
import { sceneBus } from '../state/sceneBus.js';

export default function PostFX({ perfTier }) {
  const bloomRef = useRef(null);
  const glitchRef = useRef(null);
  const caOffset = useMemo(() => new THREE.Vector2(0.0011, 0.0007), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const { bass, rms } = sceneBus.audioMetrics;

    if (bloomRef.current) {
      bloomRef.current.intensity = 0.85 + bass * 0.65 + rms * 0.2;
    }

    if (glitchRef.current) {
      if (sceneBus.reducedMotion) {
        sceneBus.glitchIntensity = 0;
      } else {
        sceneBus.glitchIntensity = Math.max(0, sceneBus.glitchIntensity - dt * 3.4);
      }
      glitchRef.current.uniforms.get('uIntensity').value = sceneBus.glitchIntensity;
      if (sceneBus.glitchIntensity > 0.05) {
        glitchRef.current.uniforms.get('uSeed').value = (Math.floor(performance.now() / 55) % 97) + 1;
      }
    }
  });

  if (perfTier === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          luminanceThreshold={1.08}
          intensity={0.75}
          radius={0.55}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={perfTier === 'high' ? 2 : 0}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        luminanceThreshold={1.02}
        intensity={0.92}
        radius={0.65}
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation
        modulationOffset={0.35}
      />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
      {perfTier === 'high' && (
        <Scanline density={1.55} opacity={0.06} blendFunction={BlendFunction.OVERLAY} />
      )}
      <Vignette eskil={false} offset={0.18} darkness={0.78} />
      <GlitchCut ref={glitchRef} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
