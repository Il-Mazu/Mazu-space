import { images, count } from 'virtual:dump-images';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './Dump.css';

export default function DumpOverlay({ onOpenLightbox, isMobile = false, forceInline = false }) {
  if (!isMobile && !forceInline) {
    return (
      <article className="sr-only" aria-labelledby="dump-heading-sr">
        <h2 id="dump-heading-sr">dump/</h2>
        <p>{count} stained glass shards</p>
        {images.map((img, i) => (
          <button key={img.src} type="button" onClick={() => onOpenLightbox(i)}>
            {img.label}
          </button>
        ))}
      </article>
    );
  }

  return (
    <article className="dump-diegetic" aria-labelledby="dump-heading">
      <div className="dump-diegetic-wash" aria-hidden="true" />
      <h2 id="dump-heading" className="chapel-title">dump/</h2>
      <p className="dump-diegetic-copy">
        {count} stained glass shards · touch any fragment
      </p>

      <div className="dump-shard-row" role="list" aria-label="Dump gallery shards">
        {images.map((img, i) => (
          <button
            key={img.src}
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
        ))}
      </div>

      <div className="dump-diegetic-hint">← / → · esc</div>
    </article>
  );
}
