import { useEffect, useRef, useState } from 'react';
import { WINDOWS } from '../windows';
import { WALLPAPERS } from './Wallpaper';
import Icon from './Icon';
import './Taskbar.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

export default function Taskbar({
  windows, focusedId, onOpenWindow, onMinimizeWindow, startMenuOpen, onToggleStartMenu,
  settings, onToggleCrt, onToggleNoise, onToggleAmbient, onToggleGlitch, onToggleLightMode,
  onToggleDesktop, allMinimized, wallpaper, onWallpaperChange,
}) {
  const [time, setTime] = useState('--:--');
  const [popup, setPopup] = useState(null); // 'settings' | 'calendar' | null
  const [calDate, setCalDate] = useState(new Date());
  const triggers = { settings: useRef(null), calendar: useRef(null) };

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  // Outside click or Esc closes the open popup; Esc hands focus back to its button.
  useEffect(() => {
    if (!popup) return;
    const close = () => setPopup(null);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      triggers[popup].current?.focus();
      close();
    };
    document.addEventListener('click', close);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [popup]);

  const togglePopup = (name) => (e) => {
    e.stopPropagation();
    setPopup(p => (p === name ? null : name));
  };

  const openEntries = Object.keys(windows).filter(id => windows[id].open);

  const handleTaskClick = (id) => {
    if (windows[id].visible && focusedId === id) onMinimizeWindow(id);
    else onOpenWindow(id);
  };

  const toggles = [
    { label: 'CRT overlay', on: settings.crt, toggle: onToggleCrt },
    { label: 'Noise overlay', on: settings.noise, toggle: onToggleNoise },
    { label: 'Ambient audio', on: settings.ambient, toggle: onToggleAmbient },
    { label: 'Glitch effects', on: settings.glitch, toggle: onToggleGlitch },
    { label: 'Light mode', on: settings.lightMode, toggle: onToggleLightMode },
  ];

  const today = new Date();
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert Sunday=0 to Monday=0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const dates = [];
  for (let i = 0; i < startOffset; i++) dates.push(null);
  for (let d = 1; d <= daysInMonth; d++) dates.push(d);
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const shiftMonth = (n) => setCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1));

  return (
    <div id="taskbar" role="navigation" aria-label="Taskbar">
      <button
        id="start-btn"
        aria-expanded={startMenuOpen}
        aria-controls="start-menu"
        onClick={(e) => { e.stopPropagation(); onToggleStartMenu(); }}
      >
        <span className="start-gem" aria-hidden="true" />
        START
      </button>
      <div id="taskbar-tasks">
        {openEntries.map(id => (
          <button
            key={id}
            className={`task-btn ${focusedId === id ? 'active' : ''} ${windows[id].visible ? '' : 'hidden'}`}
            aria-pressed={focusedId === id}
            onClick={() => handleTaskClick(id)}
          >
            <span className="task-dot" aria-hidden="true" />
            <span className="task-title">{WINDOWS[id]?.title || id}</span>
          </button>
        ))}
      </div>
      <div id="sys-tray">
        <div id="settings-area">
          <button
            id="settings-btn"
            ref={triggers.settings}
            aria-label="Settings"
            aria-expanded={popup === 'settings'}
            aria-controls="settings-menu"
            onClick={togglePopup('settings')}
          >
            <Icon name="settings" />
          </button>
          {popup === 'settings' && (
            <div id="settings-menu" className="menu-panel" role="group" aria-label="Settings" onClick={e => e.stopPropagation()}>
              <div className="smenu-header" aria-hidden="true">settings</div>
              {toggles.map(t => (
                <button key={t.label} className="smenu-item" aria-pressed={t.on} onClick={t.toggle} autoFocus={t === toggles[0]}>
                  <span className="toggle-dot" aria-hidden="true">{t.on ? '[x]' : '[ ]'}</span>
                  {t.label}
                </button>
              ))}
              <div className="smenu-sep" />
              <div className="smenu-label" id="wallpaper-label">wallpaper</div>
              <div role="group" aria-labelledby="wallpaper-label">
                {WALLPAPERS.map(w => (
                  <button key={w.id} className="smenu-item" aria-pressed={wallpaper === w.id} onClick={() => onWallpaperChange(w.id)}>
                    <span className="toggle-dot" aria-hidden="true">{wallpaper === w.id ? '(*)' : '( )'}</span>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          id="desk-btn"
          aria-label={allMinimized ? 'Restore windows' : 'Show desktop'}
          aria-pressed={allMinimized}
          onClick={onToggleDesktop}
        >
          <Icon name="desktop" />
        </button>
        <div id="clock-area">
          <button
            id="clock"
            ref={triggers.calendar}
            aria-label={`${time}, open calendar`}
            aria-expanded={popup === 'calendar'}
            aria-controls="calendar-menu"
            onClick={togglePopup('calendar')}
          >
            {time}
          </button>
          {popup === 'calendar' && (
            <div id="calendar-menu" role="group" aria-label="Calendar" onClick={e => e.stopPropagation()}>
              <div className="cal-header">
                <button className="cal-nav" aria-label="Previous month" onClick={() => shiftMonth(-1)} autoFocus>
                  <Icon name="chevron-left" />
                </button>
                <span className="cal-title" aria-live="polite">{MONTHS[month]} {year}</span>
                <button className="cal-nav" aria-label="Next month" onClick={() => shiftMonth(1)}>
                  <Icon name="chevron-right" />
                </button>
              </div>
              <div className="cal-days" aria-hidden="true">
                {DAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
              </div>
              <div className="cal-grid">
                {dates.map((d, i) => (
                  <div
                    key={i}
                    className={'cal-cell' + (d === null ? ' cal-empty' : '') + (isToday(d) ? ' cal-today' : '')}
                    aria-current={isToday(d) ? 'date' : undefined}
                  >
                    {d || ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
