import { useCallback, useEffect, useRef, useState } from 'react';
import { images } from 'virtual:dump-images';
import { playClickHit, playHoverTick, playLightboxTone } from '../audio/AudioEngine.js';
import './Dump.css';

export default function DumpLightbox({ index, onClose, onChange }) {
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const touchStart = useRef(null);
  const wasActiveRef = useRef(false);
  const total = images.length;
  const active = index !== null && index >= 0 && index < total ? images[index] : null;

  useEffect(() => {
    const isNowActive = Boolean(active);
    if (isNowActive && !wasActiveRef.current) {
      playLightboxTone(true);
    } else if (!isNowActive && wasActiveRef.current) {
      playLightboxTone(false);
    }
    wasActiveRef.current = isNowActive;
  }, [active]);

  const prev = useCallback(() => {
    playClickHit();
    onChange((index - 1 + total) % total);
  }, [index, total, onChange]);

  const next = useCallback(() => {
    playClickHit();
    onChange((index + 1) % total);
  }, [index, total, onChange]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, onClose, prev, next]);

  if (!active) return null;

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwipeOffset({ x: 0, y: 0 });
  };

  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) setSwipeOffset({ x: dx * 0.4, y: 0 });
    else if (dy > 0) setSwipeOffset({ x: 0, y: dy * 0.4 });
  };

  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    setSwipeOffset({ x: 0, y: 0 });
    if (dy > 90 && Math.abs(dx) < dy * 0.6) {
      onClose();
    } else if (dx > 50) {
      prev();
    } else if (dx < -50) {
      next();
    }
  };

  return (
    <div
      className="dump-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Stained glass shard ${index + 1} of ${total}`}
      onClick={onClose}
    >
      <div className="dump-lb-topbar" onClick={(e) => e.stopPropagation()}>
        <span className="dump-lb-counter">
          <span className="ink-cross" aria-hidden="true">♰</span>
          <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {active.label}</span>
        </span>
        <button
          type="button"
          className="ink-trigger dump-lb-close"
          onMouseEnter={playHoverTick}
          onClick={onClose}
          autoFocus
        >
          <span className="ink-cross" aria-hidden="true">♰</span>
          <span>close [esc]</span>
        </button>
      </div>

      <div
        className="dump-lb-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={active.src}
          alt={active.label}
          className="dump-lb-img"
          style={{
            transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`,
            opacity: Math.max(0.4, 1 - swipeOffset.y / 260),
          }}
        />
      </div>

      <div className="dump-lb-nav" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ink-trigger dump-lb-btn"
          onMouseEnter={playHoverTick}
          onClick={prev}
          aria-label="Previous image"
        >
          ← prev
        </button>
        <button
          type="button"
          className="ink-trigger dump-lb-btn"
          onMouseEnter={playHoverTick}
          onClick={next}
          aria-label="Next image"
        >
          next →
        </button>
      </div>
    </div>
  );
}
