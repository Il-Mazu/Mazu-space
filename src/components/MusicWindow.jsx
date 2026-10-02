import { useEffect, useState } from 'react';
import Icon from './Icon';
import './MusicWindow.css';

const fmt = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

// Subscribed here rather than in App so only the player re-renders on timeupdate.
function useAudioTime(audioRef) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setTime(audio.currentTime);
    update();
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('emptied', update);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('emptied', update);
    };
  }, [audioRef]);
  return time;
}

const LOOP_LABELS = ['Repeat: off', 'Repeat: all', 'Repeat: one'];

export default function MusicWindow({
  tracks, currentTrack, playing, audioRef, volume,
  shuffle, loopMode,
  onPrev, onNext, onTogglePlay, onToggleShuffle, onCycleLoop,
  onVolumeChange, onSelectTrack, onNotif, lanyard,
}) {
  const current = tracks[currentTrack];
  const nextIx = (currentTrack + 1) % tracks.length;
  const next = tracks[nextIx];
  const time = useAudioTime(audioRef);
  const progress = Math.min(100, (time / current.duration) * 100);

  return (
    <div className="music-player">
      <div className={`album-cover${playing ? ' playing' : ''}`}>
        {current.cover
          ? <img src={current.cover} alt={current.title} className="cover-img" />
          : <span className="album-label">{current.title}</span>
        }
      </div>

      <div className="player-main">
        <div className="now-playing">
          <span className={playing ? 'c-red' : 'c-dim'} aria-hidden="true">▶ </span>
          <span className="c-accent">{current.artist} — {current.title}</span>
        </div>
        <div className="time-display c-dim" aria-hidden="true">{fmt(time)} / {fmt(current.duration)}</div>

        <div className="progress" role="progressbar" aria-label="Track progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-valuetext={`${fmt(time)} of ${fmt(current.duration)}`}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="controls">
          <button aria-label="Previous track" onClick={onPrev}><Icon name="prev" /></button>
          <button aria-label={playing ? 'Pause' : 'Play'} className={playing ? 'active' : ''} onClick={onTogglePlay}>
            <Icon name={playing ? 'pause' : 'play'} />
          </button>
          <button aria-label="Next track" onClick={onNext}><Icon name="next" /></button>
          <button aria-label="Shuffle" aria-pressed={shuffle} className={shuffle ? 'active' : ''} onClick={onToggleShuffle}>
            <Icon name="shuffle" />
          </button>
          <button aria-label={LOOP_LABELS[loopMode]} className={loopMode ? 'active' : ''} onClick={onCycleLoop}>
            <Icon name={loopMode === 2 ? 'repeat-1' : 'repeat'} />
          </button>
        </div>

        <label className="volume-row">
          <span className="c-dim vol-label">VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="any"
            value={volume}
            aria-label="Volume"
            onChange={(e) => onVolumeChange(e.target.valueAsNumber)}
          />
        </label>

        <div className="next-up">
          <span className="c-dim">next up: </span>
          <button className="c-red" onClick={() => onSelectTrack(nextIx)}>
            {next.artist} — {next.title}
          </button>
        </div>

        {lanyard?.listening_to_spotify && lanyard.spotify && (
          <div className="spotify-live">
            <div className="spotify-live-sep c-dim">── live ──</div>
            <div className="spotify-live-row">
              <span className="c-dim">♪ i'm currently listening to:</span>
              <span className="c-accent2"> {lanyard.spotify.song}</span>
              <span className="c-dim"> — {lanyard.spotify.artist}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
