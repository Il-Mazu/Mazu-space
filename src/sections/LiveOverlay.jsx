import { PRESENCE } from '../data/content.js';
import './LiveOverlay.css';

export function avatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

export default function LiveOverlay({ lanyard, showAvatar = false }) {
  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const color = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;
  const src = showAvatar ? avatarUrl(user) : null;

  return (
    <article className="chapel-text live-text ui-depth-plane" aria-labelledby="live-heading">
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="live-heading" className="chapel-title">live</h2>
      {src && <img className="live-avatar" src={src} alt="" width="72" height="72" />}
      <p className="live-user">{user?.username || 'mazu'}</p>
      <p className="chapel-meta live-status">
        <span className="live-dot" style={{ background: color, color }} aria-hidden="true" />
        discord: {lanyard ? status : 'reaching the halo...'}
      </p>
      {lanyard?.listening_to_spotify && lanyard.spotify && (
        <p className="chapel-copy live-track">
          <span className="c-red" aria-hidden="true">♪ </span>
          <span className="c-bone">{lanyard.spotify.song}</span>
          <span className="c-dim"> — {lanyard.spotify.artist}</span>
        </p>
      )}
    </article>
  );
}
