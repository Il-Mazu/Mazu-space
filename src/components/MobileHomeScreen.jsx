import { useState, useEffect } from 'react';
import Icon from './Icon';
import Wallpaper from './Wallpaper';
import { DiscordCard, ContentStats, Links } from './HomeWindow';

const APPS = [
  { id: 'win-home', icon: 'home', label: 'Home' },
  { id: 'win-about', icon: 'about', label: 'About' },
  { id: 'win-music', icon: 'music', label: 'Music' },
  { id: 'win-dump', icon: 'dump', label: 'Gallery' },
  { id: 'win-term', icon: 'terminal', label: 'Terminal' },
  { id: 'win-games', icon: 'games', label: 'Games' },
];

export default function MobileHomeScreen({ onOpen, lanyard, remote, tracksCount, wallpaper }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mobile-home">
      <Wallpaper id={wallpaper} />

      <main className="mobile-home-content">
        <div className="mobile-status-bar c-dim">mazu-space</div>

        <div className="mobile-widget-clock">
          <div className="clock-time">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="clock-date c-dim">{clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>

        <DiscordCard lanyard={lanyard} />
        <div className="mobile-stats-row"><ContentStats tracksCount={tracksCount} /></div>
        <div className="mobile-links-row"><Links remote={remote} /></div>

        <nav className="mobile-home-grid" aria-label="Apps">
          {APPS.map(app => (
            <button key={app.id} className="mobile-home-app" onClick={() => onOpen(app.id)}>
              <span className="mobile-home-app-icon"><Icon name={app.icon} /></span>
              <span className="mobile-home-app-label">{app.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
