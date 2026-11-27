import { useEffect, useRef } from 'react';
import projects from 'virtual:projects';
import { playClickHit, playHoverTick, playLightboxTone } from '../audio/AudioEngine.js';
import './Works.css';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Link({ href, children }) {
  return (
    <a className="ink-trigger" href={href} target="_blank" rel="noopener noreferrer" onMouseEnter={playHoverTick} onClick={playClickHit}>
      <span className="ink-cross" aria-hidden="true">♰</span>
      {children}
    </a>
  );
}

// A project opened as an illuminated manuscript page beside its niche.
export default function WorksDetail({ index, side, onClose, onChange }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const returnFocus = useRef(null);
  const open = index !== null;
  const p = open ? projects[index] : null;

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement;
    playLightboxTone(true);
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      playLightboxTone(false);
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Tab') {
        // keep focus inside the page while it is open
        const items = [...dialogRef.current.querySelectorAll('a, button')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onChange((index + 1) % projects.length);
      else if (e.key === 'ArrowLeft') onChange((index - 1 + projects.length) % projects.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, onClose, onChange]);

  if (!p) return null;

  const [initial, ...rest] = Array.from(p.name);
  const stack = p.stack?.length ? p.stack : [p.language].filter(Boolean);

  return (
    <div
      ref={dialogRef}
      className={`manuscript manuscript--${side < 0 ? 'right' : 'left'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manuscript-title"
    >
      <div className="manuscript-page" key={p.repo}>
        <h2 id="manuscript-title" className="manuscript-title">
          <span className="manuscript-rubric" aria-hidden="true">{initial}</span>
          <span className="sr-only">{initial}</span>
          {rest.join('')}
        </h2>

        <p className="manuscript-lede">{p.description}</p>

        <ul className="manuscript-details">
          {p.details?.map((d) => (
            <li key={d}>
              <span className="ink-cross" aria-hidden="true">♰</span>
              {d}
            </li>
          ))}
        </ul>

        {p.note && <p className="manuscript-note">{p.note}</p>}

        <dl className="manuscript-margin">
          <div>
            <dt>stack</dt>
            <dd>{stack.join(' · ')}</dd>
          </div>
          {p.stars !== null && (
            <div>
              <dt>stars</dt>
              <dd>{p.stars}</dd>
            </div>
          )}
          {p.pushedAt && (
            <div>
              <dt>last update</dt>
              <dd>{dateFmt.format(new Date(p.pushedAt)).toLowerCase()}</dd>
            </div>
          )}
        </dl>

        <nav className="manuscript-links" aria-label={`${p.name} links`}>
          <Link href={p.url}>repo</Link>
          {p.live && <Link href={p.live}>live</Link>}
          {p.download && <Link href={p.download}>download</Link>}
        </nav>

        <div className="manuscript-foot">
          <button
            type="button"
            className="manuscript-step"
            aria-label="Previous work"
            onClick={() => onChange((index - 1 + projects.length) % projects.length)}
          >
            ←
          </button>
          <span className="manuscript-folio">
            folio {index + 1} / {projects.length}
          </span>
          <button
            type="button"
            className="manuscript-step"
            aria-label="Next work"
            onClick={() => onChange((index + 1) % projects.length)}
          >
            →
          </button>
          <button ref={closeRef} type="button" className="ink-trigger manuscript-close" onClick={onClose}>
            <span className="ink-cross" aria-hidden="true">♰</span>
            back to the nave
          </button>
        </div>
      </div>
    </div>
  );
}
