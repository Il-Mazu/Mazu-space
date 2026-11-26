import { useEffect, useRef, useState } from 'react';
import { SECTIONS } from '../data/content.js';
import { TRACKS } from '../data/tracks.js';
import { jumpToSection, subscribeSection } from '../state/sceneBus.js';
import {
  nextTrack,
  playClickHit,
  playHoverTick,
  prevTrack,
  togglePlay,
  toggleSound,
  useAudioState,
} from '../audio/AudioEngine.js';
import './HudMinimal.css';

function Icon({ name }) {
  return (
    <svg className="icon" aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

export default function HudMinimal({ onProgressRef }) {
  const [active, setActive] = useState(0);
  const progressBarRef = useRef(null);
  const audio = useAudioState();
  const track = TRACKS[audio.currentTrack];

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
          {SECTIONS.map((sec, idx) => {
            const isCurr = active === idx;
            return (
              <button
                key={sec.id}
                type="button"
                className={`hud-nav-btn min-hud-num ${isCurr ? 'active' : ''}`}
                aria-current={isCurr ? 'location' : undefined}
                aria-label={`${sec.roman}. ${sec.name}`}
                title={sec.label}
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  jumpToSection(idx);
                }}
              >
                {isCurr && <span className="min-hud-cross" aria-hidden="true">♰</span>}
                <span>{sec.roman}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-hud-bottom">
          <div className="min-hud-player" role="region" aria-label="Mini music player">
            <span className={`min-hud-disc ${audio.playing ? 'spinning' : ''}`} aria-hidden="true" />
            <div className="min-hud-controls">
              <button
                type="button"
                className="min-hud-ctrl"
                onClick={() => {
                  playClickHit();
                  prevTrack();
                }}
                aria-label="Previous track"
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                className={`min-hud-ctrl ${audio.playing ? 'playing' : ''}`}
                onClick={() => {
                  playClickHit();
                  togglePlay();
                }}
                aria-label={audio.playing ? 'Pause music' : 'Play music'}
              >
                <Icon name={audio.playing ? 'pause' : 'play'} />
              </button>
              <button
                type="button"
                className="min-hud-ctrl"
                onClick={() => {
                  playClickHit();
                  nextTrack();
                }}
                aria-label="Next track"
              >
                <Icon name="next" />
              </button>
            </div>
            <button
              type="button"
              className="min-hud-track xerox-hover"
              onMouseEnter={playHoverTick}
              onClick={() => {
                playClickHit();
                jumpToSection('music');
              }}
              title="Go to Altar of Noise"
            >
              <span>{track.artist} — {track.title}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="min-hud-progress-track" aria-hidden="true">
        <div ref={progressBarRef} className="min-hud-progress-fill" />
      </div>
    </>
  );
}
