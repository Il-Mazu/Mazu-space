const items = [
  { id: 'win-home', label: '[~] home.txt' },
  { id: 'win-about', label: '[SYS] about.txt' },
  { id: 'win-blog', label: '[LOG] blog.txt' },
  { id: 'win-music', label: '[MP3] player.exe' },
  { id: 'win-dump', label: '[BIN] dump/' },
  { id: 'win-term', label: '[$] cmd.exe' },
  { id: 'win-games', label: '[GAME] games.exe' },
];

export default function StartMenu({ open, onOpen, onNotif }) {
  return (
    <div id="start-menu" className={open ? 'open' : ''}>
      <div className="smenu-header">mazu-space v0.2</div>
      {items.map((item, i) => (
        <div
          key={i}
          className="smenu-item"
          onClick={() => { onOpen(item.id); }}
        >
          {item.label}
        </div>
      ))}
      <div className="smenu-sep" />
      <div className="smenu-item" onClick={() => onNotif('// shutdown: access denied')}>
        [x] shut down
      </div>
    </div>
  );
}
