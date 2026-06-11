import homeIcon from '../../assets/icons/home.png';
import aboutIcon from '../../assets/icons/about.png';
import blogIcon from '../../assets/icons/blog.png';
import musicIcon from '../../assets/icons/music.png';
import dumpIcon from '../../assets/icons/dump.png';
import scopeIcon from '../../assets/icons/scope.png';

const CmdIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="desk-icon-svg">
    <path d="M20 22H4v-2h16v2ZM4 20H2V4h2v16Zm18 0h-2V4h2v16ZM8 18H6v-2h2v2Zm8 0h-4v-2h4v2Zm-6-2H8v-2h2v2Zm-2-2H6v-2h2v2ZM20 4H4V2h16v2Z"/>
  </svg>
);

const GamepadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="desk-icon-svg">
    <path d="M20 20H4v-2h16v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12Zm-12-7h2v2h-2v2H8v-2H6v-2h2V9h2v2Zm8 4h-2v-2h2v2Zm-2-4h-2V9h2v2Zm4-5H4V4h16v2Z"/>
  </svg>
);

const icons = [
  { id: 'win-home', img: homeIcon, label: 'home.txt' },
  { id: 'win-about', img: aboutIcon, label: 'about.txt' },
  { id: 'win-blog', img: blogIcon, label: 'blog.txt' },
  { id: 'win-music', img: musicIcon, label: 'player.exe' },
  { id: 'win-dump', img: dumpIcon, label: 'dump/' },
  { id: 'win-term', svg: CmdIcon, label: 'cmd.exe' },
  { id: 'win-scope', img: scopeIcon, label: 'scope.exe' },
  { id: 'win-games', svg: GamepadIcon, label: 'games.exe' },
];

export default function DesktopIcons({ onOpen }) {
  return (
    <div id="desktop-icons">
      {icons.map(icon => (
        <div key={icon.id} className="desk-icon" onClick={() => onOpen(icon.id)}>
          <div className="desk-icon-img">
            {icon.svg
              ? <icon.svg />
              : icon.img
                ? <img src={icon.img} alt="" className={'desk-icon-png' + (icon.id === 'win-home' ? ' home-icon' : '')} />
                : '[SYS]'
            }
          </div>
          <div className="desk-icon-label">{icon.label}</div>
        </div>
      ))}
    </div>
  );
}
