import * as THREE from 'three';

export const shatterVertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aScatter;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uPointSize;
  varying float vSeed;
  varying float vEnergy;

  void main() {
    vSeed = aSeed;
    float burst = sin(uProgress * 3.14159265);
    float settle = smoothstep(0.14, 0.92, uProgress);

    vec3 pos = mix(position, aTarget, settle);
    pos += aScatter * burst * 0.50;

    vEnergy = burst;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp(uPointSize * (1.0 + burst * 0.65) * (4.2 / max(1.0, -mvPos.z)), 1.5, 5.5);
  }
`;

export const shatterFragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vSeed;
  varying float vEnergy;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;

    vec3 bone = vec3(0.914, 0.894, 0.855);
    vec3 red = vec3(1.65, 0.12, 0.24);
    float isRed = step(0.68, vSeed);
    vec3 col = mix(bone, red, isRed + vEnergy * 0.4);
    float alpha = uOpacity * (1.0 - smoothstep(0.06, 0.25, r2));

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createShatterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uPointSize: { value: 2.6 },
      uOpacity: { value: 0 },
    },
    vertexShader: shatterVertexShader,
    fragmentShader: shatterFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
