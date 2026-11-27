import { useEffect } from 'react';
import { sceneBus } from '../state/sceneBus.js';
import './UiFilmLayer.css';

export default function UiFilmLayer() {
  useEffect(() => {
    // Scoped to the chapel text: a custom property on :root restyles the whole
    // document every frame.
    const root = document.querySelector('.scroll-stage') || document.documentElement;
    let raf = 0;
    let curX = 0;
    let curY = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (sceneBus.reducedMotion) {
        if (curX !== 0 || curY !== 0) {
          curX = 0;
          curY = 0;
          root.style.setProperty('--ui-px', '0');
          root.style.setProperty('--ui-py', '0');
        }
        return;
      }
      const tx = sceneBus.pointer.x || 0;
      const ty = sceneBus.pointer.y || 0;
      if (Math.abs(tx - curX) < 0.002 && Math.abs(ty - curY) < 0.002) return;
      curX += (tx - curX) * 0.08;
      curY += (ty - curY) * 0.08;
      root.style.setProperty('--ui-px', curX.toFixed(3));
      root.style.setProperty('--ui-py', curY.toFixed(3));
    };

    if (!sceneBus.reducedMotion) {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      root.style.removeProperty('--ui-px');
      root.style.removeProperty('--ui-py');
    };
  }, []);

  return (
    <div className="ui-film-layer" aria-hidden="true">
      <div className="ui-film-grain" />
      <div className="ui-film-scanlines" />
      <div className="ui-film-vignette" />
    </div>
  );
}
