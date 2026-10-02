import { count as dumpCount } from 'virtual:dump-images';
import { gamesCount } from './GamesWindow';
import './HomeWindow.css';

// Shared by the desktop window and the mobile home screen.

export function formatRemote(url) {
  if (!url) return 'github.com';
  return url.replace(/^git@/, '').replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(':', '/');
}

const STATUS_COLORS = { online: '#2bb57f', idle: '#d68d1f', dnd: '#e5484d', offline: '#8a8a94' };

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

export function DiscordCard({ lanyard }) {
  if (!lanyard) {
    return <div className="discord-card"><div className="discord-card-loading">discord: loading...</div></div>;
  }
  const user = lanyard.discord_user;
  const avatarSrc = avatarUrl(user);
  return (
    <div className="discord-card">
      <div className="discord-card-inner">
        <div className="discord-wing-panel" aria-hidden="true">
          <pre className="discord-wing">{WING_ART}</pre>
        </div>
        <div className="discord-card-center">
          <div className="discord-card-avatar">
            {avatarSrc
              ? <img className="discord-avatar" src={avatarSrc} alt="" />
              : <div className="discord-avatar-placeholder" />}
          </div>
          <div className="discord-card-info">
            <div className="discord-card-name">{user?.username || 'mazu'}</div>
            <div className="discord-card-status" style={{ color: STATUS_COLORS[lanyard.discord_status] || STATUS_COLORS.offline }}>
              <span aria-hidden="true">● </span>discord: {lanyard.discord_status}
            </div>
          </div>
        </div>
        <div className="discord-wing-panel discord-wing-right" aria-hidden="true">
          <pre className="discord-wing">{WING_ART}</pre>
        </div>
      </div>
    </div>
  );
}

export function ContentStats({ tracksCount }) {
  return [['music', tracksCount], ['dump', dumpCount], ['games', gamesCount]].map(([label, n]) => (
    <div key={label} className="home-stat">
      <span className="c-red" aria-hidden="true">♰ </span>{label}: <span className="c-accent2">{n}</span>
    </div>
  ));
}

export function Links({ remote }) {
  const links = [
    ['github', `https://${formatRemote(remote)}`],
    ['instagram', 'https://www.instagram.com/ilmazu_'],
    ['spotify', 'https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj'],
  ];
  return links.map(([label, href]) => (
    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="link-item">
      <span className="c-red" aria-hidden="true">&gt;</span>
      <span>{label}</span>
    </a>
  ));
}

export default function HomeWindow({ commits, remote, buildDate, tracksCount, lanyard }) {
  return (
    <>
      <DiscordCard lanyard={lanyard} />

      <div className="home-dashboard">
        <section className="home-panel" aria-labelledby="home-content">
          <h2 className="home-panel-title c-dim" id="home-content">── content ──</h2>
          <ContentStats tracksCount={tracksCount} />
        </section>

        <section className="home-panel" aria-labelledby="home-commits">
          <h2 className="home-panel-title c-dim" id="home-commits">── commits ──</h2>
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
        </section>

        <section className="home-panel" aria-labelledby="home-links">
          <h2 className="home-panel-title c-dim" id="home-links">── links ──</h2>
          <Links remote={remote} />
        </section>
      </div>

      <span className="cursor" aria-hidden="true" />
    </>
  );
}
