// Where each Works reliquary stands, shared by the scene and the camera close-up.
// Niches alternate left/right wall and step back in pairs, so 3 to ~8 fit.
export function worksLayout(chapel, count, isMobile) {
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const x = side * (isMobile ? 1.75 : 3.2);
    const z = chapel.z + (isMobile ? 2.2 : 3.4) - row * (isMobile ? 3.4 : 3.8);
    const y = chapel.floorY + (isMobile ? 2.1 : 1.95);
    // turned toward the middle of the nave, a bit toward the camera
    const rotY = -side * (isMobile ? 0.62 : 0.95);

    const nx = Math.sin(rotY);
    const nz = Math.cos(rotY);
    // right-hand direction on the niche face
    const rx = Math.cos(rotY);
    const rz = -Math.sin(rotY);
    const dist = isMobile ? 5.2 : 4.6;
    // Aim beside the niche so it sits off-centre and the manuscript page gets
    // the other half of the screen.
    const shift = isMobile ? 0 : -side * 1.25;
    return {
      side,
      pos: [x, y, z],
      rotY,
      camPos: [x + nx * dist, y + 0.15, z + nz * dist],
      camLook: [x + rx * shift, y - (isMobile ? 0.9 : 0.2), z + rz * shift],
    };
  });
}
