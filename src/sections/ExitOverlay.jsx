import { commits, buildDate } from 'virtual:git-info';
import { count as dumpCount } from 'virtual:dump-images';
import { gamesCount } from '../data/games.js';
import { TRACKS } from '../data/tracks.js';
import { LINKS, SITE } from '../data/content.js';
import { jumpToSection } from '../state/sceneBus.js';
import './ExitOverlay.css';

export default function ExitOverlay() {
  const counters = [
    ['music', TRACKS.length],
    ['dump', dumpCount],
    ['games', gamesCount],
  ];

  return (
    <article className="exit-panel" aria-labelledby="exit-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL VIII // LOG + LINKS</span>
      </div>

      <h2 id="exit-heading" className="chapel-title">carved ledger</h2>

      <div className="exit-grid">
        <section aria-label="Recent git commits">
          <div className="exit-subhead">── COMMITS ──</div>
          <div className="exit-commits">
            {commits.length === 0 ? (
              <div className="c-dim">no commits</div>
            ) : (
              commits.map((c) => (
                <div key={c.hash} className="exit-commit-row" title={c.message}>
                  <span className="exit-commit-hash">{c.hash}</span>
                  <span className="exit-commit-msg">{c.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="exit-build-date">
            build: <span className="c-bone">{buildDate || '--'}</span>
          </div>
        </section>

        <div className="exit-side">
          <section aria-label="Content index counts">
            <div className="exit-subhead">── ARCHIVE ──</div>
            <div className="exit-counters">
              {counters.map(([label, n]) => (
                <div key={label}>
                  <span className="c-red" aria-hidden="true">♰ </span>
                  <span className="c-dim">{label}: </span>
                  <span className="c-bone">{n}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="External links">
            <div className="exit-subhead">── LINKS ──</div>
            <div className="exit-links">
              {LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="exit-link xerox-hover"
                >
                  <span className="c-red" aria-hidden="true">&gt;</span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="exit-footer">
        <span className="exit-motto">{SITE.motto}</span>
        <button
          type="button"
          className="exit-top-btn xerox-hover"
          onClick={() => jumpToSection(0)}
        >
          <span className="c-red" aria-hidden="true">♰</span>
          <span>RETURN TO EYE</span>
        </button>
      </div>
    </article>
  );
}
