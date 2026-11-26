import { useEffect } from 'react';
import { PRESENCE } from '../data/content.js';
import { WING_ART } from '../data/ascii.js';
import { sceneBus } from '../state/sceneBus.js';
import './PresenceOverlay.css';

export default function PresenceOverlay({ lanyard }) {
  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || 'offline';
  const color = PRESENCE.statusColors[status] || PRESENCE.statusColors.offline;

  useEffect(() => {
    sceneBus.presenceColor = color;
  }, [color]);

  return (
    <article className="presence-header-card" aria-labelledby="presence-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL III // PRESENCE</span>
      </div>

      <h2 id="presence-heading" className="chapel-title presence-title">discord halo</h2>

      {/* Semantic text mirror for screen readers and search engines */}
      <div className="sr-only">
        <p>{user?.username || 'mazu'}</p>
        <p>discord: {lanyard ? status : 'loading...'}</p>
        {lanyard?.listening_to_spotify && lanyard.spotify && (
          <p>i&apos;m currently listening to: {lanyard.spotify.song} — {lanyard.spotify.artist}</p>
        )}
        <pre>{WING_ART}</pre>
      </div>
    </article>
  );
}
