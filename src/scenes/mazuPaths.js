import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function shapeFromPts(pts, holePts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();

  if (holePts) {
    const h = new THREE.Path();
    h.moveTo(holePts[0][0], holePts[0][1]);
    for (let i = 1; i < holePts.length; i++) h.lineTo(holePts[i][0], holePts[i][1]);
    h.closePath();
    s.holes.push(h);
  }
  return s;
}

function extrude(shapes) {
  return new THREE.ExtrudeGeometry(shapes, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.05,
  });
}

// Crisp gothic blackletter glyphs M-A-Z-U centered around origin.
export function buildMazuLogoGeometry() {
  const extrudeOpts = [];

  // ── M ──────────────────────────────────────────────────
  const mLeft = shapeFromPts([
    [-0.78, -0.90], [-0.54, -1.02], [-0.46, -0.82], [-0.46, 0.56],
    [-0.12, 0.18], [-0.12, -0.92], [0.06, -1.04], [0.14, -0.86],
    [0.14, 0.56], [0.46, 0.18], [0.46, -0.92], [0.68, -1.04],
    [0.78, -0.82], [0.72, -0.68], [0.72, 0.72], [0.48, 0.96],
    [0.14, 0.62], [0.14, 0.78], [-0.08, 0.98], [-0.46, 0.62],
    [-0.46, 0.78], [-0.70, 0.98], [-0.84, 0.80], [-0.72, 0.66],
    [-0.72, -0.72],
  ]);
  const gM = extrude([mLeft]);
  gM.translate(-2.45, 0, 0);
  extrudeOpts.push(gM);

  // ── A ──────────────────────────────────────────────────
  const aOuter = [
    [-0.68, -0.94], [-0.44, -1.05], [-0.34, -0.86], [-0.32, -0.26],
    [0.32, -0.26], [0.34, -0.88], [0.56, -1.04], [0.72, -0.84],
    [0.62, -0.68], [0.58, 0.58], [0.02, 1.04], [-0.56, 0.64],
    [-0.58, -0.70],
  ];
  const aHole = [
    [-0.30, -0.02], [-0.30, 0.44], [0.02, 0.68], [0.30, 0.42], [0.30, -0.02],
  ];
  const gA = extrude([shapeFromPts(aOuter, aHole)]);
  gA.translate(-0.78, 0, 0);
  extrudeOpts.push(gA);

  // ── Z (with gothic crossbar) ───────────────────────────
  const zShape = shapeFromPts([
    [-0.64, 0.62], [-0.52, 0.96], [0.68, 0.96], [0.72, 0.70],
    [0.14, 0.10], [0.44, 0.10], [0.44, -0.10], [-0.06, -0.10],
    [-0.36, -0.66], [0.46, -0.66], [0.70, -0.46], [0.74, -0.88],
    [0.52, -1.02], [-0.70, -1.02], [-0.72, -0.74], [-0.26, -0.10],
    [-0.54, -0.10], [-0.54, 0.10], [-0.08, 0.10], [0.28, 0.66],
    [-0.42, 0.66],
  ]);
  const gZ = extrude([zShape]);
  gZ.translate(0.84, 0, 0);
  extrudeOpts.push(gZ);

  // ── U ──────────────────────────────────────────────────
  const uShape = shapeFromPts([
    [-0.66, -0.78], [-0.20, -1.04], [0.36, -0.80], [0.58, -1.02],
    [0.74, -0.84], [0.64, -0.68], [0.64, 0.72], [0.42, 0.98],
    [0.24, 0.78], [0.34, 0.64], [0.34, -0.58], [0.02, -0.76],
    [-0.32, -0.58], [-0.32, 0.68], [-0.14, 0.82], [-0.40, 0.98],
    [-0.68, 0.74], [-0.58, 0.58], [-0.58, -0.66],
  ]);
  const gU = extrude([uShape]);
  gU.translate(2.44, 0, 0);
  extrudeOpts.push(gU);

  const merged = mergeGeometries(extrudeOpts, false);
  extrudeOpts.forEach((g) => g.dispose());
  merged.center();
  return merged;
}
