import { images, count } from 'virtual:dump-images';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './Dump.css';

export default function DumpOverlay({ onOpenLightbox }) {
  return (
    <article className="chapel-text dump-text ui-depth-plane" aria-labelledby="dump-heading">
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="dump-heading" className="chapel-title">dump/</h2>
      <p className="chapel-copy dump-copy">{count} stained glass shards · touch any fragment</p>

      <ul className="dump-shard-row" aria-label="Dump gallery shards">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              className="ink-trigger dump-shard-link"
              onMouseEnter={playHoverTick}
              onClick={() => {
                playClickHit();
                onOpenLightbox(i);
              }}
              aria-label={`Open shard ${i + 1}: ${img.label}`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          </li>
        ))}
      </ul>

      <p className="chapel-meta">← / → · esc</p>
    </article>
  );
}
