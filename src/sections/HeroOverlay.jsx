import { SITE } from '../data/content.js';
import { jumpToSection } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './HeroOverlay.css';

export default function HeroOverlay({ ogMode = false, isMobile = false, forceInline = false }) {
  // Desktop WebGL Hero lives in 3D space via DiegeticStageUI
  if (!isMobile && !ogMode && !forceInline) {
    return null;
  }

  return (
    <div className="hero-diegetic">
      <div className="hero-diegetic-wash" aria-hidden="true" />
      <h1 className="hero-diegetic-title">{SITE.title}</h1>
      <p className="hero-diegetic-sub">code, art &amp; noise · digital reliquary</p>
      {!ogMode && (
        <button
          type="button"
          className="ink-trigger hero-diegetic-cta"
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
      <div className="hero-diegetic-motto">{SITE.motto}</div>
    </div>
  );
}
