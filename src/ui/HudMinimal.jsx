import { useEffect, useRef, useState } from 'react';
import { CHAPELS } from '../data/chapels.js';
import { jumpToSection, subscribeSection } from '../state/sceneBus.js';
import { playClickHit, playHoverTick, toggleSound, useAudioState } from '../audio/AudioEngine.js';
import './HudMinimal.css';

export default function HudMinimal({ onProgressRef, music }) {
  const [active, setActive] = useState(0);
  const progressBarRef = useRef(null);
  const audio = useAudioState();

  useEffect(() => subscribeSection(setActive), []);

  useEffect(() => {
    if (onProgressRef) onProgressRef(progressBarRef.current);
    return () => {
      if (onProgressRef) onProgressRef(null);
    };
  }, [onProgressRef]);

  return (
    <>
      <div className="min-hud">
        <header className="min-hud-top">
          <button
            type="button"
            className="min-hud-brand xerox-hover"
            onMouseEnter={playHoverTick}
            onClick={() => {
              playClickHit();
              jumpToSection(0);
            }}
            aria-label="Return to the eye (top)"
          >
            <span className="min-hud-wordmark">Mazu</span>
          </button>

          <button
            type="button"
            className={`min-hud-sound ${audio.soundEnabled ? 'active' : ''}`}
            onMouseEnter={playHoverTick}
            onClick={toggleSound}
            aria-pressed={audio.soundEnabled}
            aria-label={audio.soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {audio.soundEnabled ? '♰ sound' : 'muted'}
          </button>
        </header>

        <nav className="min-hud-rail" aria-label="Chapel sections">
          {CHAPELS.map((sec, idx) => {
            const isCurr = active === idx;
            return (
              <button
                key={sec.id}
                type="button"
                className={`hud-nav-btn min-hud-num ${isCurr ? 'active' : ''}`}
                aria-current={isCurr ? 'location' : undefined}
                aria-label={`${sec.roman}. ${sec.name}`}
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  jumpToSection(idx);
                }}
              >
                {isCurr && <span className="min-hud-cross" aria-hidden="true">♰</span>}
                <span>{sec.roman}</span>
                <span className="min-hud-name" aria-hidden="true">{sec.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-hud-bottom">
          <button
            type="button"
            className={`min-hud-now${music.listening ? ' is-live' : ''}`}
            onMouseEnter={playHoverTick}
            onClick={() => {
              playClickHit();
              jumpToSection('live');
            }}
            aria-label={
              music.now
                ? `Now playing ${music.now.title} by ${music.now.artist}. Go to the live chapel`
                : 'Go to the live chapel'
            }
          >
            <span className="min-hud-disc" aria-hidden="true" />
            <span className="min-hud-now-text">
              {music.now
                ? `${music.now.title} — ${music.now.artist}`
                : music.lastHeard
                  ? `${music.lastHeard.title} — ${music.lastHeard.artist}`
                  : 'silence'}
            </span>
          </button>
        </div>
      </div>

      <div className="min-hud-progress-track" aria-hidden="true">
        <div ref={progressBarRef} className="min-hud-progress-fill" />
      </div>
    </>
  );
}
