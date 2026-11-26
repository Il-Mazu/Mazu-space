import { SITE } from '../data/content.js';
import { jumpToSection } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './HeroOverlay.css';

export default function HeroOverlay({ ogMode = false }) {
  return (
    <div className="chapel-text hero-text ui-depth-plane">
      <div className="chapel-scrim" aria-hidden="true" />
      <h1 className="hero-title">{SITE.title}</h1>
      <p className="chapel-copy hero-sub">code, art &amp; noise · digital reliquary</p>
      {!ogMode && (
        <button
          type="button"
          className="ink-trigger hero-cta"
          onMouseEnter={playHoverTick}
          onClick={() => {
            playClickHit();
            jumpToSection(1);
          }}
        >
          <span className="ink-cross" aria-hidden="true">♰</span>
          <span>descend</span>
        </button>
      )}
      <p className="chapel-meta hero-motto">{SITE.motto}</p>
    </div>
  );
}
