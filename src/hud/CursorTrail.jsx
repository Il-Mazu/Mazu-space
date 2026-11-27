import { useEffect, useRef } from 'react';
import { sceneBus } from '../state/sceneBus.js';

const MAX_PARTICLES = 24;

export default function CursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let lastSpawn = 0;
    const particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e) => {
      const now = performance.now();
      const nx = (e.clientX / Math.max(width, 1)) * 2 - 1;
      const ny = -(e.clientY / Math.max(height, 1)) * 2 + 1;
      sceneBus.pointer.vx = nx - sceneBus.pointer.x;
      sceneBus.pointer.vy = ny - sceneBus.pointer.y;
      sceneBus.pointer.x = nx;
      sceneBus.pointer.y = ny;

      if (now - lastSpawn < 24) return;
      lastSpawn = now;
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 4,
        y: e.clientY + (Math.random() - 0.5) * 4,
        size: 2 + Math.floor(Math.random() * 2) * 2,
        life: 1,
      });
      if (particles.length > MAX_PARTICLES) particles.shift();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Runs only while particles are alive: an idle full-screen canvas that is
    // cleared every frame still costs a compositor upload per frame.
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.045;
        p.y += 0.35;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(255, 51, 82, ${(p.life * 0.42).toFixed(3)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      raf = particles.length ? requestAnimationFrame(tick) : 0;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-trail-canvas" aria-hidden="true" />;
}
