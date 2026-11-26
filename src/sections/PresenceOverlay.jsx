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

export default function PresenceOverlay({ lanyard, forceInline = false }) {
  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const color = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;
  const src = avatarUrl(user);

  useEffect(() => {
    sceneBus.presenceColor = color;
  }, [color]);

  return (
    <article className="presence-diegetic" aria-labelledby="presence-heading">
      <h2 id="presence-heading" className="chapel-title presence-title">discord halo</h2>

      {forceInline ? (
        <div className="presence-inline-card">
          {src && <img className="presence-inline-avatar" src={src} alt={user?.username || 'mazu avatar'} />}
          <div className="presence-3d-user">{user?.username || 'mazu'}</div>
          <div className="presence-3d-status" style={{ color }}>
            <span className="presence-3d-dot" style={{ background: color }} aria-hidden="true" />
            <span>discord: {lanyard ? status : 'loading...'}</span>
          </div>
          {lanyard?.listening_to_spotify && lanyard.spotify && (
            <div className="presence-3d-spotify">
              <span className="c-red" aria-hidden="true">♪ </span>
              <span className="c-dim">i&apos;m currently listening to: </span>
              <span className="c-bone">{lanyard.spotify.song}</span>
              <span className="c-dim"> — {lanyard.spotify.artist}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="sr-only">
          <p>{user?.username || 'mazu'}</p>
          <p>discord: {lanyard ? status : 'loading...'}</p>
          {lanyard?.listening_to_spotify && lanyard.spotify && (
            <p>i&apos;m currently listening to: {lanyard.spotify.song} — {lanyard.spotify.artist}</p>
          )}
          <pre>{WING_ART}</pre>
        </div>
      )}
    </article>
  );
}
