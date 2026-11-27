import projects from 'virtual:projects';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './Works.css';

export default function WorksOverlay({ onOpenWork }) {
  return (
    <article className="chapel-text works-text ui-depth-plane" aria-labelledby="works-heading">
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="works-heading" className="chapel-title">works</h2>
      <p className="chapel-copy works-copy">
        {projects.length} reliquaries · touch one to read it
      </p>
      <ul className="works-index">
        {projects.map((p, i) => (
          <li key={p.repo}>
            <button
              type="button"
              className="ink-trigger works-index-item"
              onMouseEnter={playHoverTick}
              onClick={() => {
                playClickHit();
                onOpenWork(i);
              }}
            >
              <span className="ink-cross" aria-hidden="true">♰</span>
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
