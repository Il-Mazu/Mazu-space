import { SITE } from '../data/content.js';
import { jumpToSection } from '../state/sceneBus.js';
import './HeroOverlay.css';

export default function HeroOverlay() {
  return (
    <div className="hero-overlay">
      <div className="hero-meta-tag">
        <span className="c-red" aria-hidden="true">♰</span>
        <span>CHAPEL I // VIGIL</span>
      </div>

      <h1 className="hero-title xerox-hover">{SITE.title}</h1>

      <p className="hero-subtitle">{SITE.subtitle}</p>

      <div className="hero-footer-row">
        <button
          type="button"
          className="hero-cta xerox-hover"
          onClick={() => jumpToSection(1)}
        >
          <span className="c-red" aria-hidden="true">♰</span>
          <span>DESCEND INTO THE NAVE</span>
        </button>

        <span className="hero-motto">{SITE.motto}</span>
      </div>
    </div>
  );
}
