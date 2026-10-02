import { useState, useEffect, useRef } from 'react';
import Window from './Window';
import './OscilloscopeWindow.css';

// createMediaElementSource can only be called once per <audio>, and the element
// then plays through this context, so the graph is created once and never closed.
let graph = null;
function getGraph(audio) {
  if (!graph) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(ctx.destination);
    graph = { ctx, analyser, data: new Uint8Array(analyser.frequencyBinCount) };
  }
  if (graph.ctx.state === 'suspended') graph.ctx.resume();
  return graph;
}

function getColor(t) {
  const p = Math.min(1, Math.max(0, t));
  const r = Math.round(255 + (204 - 255) * p);
  const g = Math.round(255 + (34 - 255) * p);
  return `rgb(${r},${g},${g})`;
}

export function ScopeContent({ audioRef }) {
  const canvasRef = useRef(null);
  const [audioActive, setAudioActive] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    let g = null;
    try { g = getGraph(audio); } catch { /* no Web Audio: idle noise only */ }
    const resume = () => g?.ctx.state === 'suspended' && g.ctx.resume();
    document.addEventListener('pointerdown', resume);

    const c = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0, noise = new Float32Array(1);

    const resize = () => {
      w = canvas.parentElement.clientWidth;
      h = canvas.parentElement.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const next = new Float32Array(Math.max(Math.floor(w), 1));
      next.set(noise.subarray(0, next.length));
      noise = next;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    let frame, lastActive = false;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (w < 1 || h < 1) return;
      c.clearRect(0, 0, w, h);
      c.beginPath();
      c.lineWidth = 1.5;

      const active = !!g && !audio.paused && !audio.ended;
      if (active !== lastActive) setAudioActive(lastActive = active);

      if (active) {
        const { analyser, data } = g;
        analyser.getByteTimeDomainData(data);
        const step = w / data.length;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128;
          sum += Math.abs(v - 1);
          c.lineTo(i * step, (v * h) / 2);
        }
        c.strokeStyle = getColor((sum / data.length) * 2.5);
      } else {
        const limit = h * 0.25, step = w / noise.length;
        for (let i = 0; i < noise.length; i++) {
          noise[i] = Math.max(-limit, Math.min(limit, (noise[i] + (Math.random() - 0.5) * 3) * 0.985));
          c.lineTo(i * step, h / 2 + noise[i]);
        }
        c.strokeStyle = getColor(0);
      }
      c.stroke();
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener('pointerdown', resume);
    };
  }, [audioRef]);

  return (
    <>
      <div className="scope-content">
        <canvas ref={canvasRef} className="scope-canvas" />
        <div className="scope-scanlines" />
        {!audioActive && (
          <div className="scope-idle-overlay">
            <span>player needs to be running</span>
          </div>
        )}
      </div>
      <div className="scope-statusbar">
        <span className={audioActive ? 'scope-live' : 'scope-idle'}>
          {audioActive ? 'LIVE' : 'IDLE'}
        </span>
      </div>
    </>
  );
}

export default function OscilloscopeWindow({ audioRef, ...win }) {
  return (
    <Window {...win} bare minW={280} minH={160}>
      <ScopeContent audioRef={audioRef} />
    </Window>
  );
}
