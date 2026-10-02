import { useEffect, useRef } from 'react';
import './StartMenu.css';

const items = [
  { id: 'win-home', label: '[~] home.txt' },
  { id: 'win-about', label: '[SYS] about.txt' },
  { id: 'win-music', label: '[MP3] player.exe' },
  { id: 'win-dump', label: '[BIN] dump/' },
  { id: 'win-term', label: '[$] cmd.exe' },
  { id: 'win-games', label: '[GAME] games.exe' },
];

export default function StartMenu({ open, onOpen, onNotif }) {
  const firstRef = useRef(null);
  useEffect(() => { if (open) firstRef.current?.focus(); }, [open]);

  return (
    <nav id="start-menu" className={'menu-panel' + (open ? ' open' : '')} aria-label="Start menu">
      <div className="smenu-header" aria-hidden="true">mazu-space v0.2</div>
      {items.map((item, i) => (
        <button key={item.id} ref={i === 0 ? firstRef : null} className="smenu-item" onClick={() => onOpen(item.id)}>
          {item.label}
        </button>
      ))}
      <div className="smenu-sep" />
      <button className="smenu-item" onClick={() => onNotif('// shutdown: access denied')}>
        [x] shut down
      </button>
    </nav>
  );
}
