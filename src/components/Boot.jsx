import { useEffect, useState, useRef } from 'react';
import bootSound from '../../assets/boot-sound.mp3';
import { fadeOut } from '../utils/audio';
import { BOOT_LOGO } from '../bootLogo';
import './Boot.css';

// Each line types itself in CSS (steps() over its own length); `at` is the
// start time in ms. The bar's animationend finishes the boot.
const LINES = [
  { text: '[ BIOS ] BOIA-BIOS v1.0a ... POST OK', at: 0 },
  { text: '[ BIOS ] Si va: a letto',              at: 450 },
  { text: '[ SYS  ] mazu/OS v0.2.0 -- Per: forza', at: 800 },
  { text: '[ NET  ] interface: loopback only',    at: 1250 },
];
const BAR_AT = 1650;


export default function Boot({ onComplete }) {
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const audioRef = useRef(null);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setHidden(true);
    fadeOut(audioRef.current, 400);
    setTimeout(onComplete, 400);
  };

  useEffect(() => {
    if (!started) return;
    const audio = new Audio(bootSound);
    audio.volume = 0.12;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => audio.pause();
  }, [started]);

  useEffect(() => {
    if (started) return;
    const onKey = (e) => { if (e.key === 'Enter') setStarted(true); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [started]);

  return (
    <main id="boot" className={hidden ? 'hidden' : ''}>
      <div id="boot-terminal">
        <pre className="ascii-art">{BOOT_LOGO}</pre>
        {!started ? (
          <div className="boot-enter">
            <span className="c-dim">&gt;</span>{' '}
            <button className="boot-enter-btn" autoFocus onClick={() => setStarted(true)}>PRESS ENTER</button>
            <span className="boot-cursor">_</span>
          </div>
        ) : (
          <div className="boot-status">
            {LINES.map(({ text, at }) => (
              <div key={text} className="boot-line" style={{ '--n': text.length, '--d': `${at}ms` }}>{text}</div>
            ))}
            <div className="boot-bar" style={{ '--d': `${BAR_AT}ms` }}>
              <span>[ SYS  ]</span>
              <div className="boot-bar-track"><div className="boot-bar-fill" onAnimationEnd={finish} /></div>
            </div>
          </div>
        )}
      </div>
      <button className="boot-skip" onClick={finish}>SKIP &gt;&gt;</button>
    </main>
  );
}
