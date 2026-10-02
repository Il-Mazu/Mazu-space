import { useMemo } from 'react';
import { count as dumpCount } from 'virtual:dump-images';
import { gamesCount } from './GamesWindow';
import './HomeWindow.css';

function formatRemote(url) {
  if (!url) return 'github.com';
  let clean = url.replace(/^git@/, '').replace(/^https?:\/\//, '');
  clean = clean.replace(/\.git$/, '').replace(':', '/');
  return clean;
}

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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠤⠴⣇⣠⣏⣰⠁⠀⠀⠀⠀`;

export default function HomeWindow({ commits, remote, buildDate, tracksCount, lanyard }) {
  const statusColor = STATUS_COLORS[lanyard?.discord_status] || '#888780';
  const user = lanyard?.discord_user;
  const avatarSrc = avatarUrl(user);
  const repoUrl = useMemo(() => formatRemote(remote), [remote]);

  return (
    <>
      <div className="discord-card">
        <div className="discord-card-inner">
          {lanyard ? (
            <>
              <div className="discord-wing-panel">
                <pre className="discord-wing">{WING_ART}</pre>
              </div>
              <div className="discord-card-center">
                <div className="discord-card-avatar">
                  {avatarSrc ? (
                    <img className="discord-avatar" src={avatarSrc} alt="avatar" />
                  ) : (
                    <div className="discord-avatar-placeholder" />
                  )}
                </div>
                <div className="discord-card-info">
                  <div className="discord-card-name">{user?.username || 'mazu'}</div>
                  <div className="discord-card-status" style={{ color: statusColor }}>● {lanyard.discord_status}</div>
                </div>
              </div>
              <div className="discord-wing-panel discord-wing-right">
                <pre className="discord-wing">{WING_ART}</pre>
              </div>
            </>
          ) : (
            <div className="discord-card-loading">discord: loading...</div>
          )}
        </div>
      </div>

      <div className="home-dashboard">
        <div className="home-panel">
          <div className="home-panel-title c-dim">── content ──</div>
          <div className="home-stat"><span className="c-red">♰</span> music: <span className="c-accent2">{tracksCount}</span></div>
          <div className="home-stat"><span className="c-red">♰</span> dump:  <span className="c-accent2">{dumpCount}</span></div>
          <div className="home-stat"><span className="c-red">♰</span> games:  <span className="c-accent2">{gamesCount}</span></div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title c-dim">── commits ──</div>
          {commits.length === 0 ? (
            <div className="home-stat c-dim">no commits</div>
          ) : (
            commits.map((c, i) => (
              <div key={i} className="home-stat home-commit" title={c.message}>
                <span className="c-accent2">{c.hash}</span>
                <span className="c-dim"> {c.message}</span>
              </div>
            ))
          )}
          <div className="home-stat" style={{ marginTop: 10 }}>
            <span className="c-dim">build:</span> <span className="c-accent2">{buildDate || '--'}</span>
          </div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title c-dim">── links ──</div>
          <a href={`https://${repoUrl}`} target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span>
            <span>github</span>
          </a>
          <a href="https://www.instagram.com/ilmazu_" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span>
            <span>instagram</span>
          </a>
          <a href="https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span>
            <span>spotify</span>
          </a>
        </div>
      </div>

      <span className="cursor" />
    </>
  );
}
