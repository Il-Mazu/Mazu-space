import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GAMES,
  GAMES_DISCLAIMER,
  GAME_CATEGORIES,
  COVERS_ATTRIBUTION,
} from '../data/games.js';
import covers from 'virtual:game-covers';
import useScreenMode from '../hooks/useScreenMode.js';
import { playClickHit, playHoverTick, playLightboxTone } from '../audio/AudioEngine.js';
import './GamesCrypt.css';

const GAMES_TOTAL = GAMES.length;
const FAVORITES_COUNT = GAMES.filter((g) => g.category === 'favorites').length;
const PLAYING_COUNT = GAMES.filter((g) => g.category === 'playing').length;

const SORTS = [
  ['default', 'def'],
  ['vote-desc', 'vote ↓'],
  ['vote-asc', 'vote ↑'],
  ['name', 'name'],
  ['year', 'year'],
];

export default function GamesCryptOverlay({ onOpen }) {
  return (
    <article className="chapel-text games-text ui-depth-plane" aria-labelledby="games-heading">
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="games-heading" className="chapel-title">hall of fame</h2>
      <p className="chapel-copy games-counts">
        {GAMES_TOTAL} relics · {FAVORITES_COUNT} favored · {PLAYING_COUNT} active
      </p>
      <button
        type="button"
        className="ink-trigger"
        onMouseEnter={playHoverTick}
        onClick={() => {
          playClickHit();
          onOpen?.();
        }}
      >
        <span className="ink-cross" aria-hidden="true">♰</span>
        <span>open the crypt ({GAMES_TOTAL})</span>
      </button>
    </article>
  );
}

export function GamesCryptModal({ open, onClose }) {
  const mode = useScreenMode();
  const isMobile = mode === 'mobile';
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [scrollTop, setScrollTop] = useState(0);
  const [boxHeight, setBoxHeight] = useState(520);
  const scrollRef = useRef(null);
  const wasOpenRef = useRef(false);

  const cols = isMobile ? 2 : 4;
  const rowHeight = isMobile ? 228 : 278;

  useEffect(() => {
    if (open && !wasOpenRef.current) playLightboxTone(true);
    else if (!open && wasOpenRef.current) playLightboxTone(false);
    wasOpenRef.current = open;
  }, [open]);

  const counts = useMemo(() => ({
    all: GAMES.length,
    favorites: FAVORITES_COUNT,
    playing: PLAYING_COUNT,
    played: GAMES.filter((g) => g.category === 'played').length,
  }), []);

  const filtered = useMemo(() => {
    const base = category === 'all' ? [...GAMES] : GAMES.filter((g) => g.category === category);
    if (sort === 'name') {
      base.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'vote-asc') {
      base.sort((a, b) => (a.vote ?? 999) - (b.vote ?? 999));
    } else if (sort === 'vote-desc') {
      base.sort((a, b) => (b.vote ?? -1) - (a.vote ?? -1));
    } else if (sort === 'year') {
      base.sort((a, b) => (covers[b.name]?.released || '0').localeCompare(covers[a.name]?.released || '0'));
    }
    return base;
  }, [category, sort]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;
    setBoxHeight(el.clientHeight || 520);
    const ro = new ResizeObserver(() => setBoxHeight(el.clientHeight || 520));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [category, sort, open]);

  if (!open) return null;

  const totalRows = Math.ceil(filtered.length / cols);
  const totalHeight = totalRows * rowHeight;
  const overscan = 2;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + boxHeight) / rowHeight) + overscan);

  const visibleRows = [];
  for (let r = startRow; r <= endRow; r++) {
    visibleRows.push({
      rowIndex: r,
      items: filtered.slice(r * cols, r * cols + cols),
    });
  }

  return (
    <div
      className="crypt-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crypt-modal-title"
    >
      <div className="crypt-surface">
        <header className="crypt-header">
          <div className="crypt-title-block">
            <h2 id="crypt-modal-title" className="crypt-heading xerox-hover">the crypt</h2>
            <p className="crypt-disclaimer">{GAMES_DISCLAIMER}</p>
          </div>

          <button
            type="button"
            className="ink-trigger crypt-close"
            onMouseEnter={playHoverTick}
            onClick={() => {
              playClickHit();
              onClose?.();
            }}
            aria-label="Close crypt"
          >
            <span className="ink-cross" aria-hidden="true">♰</span>
            <span>close [esc]</span>
          </button>
        </header>

        <div className="crypt-controls">
          <div className="crypt-filter-group" role="group" aria-label="Filter games by category">
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`crypt-link-btn ${category === cat.key ? 'active' : ''}`}
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  setCategory(cat.key);
                }}
              >
                <span className="crypt-link-sym" aria-hidden="true">{cat.symbol}</span>
                <span>{cat.label.toLowerCase()} ({counts[cat.key]})</span>
              </button>
            ))}
          </div>

          <div className="crypt-filter-group" role="group" aria-label="Sort games">
            {SORTS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`crypt-link-btn ${sort === key ? 'active' : ''}`}
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  setSort(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="crypt-scroll"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          tabIndex={0}
          aria-label="Scrollable game crypt list"
        >
          <div className="crypt-virt-canvas" style={{ height: totalHeight }}>
            {visibleRows.map(({ rowIndex, items }) => (
              <div
                key={rowIndex}
                className="crypt-virt-row"
                style={{ top: rowIndex * rowHeight, '--crypt-cols': cols }}
              >
                {items.map((game) => {
                  const data = covers[game.name];
                  const year = data?.released ? data.released.slice(0, 4) : '----';
                  const hasVote = game.vote !== undefined && game.vote !== null;
                  const condemned = hasVote && game.vote <= 45;
                  const severe = hasVote && game.vote <= 20;

                  return (
                    <div
                      key={game.name}
                      className={`crypt-item${condemned ? ' condemned' : ''}${severe ? ' condemned-severe' : ''}`}
                    >
                      <div className="game-crypt-thumb crypt-item-art">
                        {data?.background_image ? (
                          <img src={data.background_image} alt={game.name} loading="lazy" />
                        ) : (
                          <span className="crypt-sigil" aria-hidden="true">
                            {game.name.slice(0, 2)}
                          </span>
                        )}
                      </div>

                      <div className="crypt-item-meta">
                        <div className="crypt-item-info">
                          <div className="crypt-item-name" title={game.name}>{game.name}</div>
                          <div className="crypt-item-sub">
                            {year}
                            {data?.genres?.length ? ` / ${data.genres.slice(0, 2).join(', ')}` : ''}
                          </div>
                        </div>

                        <div className="crypt-item-foot">
                          <div className="crypt-vote-wrap">
                            <span className="crypt-vote">{hasVote ? game.vote : '--'}</span>
                            <span className="crypt-vote-max">/100</span>
                          </div>

                          {condemned ? (
                            <span className="crypt-stamp">♰ condemned</span>
                          ) : game.category === 'playing' ? (
                            <span className="crypt-playing">▶ playing</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <footer className="crypt-footer">
          <span>
            source:{' '}
            <a href={COVERS_ATTRIBUTION.href} target="_blank" rel="noopener noreferrer">
              {COVERS_ATTRIBUTION.label}
            </a>
          </span>
          <span>{filtered.length} entries shown</span>
        </footer>
      </div>
    </div>
  );
}
