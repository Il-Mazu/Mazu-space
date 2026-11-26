import * as THREE from 'three';

let cached = null;

function hash2d(x, y, seed = 1337) {
  let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function makeCanvas(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function getProceduralTextures() {
  if (cached) return cached;

  const stoneBump = makeCanvas(256, (ctx, s) => {
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const idx = (y * s + x) * 4;
        const coarse = hash2d(x >> 2, y >> 2, 11);
        const fine = hash2d(x, y, 37);
        const seam = y % 64 < 2 || ((x + (Math.floor(y / 64) % 2) * 64) % 128) < 2 ? 0.25 : 1.0;
        const v = Math.floor((coarse * 0.6 + fine * 0.4) * seam * 255);
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  stoneBump.repeat.set(2, 2);

  const chromeRoughness = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#363636';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      const lum = Math.floor(32 + hash2d(0, y, 99) * 42);
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fillRect(0, y, s, 1);
    }
    for (let i = 0; i < 40; i++) {
      const y = Math.floor(hash2d(i, 3, 5) * s);
      ctx.fillStyle = 'rgba(190,190,190,0.12)';
      ctx.fillRect(0, y, s, 1);
    }
  });
  chromeRoughness.repeat.set(2, 2);

  const floorRoughness = makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#787878';
    ctx.fillRect(0, 0, s, s);
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const shade = Math.floor(95 + hash2d(tx, ty, 71) * 70);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(tx * 64 + 3, ty * 64 + 3, 58, 58);
      }
    }
    // Mortar seams are rougher/matte than worn stone tiles so lights don't streak down center seam.
    ctx.strokeStyle = '#dcdcdc';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 64);
      ctx.lineTo(s, i * 64);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 64, 0);
      ctx.lineTo(i * 64, s);
      ctx.stroke();
    }
  });
  floorRoughness.repeat.set(4, 48);

  const ashSprite = makeCanvas(64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
  ashSprite.wrapS = THREE.ClampToEdgeWrapping;
  ashSprite.wrapT = THREE.ClampToEdgeWrapping;

  cached = { stoneBump, chromeRoughness, floorRoughness, ashSprite };
  return cached;
}
