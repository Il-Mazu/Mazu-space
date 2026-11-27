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

  // Large worn slabs in running bond for the reflective floor.
  const slabRows = [];
  {
    let y = 0;
    let r = 0;
    while (y < 1024) {
      const h = 130 + Math.floor(hash2d(r, 3, 17) * 70);
      const slabs = [];
      let x = -Math.floor(hash2d(r, 5, 29) * 160);
      let c = 0;
      while (x < 512) {
        const w = 170 + Math.floor(hash2d(c, r, 41) * 140);
        slabs.push([x, w, hash2d(c, r, 53)]);
        x += w;
        c++;
      }
      slabRows.push([y, Math.min(h, 1024 - y), slabs]);
      y += h;
      r++;
    }
  }
  const drawSlabs = (ctx, fill) => {
    slabRows.forEach(([y, h, slabs]) => {
      slabs.forEach(([x, w, v]) => {
        ctx.fillStyle = fill(v);
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        if (x + w > 512) {
          ctx.fillRect(x - 512 + 3, y + 3, w - 6, h - 6);
        }
      });
    });
  };
  const slabCanvas = (fill, bg) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 1024);
    drawSlabs(ctx, fill);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 18);
    return tex;
  };
  const floorSlabColor = slabCanvas((v) => {
    const g = 14 + Math.floor(v * 9);
    return `rgb(${g},${g - 1},${g + 2})`;
  }, '#040405');
  floorSlabColor.colorSpace = THREE.SRGBColorSpace;
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

  cached = { stoneBump, chromeRoughness, floorSlabColor, ashSprite };
  return cached;
}
