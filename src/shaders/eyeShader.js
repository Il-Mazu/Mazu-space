import * as THREE from 'three';

export const eyeVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Bulge center outward like a CRT glass tube
    vec2 centered = uv * 2.0 - 1.0;
    float r2 = dot(centered, centered);
    pos.z += (1.0 - clamp(r2 * 0.55, 0.0, 1.0)) * 0.24;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const eyeFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uFallback;
  uniform float uHasVideo;
  uniform float uTime;
  uniform vec2 uGaze;
  uniform float uAudioBass;
  uniform float uClose;
  uniform float uSpectral;
  uniform float uPowerOn;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float bayer4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int idx = x + y * 4;
    if (idx == 0) return 0.0 / 16.0;
    if (idx == 1) return 8.0 / 16.0;
    if (idx == 2) return 2.0 / 16.0;
    if (idx == 3) return 10.0 / 16.0;
    if (idx == 4) return 12.0 / 16.0;
    if (idx == 5) return 4.0 / 16.0;
    if (idx == 6) return 14.0 / 16.0;
    if (idx == 7) return 6.0 / 16.0;
    if (idx == 8) return 3.0 / 16.0;
    if (idx == 9) return 11.0 / 16.0;
    if (idx == 10) return 1.0 / 16.0;
    if (idx == 11) return 9.0 / 16.0;
    if (idx == 12) return 15.0 / 16.0;
    if (idx == 13) return 7.0 / 16.0;
    if (idx == 14) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }

  vec2 crtUv(vec2 uv) {
    vec2 c = uv * 2.0 - 1.0;
    c *= 1.0 + 0.08 * dot(c, c);
    return c * 0.5 + 0.5;
  }

  vec3 sampleEye(vec2 uv) {
    vec2 clamped = clamp(uv, 0.002, 0.998);
    vec3 vid = texture2D(uMap, clamped).rgb;
    vec3 img = texture2D(uFallback, clamped).rgb;
    return mix(img, vid, uHasVideo);
  }

  void main() {
    vec2 cuv = crtUv(vUv);
    if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
      gl_FragColor = vec4(0.02, 0.02, 0.025, 1.0);
      return;
    }

    // Subtle gaze parallax + pupil breathing from bass
    vec2 gazeUv = cuv - uGaze * 0.045;
    float pupilZoom = 1.0 - uAudioBass * 0.08;
    vec2 zoomedUv = (gazeUv - 0.5) * pupilZoom + 0.5;

    float ca = 0.003 + uAudioBass * 0.004;
    float r = sampleEye(zoomedUv + vec2(ca, 0.0)).r;
    float g = sampleEye(zoomedUv).g;
    float b = sampleEye(zoomedUv - vec2(ca, 0.0)).b;

    float lum = dot(vec3(r, g, b), vec3(0.299, 0.587, 0.114));

    // Crisp CRT scanline + subtle ordered Bayer dither threshold
    float scan = 0.88 + 0.12 * sin(cuv.y * 360.0 + uTime * 3.0);
    float dither = bayer4(gl_FragCoord.xy);
    float dithered = mix(lum, step(dither * 0.85 + 0.08, lum), 0.24);

    // Bone-white pixel art with crimson shadow scatter & iris rim
    vec3 bone = vec3(0.914, 0.894, 0.855);
    vec3 shadowRed = vec3(0.54, 0.04, 0.10);
    vec3 brightRed = vec3(1.55, 0.16, 0.30);

    float distCenter = length(cuv - vec2(0.45, 0.52) - uGaze * 0.05);
    float irisRing = smoothstep(0.32, 0.18, distCenter) * smoothstep(0.05, 0.16, distCenter);

    vec3 col = mix(vec3(0.02, 0.02, 0.025), bone, dithered);
    col += shadowRed * (1.0 - dithered) * 0.22;
    col = mix(col, brightRed, irisRing * (0.24 + uAudioBass * 0.55) * (1.0 - lum * 0.6));

    // Red phosphor fringe on chromatic mismatch
    float fringe = max(0.0, r - b);
    col += brightRed * fringe * 0.85;
    col *= scan;

    // Fresnel glass rim glow
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);
    col += brightRed * fresnel * (0.45 + uAudioBass * 0.45);

    // Rounded CRT corner vignette
    vec2 edge = abs(cuv - 0.5) * 2.0;
    float crtMask = smoothstep(1.0, 0.88, max(edge.x, edge.y));
    col *= crtMask;

    // Eyelid shutter mask (blinks + Section VIII finale close)
    float openHalf = max(0.0, 0.56 * (1.0 - uClose));
    float lidCurve = (cuv.x - 0.5) * (cuv.x - 0.5) * 0.22;
    float lidDist = abs(cuv.y - 0.5) + lidCurve;
    float lidMask = 1.0 - smoothstep(openHalf - 0.025, openHalf + 0.015, lidDist);
    float slitGlow = smoothstep(0.03, 0.0, abs(lidDist - openHalf)) * smoothstep(0.05, 0.9, uClose);

    col = mix(vec3(0.02, 0.02, 0.025), col, lidMask);
    col += brightRed * slitGlow * 0.75;

    if (uSpectral > 0.01) {
      col = mix(col, vec3(col.r * 1.15, col.g * 0.65, col.b * 0.7), uSpectral * 0.45);
    }

    if (uPowerOn < 0.999 && uSpectral < 0.01) {
      float p = clamp(uPowerOn, 0.0, 1.0);
      float lineOn = smoothstep(0.14, 0.24, p);
      float halfH = mix(0.016, 0.58, smoothstep(0.42, 0.94, p));
      float halfW = mix(0.06, 0.56, smoothstep(0.16, 0.42, p));
      float vDist = abs(cuv.y - 0.5);
      float hDist = abs(cuv.x - 0.5);
      float beamMask = (1.0 - smoothstep(halfH - 0.012, halfH + 0.012, vDist))
        * (1.0 - smoothstep(halfW - 0.02, halfW + 0.02, hDist))
        * lineOn;
      float flicker = 0.78 + 0.22 * sin(uTime * 68.0 + p * 24.0);
      float hLine = smoothstep(0.028, 0.0, vDist) * smoothstep(0.16, 0.42, p) * (1.0 - smoothstep(0.50, 0.80, p));
      float surge = smoothstep(0.40, 0.58, p) * (1.0 - smoothstep(0.68, 0.98, p));
      col *= beamMask * flicker;
      col += (vec3(1.15, 0.96, 0.92) * hLine + vec3(0.85, 0.22, 0.30) * (surge * 0.65 + hLine * 0.5)) * (1.0 - smoothstep(0.88, 1.0, p));
      col = max(col, vec3(0.015, 0.012, 0.016));
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createEyeMaterial(fallbackTex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: fallbackTex },
      uFallback: { value: fallbackTex },
      uHasVideo: { value: 0 },
      uTime: { value: 0 },
      uGaze: { value: new THREE.Vector2(0, 0) },
      uAudioBass: { value: 0 },
      uClose: { value: 0 },
      uSpectral: { value: 0 },
      uPowerOn: { value: 1 },
    },
    vertexShader: eyeVertexShader,
    fragmentShader: eyeFragmentShader,
  });
}
