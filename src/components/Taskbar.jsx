import { useEffect, useState } from 'react';

export default function Taskbar({ windows, focusedId, onOpenWindow, onToggleStartMenu }) {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    function update() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTime(h + ':' + m);
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  const entries = [
    { id: 'win-about', label: 'about.txt' },
    { id: 'win-blog', label: 'blog.txt' },
    { id: 'win-music', label: 'player.exe' },
    { id: 'win-dump', label: 'dump/' },
    { id: 'win-links', label: 'links.ini' },
    { id: 'win-term', label: 'cmd.exe' },
  ];

  return (
    <div id="taskbar">
      <div id="start-btn" onClick={onToggleStartMenu}>
        <div className="start-gem" />
        START
      </div>
      <div id="taskbar-tasks">
        {entries.map(e => (
          <div
            key={e.id}
            id={'task-' + e.id}
            className={`task-btn ${focusedId === e.id ? 'active' : ''}`}
            onClick={() => onOpenWindow(e.id)}
          >
            <div className="task-dot" />
            {e.label}
          </div>
        ))}
      </div>
      <div id="sys-tray">
        <span title="network">[~]</span>
        <span title="sound">[♪]</span>
        <span id="clock">{time}</span>
      </div>
    </div>
  );
}
