import './NoiseOverlay.css';

// A 128px grayscale noise tile generated once. The old fullscreen SVG
// turbulence + mix-blend-mode had to be re-blended on every frame.
let tile;
function noiseTile() {
  if (tile) return tile;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.random() * 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return (tile = `url(${c.toDataURL()})`);
}

export default function NoiseOverlay() {
  return <div id="noise" style={{ '--noise': noiseTile() }} />;
}
