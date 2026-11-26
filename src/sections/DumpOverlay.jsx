import { images, count } from 'virtual:dump-images';
import './Dump.css';

export default function DumpOverlay({ onOpenLightbox }) {
  return (
    <article className="dump-panel" aria-labelledby="dump-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL V // STAINED GLASS</span>
      </div>

      <h2 id="dump-heading" className="chapel-title">dump/</h2>

      <p className="chapel-copy c-dim">
        // {count} shards suspended in the bay. click any glass fragment or pick below.
      </p>

      <div className="dump-grid-mini" role="list" aria-label="Dump gallery shards">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className="dump-thumb-btn"
            onClick={() => onOpenLightbox(i)}
            aria-label={`Open shard ${i + 1}: ${img.label}`}
          >
            <img src={img.thumb} alt={img.label} loading="lazy" />
            <span className="dump-thumb-idx" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>

      <div className="dump-hint">
        ← / → navigate &middot; Esc close
      </div>
    </article>
  );
}
