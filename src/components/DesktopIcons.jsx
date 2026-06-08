const icons = [
  { id: 'win-about', img: '[SYS]', label: 'about.txt' },
  { id: 'win-blog', img: '[LOG]', label: 'blog.txt' },
  { id: 'win-music', img: '[MP3]', label: 'player.exe' },
  { id: 'win-dump', img: '[BIN]', label: 'dump/' },
  { id: 'win-links', img: '[NET]', label: 'links.ini' },
  { id: 'win-term', img: '[$]', label: 'cmd.exe' },
];

export default function DesktopIcons({ onOpen }) {
  return (
    <div id="desktop-icons">
      {icons.map(icon => (
        <div key={icon.id} className="desk-icon" onClick={() => onOpen(icon.id)}>
          <div className="desk-icon-img">{icon.img}</div>
          <div className="desk-icon-label">{icon.label}</div>
        </div>
      ))}
    </div>
  );
}
