import { useEffect, useRef } from 'react';
import { images } from 'virtual:dump-images';
import { ANGEL_ART, CROSS_SWORD_ART, WING_ART } from '../data/ascii.js';
import { sampleAudio, useAudioState } from '../audio/AudioEngine.js';
import { sceneBus } from '../state/sceneBus.js';
import HeroOverlay from '../sections/HeroOverlay.jsx';
import AboutOverlay from '../sections/AboutOverlay.jsx';
import PresenceOverlay from '../sections/PresenceOverlay.jsx';
import MusicOverlay from '../sections/MusicOverlay.jsx';
import DumpOverlay from '../sections/DumpOverlay.jsx';
import GamesCryptOverlay from '../sections/GamesCryptOverlay.jsx';
import TerminalOverlay from '../sections/TerminalOverlay.jsx';
import ExitOverlay from '../sections/ExitOverlay.jsx';
import './Fallback2D.css';

function ScopeCanvas2D() {
  const canvasRef = useRef(null);
  const audio = useAudioState();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const noise = new Float32Array(128);
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      sampleAudio();
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 160;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.lineWidth = 2;

      const { isPlaying, timeDomain, rms } = sceneBus.audioMetrics;
      if (isPlaying) {
        for (let i = 0; i < timeDomain.length; i++) {
          const x = (i / (timeDomain.length - 1)) * w;
          const y = (timeDomain[i] / 128) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgb(255, ${Math.round(51 + rms * 60)}, ${Math.round(82 + rms * 40)})`;
      } else {
        for (let i = 0; i < noise.length; i++) {
          noise[i] = Math.max(-h * 0.2, Math.min(h * 0.2, (noise[i] + (Math.random() - 0.5) * 2.5) * 0.97));
          const x = (i / (noise.length - 1)) * w;
          const y = h / 2 + noise[i];
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#ff3352';
      }
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fb2d-scope-box">
      <div className="fb2d-scope-label">
        ♰ OSCILLOSCOPE // {audio.playing ? 'LIVE WAVEFORM' : 'IDLE STATIC'}
      </div>
      <canvas ref={canvasRef} className="fb2d-scope-canvas" />
    </div>
  );
}

export default function Fallback2D({ lanyard, onOpenLightbox, onOpenTerminal }) {
  return (
    <main id="main-content" className="fb2d-root">
      <div className="fb2d-container">
        <div className="fb2d-notice">
          ♰ 2D RELIQUARY MODE // WebGL unavailable or disabled — full archive active
        </div>

        <section id="chapel-hero" className="fb2d-section" aria-label="I. the eye">
          <HeroOverlay />
          <div className="fb2d-eye-frame">
            <img src="/wallpapers/eye.webp" alt="Mazu pixel eye" />
          </div>
        </section>

        <section id="chapel-about" className="fb2d-section" aria-label="II. whoami">
          <AboutOverlay />
          <div className="fb2d-ascii-box">
            <pre className="fb2d-ascii-pre">{ANGEL_ART}</pre>
            <pre className="fb2d-ascii-pre" style={{ marginTop: 14, fontSize: 6.5 }}>{CROSS_SWORD_ART}</pre>
          </div>
        </section>

        <section id="chapel-presence" className="fb2d-section" aria-label="III. presence">
          <div className="fb2d-ascii-box fb2d-wings-box" aria-hidden="true">
            <pre className="fb2d-ascii-pre">{WING_ART}</pre>
            <pre className="fb2d-ascii-pre fb2d-wing-mirrored">{WING_ART}</pre>
          </div>
          <PresenceOverlay lanyard={lanyard} />
        </section>

        <section id="chapel-music" className="fb2d-section" aria-label="IV. altar of noise">
          <MusicOverlay lanyard={lanyard} />
          <ScopeCanvas2D />
        </section>

        <section id="chapel-dump" className="fb2d-section" aria-label="V. stained glass">
          <div className="fb2d-dump-grid">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                className="fb2d-shard"
                onClick={() => onOpenLightbox(i)}
                aria-label={`Open stained glass ${i + 1}`}
              >
                <img src={img.thumb} alt={img.label} loading="lazy" />
              </button>
            ))}
          </div>
          <DumpOverlay onOpenLightbox={onOpenLightbox} />
        </section>

        <section id="chapel-games" className="fb2d-section fb2d-section--full" aria-label="VI. the crypt">
          <GamesCryptOverlay />
        </section>

        <section id="chapel-terminal" className="fb2d-section fb2d-section--full" aria-label="VII. confessional">
          <TerminalOverlay open={false} onOpen={onOpenTerminal} onClose={() => {}} />
        </section>

        <section id="chapel-exit" className="fb2d-section fb2d-section--full" aria-label="VIII. log and links">
          <ExitOverlay />
        </section>
      </div>
    </main>
  );
}
