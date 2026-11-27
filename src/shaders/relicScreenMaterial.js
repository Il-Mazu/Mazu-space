import * as THREE from 'three';

// Works niche screen. At rest the media is an ordered dither in the site
// palette (void / deep red / bone); hovering un-dithers it to the real image.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float uHasMap;
  uniform float uReveal;
  uniform float uGlow;
  uniform vec2 uGrid;
  uniform vec3 uVoid;
  uniform vec3 uRed;
  uniform vec3 uBone;
  varying vec2 vUv;

  float bayer4(vec2 p) {
    vec2 q = mod(p, 4.0);
    float i = q.x + q.y * 4.0;
    // 4x4 Bayer matrix, row-major
    if (i < 1.0) return 0.0 / 16.0;   if (i < 2.0) return 8.0 / 16.0;
    if (i < 3.0) return 2.0 / 16.0;   if (i < 4.0) return 10.0 / 16.0;
    if (i < 5.0) return 12.0 / 16.0;  if (i < 6.0) return 4.0 / 16.0;
    if (i < 7.0) return 14.0 / 16.0;  if (i < 8.0) return 6.0 / 16.0;
    if (i < 9.0) return 3.0 / 16.0;   if (i < 10.0) return 11.0 / 16.0;
    if (i < 11.0) return 1.0 / 16.0;  if (i < 12.0) return 9.0 / 16.0;
    if (i < 13.0) return 15.0 / 16.0; if (i < 14.0) return 7.0 / 16.0;
    if (i < 15.0) return 13.0 / 16.0; return 5.0 / 16.0;
  }

  void main() {
    vec2 cell = floor(vUv * uGrid);
    vec2 cellUv = (cell + 0.5) / uGrid;
    vec3 src = uHasMap > 0.5 ? texture2D(map, vUv).rgb : uVoid;
    vec3 coarse = uHasMap > 0.5 ? texture2D(map, cellUv).rgb : uVoid;

    float lum = pow(dot(coarse, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2);
    float level = floor(clamp(lum * 2.0 + bayer4(cell) - 0.25, 0.0, 2.0));
    vec3 dithered = level < 0.5 ? uVoid : (level < 1.5 ? uRed : uBone);

    vec3 col = mix(dithered, src, uReveal);
    // faint scanlines over the revealed image, like the eye's CRT
    col *= 1.0 - uReveal * 0.12 * step(0.5, fract(vUv.y * uGrid.y * 0.5));
    col += uRed * uGlow * 0.25;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createRelicScreenMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null },
      uHasMap: { value: 0 },
      uReveal: { value: 0 },
      uGlow: { value: 0 },
      uGrid: { value: new THREE.Vector2(200, 112) },
      uVoid: { value: new THREE.Color('#060607') },
      uRed: { value: new THREE.Color('#8a0f1f') },
      uBone: { value: new THREE.Color('#e9e4da') },
    },
    vertexShader,
    fragmentShader,
  });
}
