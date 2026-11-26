import * as THREE from 'three';

// Maps any image onto the site palette: void black -> deep red -> bone.
// Keeps avatars and album covers from bringing their own hues into the nave.
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
  uniform float uDim;
  uniform vec3 uVoid;
  uniform vec3 uRed;
  uniform vec3 uBone;
  varying vec2 vUv;

  void main() {
    vec3 voidCol = uVoid;
    vec3 red = uRed;
    vec3 bone = uBone;
    vec3 src = texture2D(map, vUv).rgb;
    // samples arrive linear; tone the image by perceived brightness
    float lum = uHasMap > 0.5 ? pow(dot(src, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2) : 0.3;
    lum = smoothstep(0.06, 0.92, lum);
    vec3 col = lum < 0.5 ? mix(voidCol, red, lum * 2.0) : mix(red, bone, (lum - 0.5) * 2.0);
    // xerox grain
    float n = fract(sin(dot(floor(vUv * 220.0), vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * 0.05;
    gl_FragColor = vec4(col * uDim, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createDuotoneMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null },
      uHasMap: { value: 0 },
      uDim: { value: 1 },
      // THREE.Color converts the sRGB hex values to the linear working space
      uVoid: { value: new THREE.Color('#060607') },
      uRed: { value: new THREE.Color('#8a0f1f') },
      uBone: { value: new THREE.Color('#e9e4da') },
    },
    vertexShader,
    fragmentShader,
  });
}

export function setDuotoneMap(material, tex) {
  material.uniforms.map.value = tex;
  material.uniforms.uHasMap.value = tex ? 1 : 0;
}
