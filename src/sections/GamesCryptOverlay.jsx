import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GAMES,
  GAMES_DISCLAIMER,
  GAME_CATEGORIES,
  RAWG_ATTRIBUTION,
} from '../data/games.js';
import { GAMES_ASCII } from '../data/ascii.js';
import covers from 'virtual:game-covers';
import useScreenMode from '../hooks/useScreenMode.js';
import './GamesCrypt.css';

const ROW_HEIGHT = 114;

export default function GamesCryptOverlay() {
  const mode = useScreenMode();
  const isMobile = mode === 'mobile';
  const cols = isMobile ? 1 : 2;

  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [scrollTop, setScrollTop] = useState(0);
  const [boxHeight, setBoxHeight] = useState(340);
  const scrollRef = useRef(null);

  const counts = useMemo(() => ({
    all: GAMES.length,
    favorites: GAMES.filter((g) => g.category === 'favorites').length,
    playing: GAMES.filter((g) => g.category === 'playing').length,
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
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setBoxHeight(el.clientHeight || 340));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [category, sort]);

  const totalRows = Math.ceil(filtered.length / cols);
  const totalHeight = totalRows * ROW_HEIGHT;
  const overscan = 2;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + boxHeight) / ROW_HEIGHT) + overscan);

  const visibleRows = [];
  for (let r = startRow; r <= endRow; r++) {
    visibleRows.push({
      rowIndex: r,
      items: filtered.slice(r * cols, r * cols + cols),
    });
  }

  return (
    <article className="games-crypt-panel" aria-labelledby="games-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL VI // THE CRYPT ({filtered.length})</span>
      </div>

      <h2 id="games-heading" className="chapel-title">game library</h2>

      <pre className="games-ascii-banner" aria-hidden="true">{GAMES_ASCII}</pre>

      <p className="games-disclaimer">{GAMES_DISCLAIMER}</p>

      <div className="games-toolbar">
        <div className="games-pill-group" role="group" aria-label="Filter games by category">
          {GAME_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`games-pill ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              {cat.symbol} {cat.label} ({counts[cat.key]})
            </button>
          ))}
        </div>

        <div className="games-pill-group" role="group" aria-label="Sort games">
          {[
            ['default', 'DEF'],
            ['vote-desc', 'VOTE ↓'],
            ['vote-asc', 'VOTE ↑'],
            ['name', 'NAME'],
            ['year', 'YEAR'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`games-pill ${sort === key ? 'active' : ''}`}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="games-scroll-box"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        tabIndex={0}
        aria-label="Scrollable game crypt list"
      >
        <div className="games-virt-canvas" style={{ height: totalHeight }}>
          {visibleRows.map(({ rowIndex, items }) => (
            <div
              key={rowIndex}
              className="games-virt-row"
              style={{ top: rowIndex * ROW_HEIGHT }}
            >
              {items.map((game) => {
                const data = covers[game.name];
                const year = data?.released ? data.released.slice(0, 4) : '—';
                const hasVote = game.vote !== undefined && game.vote !== null;
                const condemned = hasVote && game.vote <= 45;
                const severe = hasVote && game.vote <= 20;

                return (
                  <div
                    key={game.name}
                    className={`game-crypt-card${condemned ? ' condemned' : ''}${severe ? ' condemned-severe' : ''}`}
                  >
                    <div className="game-crypt-thumb">
                      {data?.background_image ? (
                        <img src={data.background_image} alt={game.name} loading="lazy" />
                      ) : (
                        <span className="game-crypt-sigil" aria-hidden="true">
                          {game.name.slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="game-crypt-body">
                      <div>
                        <div className="game-crypt-name" title={game.name}>{game.name}</div>
                        <div className="game-crypt-meta">
                          {year}{data?.genres?.length ? ` · ${data.genres.slice(0, 2).join(' · ')}` : ''}
                        </div>
                      </div>

                      <div className="game-crypt-bottom">
                        <div>
                          <span className="game-crypt-vote">{hasVote ? game.vote : '--'}</span>
                          <span className="game-crypt-max">/100</span>
                        </div>

                        {condemned ? (
                          <span className="game-condemned-stamp">♰ CONDEMNED</span>
                        ) : game.category === 'playing' ? (
                          <span className="game-playing-stamp">▶ PLAYING</span>
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

      <div className="games-footer-attr">
        Game data sourced from{' '}
        <a href={RAWG_ATTRIBUTION.href} target="_blank" rel="noopener noreferrer">
          {RAWG_ATTRIBUTION.label}
        </a>
      </div>
    </article>
  );
}
