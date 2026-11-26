import { ABOUT } from '../data/content.js';
import './AboutOverlay.css';

export default function AboutOverlay() {
  return (
    <article className="chapel-text about-text ui-depth-plane" aria-labelledby="about-heading">
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
