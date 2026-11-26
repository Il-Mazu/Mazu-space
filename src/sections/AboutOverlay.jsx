import { ABOUT } from '../data/content.js';
import { ANGEL_ART, CROSS_SWORD_ART } from '../data/ascii.js';
import './AboutOverlay.css';

export default function AboutOverlay() {
  return (
    <article className="about-card torn-paper" aria-labelledby="about-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL II // WHOAMI</span>
      </div>

      <h2 id="about-heading" className="chapel-title">whoami</h2>

      <div className="about-prompt">{ABOUT.prompt}</div>

      <div className="about-greeting">
        <p className="c-bone">// {ABOUT.greeting[0]}</p>
        <p className="c-dim">// {ABOUT.greeting[1]}</p>
        <p className="c-dim">// {ABOUT.greeting[2]}</p>
      </div>

      <dl className="about-facts">
        {ABOUT.facts.map((item) => (
          <div key={item.key} style={{ display: 'contents' }}>
            <dt className="about-fact-key">
              <span className="c-red" aria-hidden="true">♰</span>
              <span>{item.key}</span>
            </dt>
            <dd className="about-fact-val">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="about-footer">
        <span className="about-motto">{ABOUT.motto}</span>
        <span className="about-stamp">RELIQUARY // 02</span>
      </div>

      <pre className="sr-only" aria-hidden="true">{ANGEL_ART}\n{CROSS_SWORD_ART}</pre>
    </article>
  );
}
