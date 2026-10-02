import './MobileKeyboard.css';

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

// Touch-only stand-in for the OS keyboard; hidden from assistive tech,
// which types into the terminal's real input instead.
export default function MobileKeyboard({ visible, onKey }) {
  const key = (k, label = k, cls = '') => (
    <button key={k} tabIndex={-1} className={'mobile-key ' + cls} onPointerDown={(e) => { e.preventDefault(); onKey(k); }}>
      {label}
    </button>
  );

  return (
    <div className={`mobile-keyboard ${visible ? 'mobile-keyboard-open' : ''}`} aria-hidden="true">
      <div className="mobile-keyboard-rows">
        {ROWS.map((row, ri) => (
          <div key={ri} className="mobile-keyboard-row">{row.map(k => key(k))}</div>
        ))}
        <div className="mobile-keyboard-row">
          {key('Backspace', '⌫', 'mobile-key-wide')}
          {key(' ', '␣', 'mobile-key-space')}
          {key('Enter', '↵', 'mobile-key-wide')}
        </div>
      </div>
    </div>
  );
}
