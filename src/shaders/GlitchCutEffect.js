import { createElement, forwardRef, useMemo } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSeed;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (uIntensity <= 0.005) {
      outputColor = inputColor;
      return;
    }

    float t = floor(uTime * 18.0);
    float band = floor(uv.y * 26.0);
    float bandNoise = hash12(vec2(band, t + uSeed));
    float tearMask = step(0.76 - uIntensity * 0.35, bandNoise);

    float shift = (hash12(vec2(band + 13.7, t)) - 0.5) * 0.14 * uIntensity * tearMask;
    vec2 gUv = vec2(fract(uv.x + shift), uv.y);

    float rgbSplit = (0.004 + 0.018 * uIntensity) * (0.4 + 0.6 * tearMask);
    float r = texture2D(inputBuffer, clamp(gUv + vec2(rgbSplit, 0.0), 0.0, 1.0)).r;
    float g = texture2D(inputBuffer, clamp(gUv, 0.0, 1.0)).g;
    float b = texture2D(inputBuffer, clamp(gUv - vec2(rgbSplit, 0.0), 0.0, 1.0)).b;

    vec3 col = vec3(r, g, b);
    // Xerox blood-red tint along displaced tear strips
    float flash = step(0.88, hash12(vec2(band * 2.1, t))) * uIntensity;
    col = mix(col, vec3(1.0, 0.2, 0.32), flash * 0.28);

    outputColor = vec4(col, inputColor.a);
  }
`;

export class GlitchCutEffectImpl extends Effect {
  constructor() {
    super('GlitchCutEffect', fragmentShader, {
      uniforms: new Map([
        ['uTime', new Uniform(0)],
        ['uIntensity', new Uniform(0)],
        ['uSeed', new Uniform(1.0)],
      ]),
    });
  }

  update(_renderer, _inputBuffer, deltaTime) {
    this.uniforms.get('uTime').value += deltaTime;
  }
}

export const GlitchCut = forwardRef(function GlitchCut(props, ref) {
  const effect = useMemo(() => new GlitchCutEffectImpl(), []);
  return createElement('primitive', { ref, object: effect, ...props });
});
