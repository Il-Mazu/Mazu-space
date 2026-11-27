import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { GlitchCut } from '../shaders/GlitchCutEffect.js';
import { sceneBus } from '../state/sceneBus.js';

export default function PostFX({ perfTier }) {
  const bloomRef = useRef(null);
  const glitchRef = useRef(null);

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

  if (perfTier === 'low' || sceneBus.reducedMotion) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          levels={4}
          luminanceThreshold={1.08}
          intensity={0.75}
          radius={0.55}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  // Kept to effects that merge into one pass. Grain and scanlines come from the
  // CSS film layer (which also covers the chapel text), chromatic aberration
  // needed a pass of its own and was the costliest effect on weak GPUs, and
  // MSAA on half-float targets is skipped because the grain hides aliasing.
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        levels={perfTier === 'high' ? 6 : 5}
        luminanceThreshold={1.02}
        intensity={0.92}
        radius={0.65}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.78} />
      <GlitchCut ref={glitchRef} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
