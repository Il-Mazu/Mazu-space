import { ABOUT } from '../data/content.js';
import { ANGEL_ART, CROSS_SWORD_ART } from '../data/ascii.js';
import './AboutOverlay.css';

export default function AboutOverlay({ isMobile = false, forceInline = false }) {
  // Desktop WebGL About lives in 3D space via DiegeticStageUI; keep semantic text mirror for AT/SEO
  if (!isMobile && !forceInline) {
    return (
      <article className="sr-only" aria-labelledby="about-heading-sr">
        <h2 id="about-heading-sr">whoami</h2>
        <div>{ABOUT.prompt}</div>
        {ABOUT.greeting.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <dl>
          {ABOUT.facts.map((item) => (
            <div key={item.key}>
              <dt>{item.key}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <p>{ABOUT.motto}</p>
        <pre>{ANGEL_ART}\n{CROSS_SWORD_ART}</pre>
      </article>
    );
  }

  return (
    <article className="about-diegetic" aria-labelledby="about-heading">
      <div className="about-diegetic-wash" aria-hidden="true" />
      <h2 id="about-heading" className="chapel-title">whoami</h2>
      <div className="about-diegetic-prompt">{ABOUT.prompt}</div>

      <div className="about-diegetic-greeting">
        <p className="c-bone">{ABOUT.greeting[0]}</p>
        <p>{ABOUT.greeting[1]}</p>
        <p>{ABOUT.greeting[2]}</p>
      </div>

      <dl className="about-diegetic-facts">
        {ABOUT.facts.map((item) => (
          <div key={item.key} className="about-diegetic-row">
            <dt>
              <span className="ink-cross" aria-hidden="true">♰</span>
              <span>{item.key}</span>
            </dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="about-diegetic-motto">{ABOUT.motto}</div>
      <pre className="sr-only" aria-hidden="true">{ANGEL_ART}\n{CROSS_SWORD_ART}</pre>
    </article>
  );
}
