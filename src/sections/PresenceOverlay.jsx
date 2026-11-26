import { useEffect } from 'react';
import { PRESENCE } from '../data/content.js';
import { WING_ART } from '../data/ascii.js';
import { sceneBus } from '../state/sceneBus.js';
import './PresenceOverlay.css';

function avatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

export default function PresenceOverlay({ lanyard }) {
  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const color = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;
  const avatarSrc = avatarUrl(user);

  useEffect(() => {
    sceneBus.presenceColor = color;
  }, [color]);

  return (
    <article className="presence-card" aria-labelledby="presence-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL III // PRESENCE</span>
      </div>

      <h2 id="presence-heading" className="chapel-title">discord halo</h2>

      <div className="presence-user-row">
        <div className="presence-avatar-wrap" style={{ borderColor: color }}>
          {avatarSrc ? (
            <img className="presence-avatar" src={avatarSrc} alt={user?.username || 'mazu avatar'} />
          ) : (
            <span className="presence-avatar-fallback" aria-hidden="true">M</span>
          )}
        </div>

        <div className="presence-meta">
          <div className="presence-username">{user?.username || 'mazu'}</div>
          <div className="presence-status" style={{ color }}>
            <span className="presence-dot" style={{ background: color }} aria-hidden="true" />
            <span>discord: {lanyard ? status : 'loading...'}</span>
          </div>
        </div>
      </div>

      {lanyard?.listening_to_spotify && lanyard.spotify ? (
        <div className="presence-spotify">
          <span className="c-red" aria-hidden="true">♪ </span>
          <span className="c-dim">i&apos;m currently listening to: </span>
          <span className="c-bone">{lanyard.spotify.song}</span>
          <span className="c-dim"> — {lanyard.spotify.artist}</span>
        </div>
      ) : (
        <p className="chapel-copy c-dim">
          // live presence polled via Lanyard while active.
        </p>
      )}

      <pre className="sr-only" aria-hidden="true">{WING_ART}</pre>
    </article>
  );
}
