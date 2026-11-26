import { useEffect, useRef, useState } from 'react';
import { SECTIONS, SITE } from '../data/content.js';
import { TRACKS } from '../data/tracks.js';
import { jumpToSection, subscribeSection } from '../state/sceneBus.js';
import { nextTrack, prevTrack, togglePlay, toggleSound, useAudioState } from '../audio/AudioEngine.js';
import './Hud.css';

function Icon({ name }) {
  return (
    <svg className="icon" aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

export default function Hud({ onProgressRef }) {
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

  const currentSection = SECTIONS[active] || SECTIONS[0];

  return (
    <>
      <div className="hud-root">
        <header className="hud-top">
          <button
            type="button"
            className="hud-brand xerox-hover"
            onClick={() => jumpToSection(0)}
            aria-label="Return to the eye (top)"
          >
            <span className="hud-wordmark">{SITE.wordmark}</span>
            <span className="hud-version">v{SITE.version}</span>
          </button>

          <div className="hud-top-right">
            <button
              type="button"
              className={`hud-sound-btn ${audio.soundEnabled ? 'active' : ''}`}
              onClick={toggleSound}
              aria-pressed={audio.soundEnabled}
              aria-label={audio.soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              <span className="hud-sound-dot" aria-hidden="true" />
              <span>{audio.soundEnabled ? 'SND ON' : 'MUTED'}</span>
            </button>

            <nav className="hud-nav" aria-label="Chapel sections">
              {SECTIONS.map((sec, idx) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`hud-nav-btn ${active === idx ? 'active' : ''}`}
                  aria-current={active === idx ? 'location' : undefined}
                  aria-label={`${sec.roman}. ${sec.name}`}
                  title={sec.label}
                  onClick={() => jumpToSection(idx)}
                >
                  {sec.roman}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="hud-bottom">
          <div className="hud-mini-player" role="region" aria-label="Mini music player">
            <div className="hud-mini-controls">
              <button
                type="button"
                className="hud-mini-btn"
                onClick={prevTrack}
                aria-label="Previous track"
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                className={`hud-mini-btn ${audio.playing ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={audio.playing ? 'Pause music' : 'Play music'}
              >
                <Icon name={audio.playing ? 'pause' : 'play'} />
              </button>
              <button
                type="button"
                className="hud-mini-btn"
                onClick={nextTrack}
                aria-label="Next track"
              >
                <Icon name="next" />
              </button>
            </div>
            <button
              type="button"
              className="hud-mini-meta xerox-hover"
              onClick={() => jumpToSection('music')}
              title="Go to Altar of Noise"
            >
              <span className="hud-mini-title">{track.artist} — {track.title}</span>
              <span className="hud-mini-sub">
                {audio.playing ? 'PLAYING // ALTAR OF NOISE' : 'PAUSED // CLICK TO DESCEND'}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="hud-chapel-readout xerox-hover"
            onClick={() => jumpToSection((active + 1) % SECTIONS.length)}
            title="Advance to next chapel"
          >
            <span>♰</span>
            <span>{currentSection.label}</span>
          </button>
        </div>
      </div>

      <div className="hud-progress-track" aria-hidden="true">
        <div ref={progressBarRef} className="hud-progress-fill" />
      </div>
    </>
  );
}
