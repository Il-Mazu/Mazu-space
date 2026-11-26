import { useEffect, useRef } from 'react';
import { PRESENCE } from '../data/content.js';
import { trackUrl } from '../music/useMusic.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './LiveOverlay.css';

const STATUS_WORDS = { online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'at rest' };
const VERBS = { 0: 'playing', 1: 'streaming', 3: 'watching', 5: 'competing in' };
const PERIODS = [
  ['7day', 'this week'],
  ['1month', 'this month'],
  ['overall', 'all time'],
];

export function avatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

// Lanyard activities minus Spotify, which the altar already shows.
function rites(lanyard) {
  return (lanyard?.activities || [])
    .filter((a) => a.type !== 2)
    .map((a) => {
      if (a.type === 4) return a.state ? { key: a.id || 'custom', line: `"${a.state}"` } : null;
      const detail = [a.details, a.state].filter(Boolean).join(' · ');
      return { key: a.id || a.name, line: `${VERBS[a.type] || 'in'} ${a.name}`, detail };
    })
    .filter(Boolean);
}

function ago(ms) {
  const mins = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Progress({ startedAt, endsAt }) {
  const fillRef = useRef(null);
  const timeRef = useRef(null);
  useEffect(() => {
    const tick = () => {
      const total = endsAt - startedAt;
      const done = Math.min(total, Date.now() - startedAt);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${(done / total).toFixed(4)})`;
      if (timeRef.current) timeRef.current.textContent = `${clock(done)} / ${clock(total)}`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, endsAt]);
  return (
    <div className="live-progress">
      <div className="live-progress-line" aria-hidden="true">
        <div ref={fillRef} className="live-progress-fill" />
      </div>
      <span ref={timeRef} className="chapel-meta" />
    </div>
  );
}

function TrackLink({ track, className, children }) {
  return (
    <a
      className={className}
      href={trackUrl(track)}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={playHoverTick}
      onClick={playClickHit}
    >
      {children}
    </a>
  );
}

export default function LiveOverlay({ lanyard, music, showAvatar = false, compact = false }) {
  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const color = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;
  const src = showAvatar ? avatarUrl(user) : null;
  const { now, lastHeard, stats } = music;
  const activities = rites(lanyard);

  return (
    <article className="chapel-text live-text ui-depth-plane" aria-labelledby="live-heading">
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="live-heading" className="chapel-title">live</h2>
      {src && <img className="live-avatar" src={src} alt="" width="72" height="72" />}

      <p className="live-user">
        {user?.username || 'mazu'}
        <span className={`live-status live-status--${status}`}>
          <span className="live-dot" style={{ background: color, color }} aria-hidden="true" />
          {lanyard ? STATUS_WORDS[status] : 'reaching the halo...'}
        </span>
      </p>

      {activities.length > 0 && (
        <ul className="live-rites" aria-label="Current rites">
          {activities.map((a) => (
            <li key={a.key}>
              <span className="ink-cross" aria-hidden="true">♰</span> {a.line}
              {a.detail && <span className="c-dim"> · {a.detail}</span>}
            </li>
          ))}
        </ul>
      )}

      <section className="live-music" aria-label="Listening">
        {now ? (
          <>
            <p className="chapel-meta live-label">
              <span className="tilt-label">now playing</span>
            </p>
            <TrackLink track={now} className="live-track">
              <span className="live-track-title">{now.title}</span>
              <span className="live-track-artist">{now.artist}</span>
            </TrackLink>
            {now.startedAt && now.endsAt && <Progress startedAt={now.startedAt} endsAt={now.endsAt} />}
          </>
        ) : lastHeard ? (
          <>
            <p className="chapel-meta live-label">last heard {ago(lastHeard.playedAt)}</p>
            <TrackLink track={lastHeard} className="live-track live-track--dim">
              <span className="live-track-title">{lastHeard.title}</span>
              <span className="live-track-artist">{lastHeard.artist}</span>
            </TrackLink>
          </>
        ) : (
          <p className="chapel-meta live-label">silence</p>
        )}
      </section>

      {stats && stats.topTracks.length > 0 && (
        <MostPlayed collapsed={compact} music={music} stats={stats} />
      )}
    </article>
  );
}

function MostPlayed({ collapsed, music, stats }) {
  const body = (
    <>
      <div className="live-periods" role="group" aria-label="Period">
        {PERIODS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`live-period${music.period === id ? ' is-on' : ''}`}
            aria-pressed={music.period === id}
            onMouseEnter={playHoverTick}
            onClick={() => {
              playClickHit();
              music.setPeriod(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="live-top-list">
        {stats.topTracks.slice(0, 5).map((t) => (
          <li key={`${t.artist}-${t.title}`}>
            <TrackLink track={t} className="live-top-link">
              <span className="c-bone">{t.title}</span>
              <span className="c-dim"> — {t.artist}</span>
            </TrackLink>
            <span className="live-plays">{t.plays}</span>
          </li>
        ))}
      </ol>
      <p className="chapel-meta">
        {stats.topArtists.slice(0, 3).map((a) => a.name).join(' · ')}
        {stats.topArtists.length > 0 && ' · '}
        {stats.scrobbles.toLocaleString('en-US')} scrobbles
      </p>
    </>
  );
  // On phones the list would cover the altar, so it opens on demand.
  return collapsed ? (
    <details className="live-top">
      <summary className="ink-trigger live-top-summary">
        <span className="ink-cross" aria-hidden="true">♰</span> most played
      </summary>
      {body}
    </details>
  ) : (
    <section className="live-top" aria-label="Most played">
      {body}
    </section>
  );
}
