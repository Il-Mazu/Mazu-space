import { images } from 'virtual:dump-images';
import { ANGEL_ART, CROSS_SWORD_ART, WING_ART } from '../data/ascii.js';
import { CHAPELS } from '../data/chapels.js';
import HeroOverlay from '../sections/HeroOverlay.jsx';
import AboutOverlay from '../sections/AboutOverlay.jsx';
import LiveOverlay from '../sections/LiveOverlay.jsx';
import WorksOverlay from '../sections/WorksOverlay.jsx';
import projects from 'virtual:projects';
import DumpOverlay from '../sections/DumpOverlay.jsx';
import GamesCryptOverlay from '../sections/GamesCryptOverlay.jsx';
import ExitOverlay from '../sections/ExitOverlay.jsx';
import GuestbookOverlay from '../sections/GuestbookOverlay.jsx';
import './Fallback2D.css';

function renderChapel(id, { lanyard, music, guestbook, onOpenLightbox, onOpenCrypt, onOpenWork }) {
  switch (id) {
    case 'works':
      return (
        <>
          <WorksOverlay onOpenWork={onOpenWork} />
          <div className="fb2d-works">
            {projects.map((p, i) => (
              <button key={p.repo} type="button" className="fb2d-work" onClick={() => onOpenWork(i)}>
                <img src={p.media.image || p.media.poster} alt="" loading="lazy" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      );
    case 'hero':
      return (
        <>
          <HeroOverlay />
          <div className="fb2d-eye-frame">
            <img src="/wallpapers/eye.webp" alt="Mazu pixel eye" />
          </div>
        </>
      );
    case 'about':
      return (
        <>
          <AboutOverlay />
          <div className="fb2d-ascii-box" aria-hidden="true">
            <pre className="fb2d-ascii-pre">{ANGEL_ART}</pre>
            <pre className="fb2d-ascii-pre fb2d-ascii-pre--small">{CROSS_SWORD_ART}</pre>
          </div>
        </>
      );
    case 'live':
      return (
        <>
          <div className="fb2d-ascii-box fb2d-wings-box" aria-hidden="true">
            <pre className="fb2d-ascii-pre">{WING_ART}</pre>
            <pre className="fb2d-ascii-pre fb2d-wing-mirrored">{WING_ART}</pre>
          </div>
          <LiveOverlay lanyard={lanyard} music={music} showAvatar />
        </>
      );
    case 'dump':
      return (
        <>
          <div className="fb2d-dump-grid">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                className="fb2d-shard"
                onClick={() => onOpenLightbox(i)}
                aria-label={`Open shard ${i + 1}: ${img.label}`}
              >
                <img src={img.thumb} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <DumpOverlay onOpenLightbox={onOpenLightbox} />
        </>
      );
    case 'games':
      return <GamesCryptOverlay onOpen={onOpenCrypt} />;
    case 'exit':
      return (
        <>
          <GuestbookOverlay guestbook={guestbook} shown />
          <ExitOverlay />
        </>
      );
    default:
      return null;
  }
}

const FULL_WIDTH = new Set(['works', 'games', 'exit']);

export default function Fallback2D(props) {
  return (
    <main id="main-content" className="fb2d-root">
      <div className="fb2d-container">
        <p className="fb2d-notice">♰ 2d reliquary mode // webgl unavailable, full archive active</p>
        {CHAPELS.map((c) => (
          <section
            key={c.id}
            id={`chapel-${c.id}`}
            className={`fb2d-section${FULL_WIDTH.has(c.id) ? ' fb2d-section--full' : ''}`}
            aria-label={`${c.roman}. ${c.name}`}
          >
            {renderChapel(c.id, props)}
          </section>
        ))}
      </div>
    </main>
  );
}
