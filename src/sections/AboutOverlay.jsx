import { ABOUT, CHRONICLE, isOngoing } from '../data/content.js';
import { jumpToSection } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './AboutOverlay.css';

// Two beats: whoami at the altar, then the chronicle along the wall. Both stay
// in the DOM; focusing into the one off screen moves the camera to it.
// beat=null (the 2D fallback) shows both.
export default function AboutOverlay({ beat = null }) {
  return (
    <>
      <Whoami shown={beat === null || beat === 0} />
      <Chronicle shown={beat === null || beat === 1} />
    </>
  );
}

function Whoami({ shown }) {
  return (
    <article
      className={`chapel-text about-text ui-depth-plane beat${shown ? '' : ' beat--off'}`}
      aria-labelledby="about-heading"
      onFocus={(e) => {
        if (shown) return;
        // handled here so the section's own focus jump doesn't override the beat
        e.stopPropagation();
        jumpToSection({ id: 'about', beat: 0 });
      }}
    >
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="about-heading" className="chapel-title">whoami</h2>
      <p className="about-prompt">
        <span className="tilt-label">{ABOUT.prompt}</span>
      </p>

      <div className="chapel-copy about-greeting">
        <p className="c-bone">{ABOUT.greeting[0]}</p>
        <p>{ABOUT.greeting[1]}</p>
        <p>{ABOUT.greeting[2]}</p>
      </div>

      <dl className="about-facts">
        {ABOUT.facts.map((item) => (
          <div key={item.key} className="about-row">
            <dt>
              <span className="ink-cross" aria-hidden="true">♰</span>
              {item.key}
            </dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="about-motto">{ABOUT.motto}</p>
    </article>
  );
}

function Chronicle({ shown }) {
  return (
    <article
      className={`chapel-text chronicle-text ui-depth-plane beat${shown ? '' : ' beat--off'}`}
      aria-labelledby="chronicle-heading"
      onFocus={(e) => {
        if (shown) return;
        // handled here so the section's own focus jump doesn't override the beat
        e.stopPropagation();
        jumpToSection({ id: 'about', beat: 1 });
      }}
    >
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="chronicle-heading" className="chapel-title">chronicle</h2>
      <ol className="chronicle-list">
        {CHRONICLE.map((entry) => (
          <li key={entry.title} className={isOngoing(entry) ? 'is-now' : undefined}>
            <span className="chronicle-when">{entry.when}</span>
            <span className="chronicle-title">{entry.title}</span>
            <span className="chronicle-detail">{entry.detail}</span>
          </li>
        ))}
      </ol>
      {__HAS_CV__ && (
        <a
          className="ink-trigger chronicle-cv"
          href="/cv.pdf"
          download="marco-mazurek-cv.pdf"
          onMouseEnter={playHoverTick}
          onClick={playClickHit}
        >
          <span className="ink-cross" aria-hidden="true">♰</span>
          download cv
        </a>
      )}
    </article>
  );
}
