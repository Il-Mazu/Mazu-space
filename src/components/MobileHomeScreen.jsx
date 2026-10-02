import { useState, useEffect, useMemo } from 'react';
import { count as dumpCount } from 'virtual:dump-images';
import { gamesCount } from './GamesWindow';
import Icon from './Icon';
import Wallpaper from './Wallpaper';

const APPS = [
  { id: 'win-home', icon: 'home', label: 'Home' },
  { id: 'win-about', icon: 'about', label: 'About' },
  { id: 'win-music', icon: 'music', label: 'Music' },
  { id: 'win-dump', icon: 'dump', label: 'Gallery' },
  { id: 'win-term', icon: 'terminal', label: 'Terminal' },
  { id: 'win-games', icon: 'games', label: 'Games' },
];

const STATUS_COLORS = { online: '#1D9E75', idle: '#BA7517', dnd: '#A32D2D', offline: '#888780' };

function avatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

const WING_ART = `⠀⠀⠀⠀⢀⣴⢿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⡾⠁⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢠⢺⠃⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⠏⢸⡄⠈⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢸⡀⢸⡄⠀⠹⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢀⡜⡇⠈⣿⡀⠀⠙⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⠀⢳⠄⠹⣿⡄⠀⠈⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣸⠆⢸⣧⡄⢸⣿⣶⠀⢠⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠷⡀⠹⣷⣄⣻⣿⡟⠺⣷⡀⠉⠓⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀
⢧⠀⣶⣄⡘⢿⣦⣽⣿⣄⠈⢱⡦⠀⠀⠉⠓⢤⡀⠀⠀⠀⠀⠀
⠘⣇⠈⠻⣷⡜⢻⣧⠉⠻⣄⠈⢻⣶⣴⠶⡄⠀⠙⡆⠀⠀⠀⠀
⠀⢻⠉⣄⠈⢿⣿⣿⣷⠀⠀⣶⣤⣀⣷⣀⠀⠀⠀⣸⠀⠀⠀⠀
⠀⠀⢧⡈⢿⣥⣍⣿⠉⠉⠃⢶⣦⣿⠀⠀⠀⠀⡚⠋⠀⠀⠀⠀
⠀⠀⠈⠳⣤⣈⠛⠻⢷⣦⣤⡄⣶⣾⣿⠃⠀⠀⠛⢦⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠉⠒⠒⣾⠋⠁⠀⣈⣽⣿⣷⡆⠀⠀⠀⠘⡄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠹⠦⢴⠋⠁⠀⠹⣿⣿⣿⠀⠀⠀⠙⣄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⢤⠴⠋⠀⡀⠛⠿⠟⡇⠠⠤⠤⠷
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠤⠴⣇⣠⣏⣰⠁⠀⠀⠀⠀`;

function formatRemote(url) {
  if (!url) return 'github.com';
  let clean = url.replace(/^git@/, '').replace(/^https?:\/\//, '');
  clean = clean.replace(/\.git$/, '').replace(':', '/');
  return clean;
}

export default function MobileHomeScreen({
  onOpen, lanyard, commits, remote, buildDate, tracksCount, wallpaper,
}) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const timeStr = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const statusColor = STATUS_COLORS[lanyard?.discord_status] || '#888780';
  const user = lanyard?.discord_user;
  const avatarSrc = avatarUrl(user);
  const repoUrl = useMemo(() => formatRemote(remote), [remote]);

  return (
    <div className="mobile-home">
      <Wallpaper id={wallpaper} />

      <div className="mobile-home-content">
        <div className="mobile-status-bar">
          <span className="c-dim">mazu-space</span>
        </div>

        <div className="mobile-widget-clock">
          <div className="clock-time">{timeStr}</div>
          <div className="clock-date c-dim">{dateStr}</div>
        </div>

        <div className="mobile-discord-card">
          <div className="mobile-discord-inner">
            <div className="discord-wing-panel">
              <pre className="discord-wing">{WING_ART}</pre>
            </div>
            <div className="mobile-discord-center">
              <div className="discord-card-avatar">
                {avatarSrc ? (
                  <img className="discord-avatar" src={avatarSrc} alt="avatar" />
                ) : (
                  <div className="discord-avatar-placeholder" />
                )}
              </div>
              <div className="discord-card-info">
                <div className="discord-card-name">{user?.username || 'mazu'}</div>
                <div className="discord-card-status" style={{ color: statusColor }}>● {lanyard?.discord_status || 'offline'}</div>
              </div>
            </div>
            <div className="discord-wing-panel discord-wing-right">
              <pre className="discord-wing">{WING_ART}</pre>
            </div>
          </div>
        </div>

        <div className="mobile-stats-row">
          <span className="home-stat"><span className="c-red">♰</span> music <span className="c-accent2">{tracksCount}</span></span>
          <span className="home-stat"><span className="c-red">♰</span> dump <span className="c-accent2">{dumpCount}</span></span>
          <span className="home-stat"><span className="c-red">♰</span> games <span className="c-accent2">{gamesCount}</span></span>
        </div>

        <div className="mobile-links-row">
          <a href={`https://${repoUrl}`} target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>github</span>
          </a>
          <a href="https://www.instagram.com/ilmazu_" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>instagram</span>
          </a>
          <a href="https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>spotify</span>
          </a>
        </div>

        <div className="mobile-home-grid">
          {APPS.map(app => (
            <div key={app.id} className="mobile-home-app" onClick={() => onOpen(app.id)}>
              <div className="mobile-home-app-icon">
                <Icon name={app.icon} />
              </div>
              <div className="mobile-home-app-label">{app.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
