import * as THREE from 'three';

export const stainedGlassVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const stainedGlassFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform float uHover;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec2 uv = clamp(vUv, 0.002, 0.998);
    float split = 0.003 + uHover * 0.022;

    vec3 texCol = vec3(0.06, 0.04, 0.05);
    if (uHasMap > 0.5) {
      float r = texture2D(uMap, clamp(uv + vec2(split, 0.0), 0.0, 1.0)).r;
      float g = texture2D(uMap, uv).g;
      float b = texture2D(uMap, clamp(uv - vec2(split, 0.0), 0.0, 1.0)).b;
      texCol = vec3(r, g, b);
    }

    // Gothic stained-glass dark lead edge vignette + subtle crimson shadow grading
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float leadMask = smoothstep(0.0, 0.085, edgeDist);
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.6);

    float lum = dot(texCol, vec3(0.299, 0.587, 0.114));
    vec3 graded = mix(texCol, vec3(lum * 1.15, lum * 0.85, lum * 0.88), 0.25 - uHover * 0.2);

    vec3 redGlow = vec3(1.55, 0.14, 0.28);
    vec3 col = graded * (0.45 + 0.55 * leadMask);
    col += redGlow * (1.0 - leadMask) * (0.25 + uHover * 0.85);
    col += redGlow * fresnel * (0.3 + uHover * 0.65);

    // Subtle glass shimmer on hover
    float shimmer = sin((uv.x + uv.y) * 14.0 - uTime * 3.5) * 0.5 + 0.5;
    col += vec3(0.95, 0.92, 0.88) * shimmer * uHover * 0.08;

    gl_FragColor = vec4(col, 0.96);
  }
`;

export function createStainedGlassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uHasMap: { value: 0 },
      uHover: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: stainedGlassVertexShader,
    fragmentShader: stainedGlassFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
