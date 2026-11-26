import * as THREE from 'three';

export const smokeVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const smokeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uColorDeep;
  uniform vec3 uColorHot;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.1, 31.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float edgeX = smoothstep(0.0, 0.35, uv.x) * (1.0 - smoothstep(0.65, 1.0, uv.x));
    float edgeY = smoothstep(0.0, 0.42, uv.y) * (1.0 - smoothstep(0.55, 1.0, uv.y));
    float mask = edgeX * edgeY;

    vec2 q = vec2(uv.x * 2.6 + uSeed, uv.y * 2.1 - uTime * 0.08);
    float n1 = fbm(q);
    float n2 = fbm(q * 1.8 + vec2(uTime * 0.05, -uTime * 0.04) + n1 * 0.65);

    float density = smoothstep(0.28, 0.85, n2) * mask;
    float hot = smoothstep(0.45, 0.92, n2) * (1.0 - uv.y * 0.75);
    vec3 col = mix(uColorDeep, uColorHot, hot) * (1.0 + uAudioBass * 0.75);

    gl_FragColor = vec4(col, density * uOpacity * (1.0 + uAudioBass * 0.35));
  }
`;

export function createSmokeMaterial(seed = 0, opacity = 0.34) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAudioBass: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uColorDeep: { value: new THREE.Color('#5a0714') },
      uColorHot: { value: new THREE.Color('#ff3352') },
    },
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
