import { useCallback, useEffect } from 'react';

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

export default function MobileKeyboard({ visible, onKey }) {
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.target?.closest('.mobile-keyboard')) return;
    };
    document.addEventListener('focusin', handler);
    return () => document.removeEventListener('focusin', handler);
  }, [visible]);

  const handleKey = useCallback((key) => {
    onKey(key);
  }, [onKey]);

  return (
    <div className={`mobile-keyboard ${visible ? 'mobile-keyboard-open' : ''}`}>
      <div className="mobile-keyboard-rows">
        {ROWS.map((row, ri) => (
          <div key={ri} className="mobile-keyboard-row">
            {row.map(k => (
              <button key={k} className="mobile-key" onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}>
                {k}
              </button>
            ))}
          </div>
        ))}
        <div className="mobile-keyboard-row">
          <button className="mobile-key mobile-key-wide" onPointerDown={(e) => { e.preventDefault(); handleKey('Backspace'); }}>
            ⌫
          </button>
          <button className="mobile-key mobile-key-space" onPointerDown={(e) => { e.preventDefault(); handleKey(' '); }}>
            ␣
          </button>
          <button className="mobile-key mobile-key-wide" onPointerDown={(e) => { e.preventDefault(); handleKey('Enter'); }}>
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
