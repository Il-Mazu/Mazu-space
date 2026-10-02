import { useRef } from 'react';

const TASKBAR_H = 40;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Drag/resize mutate the DOM directly while the pointer moves and commit to
// React state once on release, so moving a window never re-renders the app.
export default function Window({
  id, title, x, y, w, h,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize,
  onMove, onResize,
  menubar, statusbar, bare, minW = 200, minH = 120,
  children,
}) {
  const winRef = useRef(null);
  const gesture = useRef(null);

  const start = (kind) => (e) => {
    if (e.button !== 0 || e.target.closest('.win-btn')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = winRef.current;
    gesture.current = { kind, sx: e.clientX, sy: e.clientY, x, y, w: el.offsetWidth, h: el.offsetHeight };
  };

  const move = (e) => {
    const g = gesture.current;
    if (!g) return;
    const el = winRef.current;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (g.kind === 'drag') {
      g.nx = clamp(g.x + dx, 0, window.innerWidth - 180);
      g.ny = clamp(g.y + dy, 0, window.innerHeight - TASKBAR_H - 100);
      el.style.transform = `translate(${g.nx - g.x}px, ${g.ny - g.y}px)`;
    } else {
      g.nw = Math.max(minW, g.w + dx);
      g.nh = Math.max(minH, g.h + dy);
      el.style.width = g.nw + 'px';
      el.style.height = g.nh + 'px';
    }
  };

  const end = () => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    const el = winRef.current;
    if (g.kind === 'drag') {
      if (g.nx === undefined) return;
      el.style.left = g.nx + 'px';
      el.style.top = g.ny + 'px';
      el.style.transform = '';
      onMove(id, g.nx, g.ny);
    } else if (g.nw !== undefined) {
      onResize(id, g.x, g.y, g.nw, g.nh);
    }
  };

  const gestureHandlers = (kind) => ({
    onPointerDown: start(kind),
    onPointerMove: move,
    onPointerUp: end,
    onLostPointerCapture: end,
  });

  if (!visible) return null;

  return (
    <div
      ref={winRef}
      id={id}
      className={`window ${focused ? 'focused' : ''}`}
      style={{ left: x, top: y, width: w, height: h || undefined, zIndex }}
      onPointerDown={() => onFocus(id)}
    >
      <div className="titlebar" {...gestureHandlers('drag')}>
        <div className="titlebar-icon" />
        <span className="titlebar-title">{title}</span>
        <div className="win-buttons">
          <div className="win-btn minimize" onClick={() => onMinimize(id)}>_</div>
          <div className="win-btn close" onClick={() => onClose(id)}>×</div>
        </div>
      </div>
      {menubar && (
        <div className="win-menubar">
          {menubar.map((item, i) => (
            <span key={i} className="menu-item" onClick={item.onClick}>{item.label}</span>
          ))}
        </div>
      )}
      {bare ? children : <div className="win-content">{children}</div>}
      {statusbar && (
        <div className="statusbar">
          {statusbar.map((seg, i) => (
            <span key={i} className={seg.className || ''}>{seg.text}</span>
          ))}
        </div>
      )}
      <div className="resize-handle" {...gestureHandlers('resize')} />
    </div>
  );
}
