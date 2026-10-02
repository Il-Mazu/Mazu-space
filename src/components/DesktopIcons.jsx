import Icon from './Icon';
import './DesktopIcons.css';

const icons = [
  { id: 'win-home', icon: 'home', label: 'home.txt' },
  { id: 'win-about', icon: 'about', label: 'about.txt' },
  { id: 'win-music', icon: 'music', label: 'player.exe' },
  { id: 'win-dump', icon: 'dump', label: 'dump/' },
  { id: 'win-term', icon: 'terminal', label: 'cmd.exe' },
  { id: 'win-scope', icon: 'scope', label: 'scope.exe' },
  { id: 'win-games', icon: 'games', label: 'games.exe' },
];

export default function DesktopIcons({ onOpen }) {
  return (
    <nav id="desktop-icons" aria-label="Desktop">
      {icons.map(icon => (
        <button key={icon.id} className="desk-icon" onClick={() => onOpen(icon.id)}>
          <Icon name={icon.icon} className="desk-icon-svg" />
          <span className="desk-icon-label">{icon.label}</span>
        </button>
      ))}
    </nav>
  );
}
