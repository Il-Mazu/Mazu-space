export function patchChainSwayMaterial(material, uniformsRef) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;
    shader.uniforms.uPointer = uniformsRef.current.uPointer;
    shader.uniforms.uReduced = uniformsRef.current.uReduced;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uReduced;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float hangRatio = clamp(-position.y / 6.2, 0.0, 1.0);
        float weight = hangRatio * hangRatio;
        float phase = 0.0;
        #ifdef USE_INSTANCING
          phase = instanceMatrix[3][2] * 0.47 + instanceMatrix[3][0] * 1.13;
        #endif
        float idleSway = sin(uTime * 1.15 + phase) * 0.14;
        float idleTwist = cos(uTime * 0.85 + phase * 1.3) * 0.09;
        float mouseKickX = uPointer.x * 0.55;
        float mouseKickZ = uPointer.y * 0.25;
        float motionMask = 1.0 - uReduced;
        transformed.x += (idleSway + mouseKickX) * weight * motionMask;
        transformed.z += (idleTwist + mouseKickZ) * weight * motionMask;`,
      );
  };
  material.customProgramCacheKey = () => 'chain-sway-v1';
}
