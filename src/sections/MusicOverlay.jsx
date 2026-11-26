import { LOOP_LABELS, TRACKS } from '../data/tracks.js';
import {
  cycleLoop,
  nextTrack,
  prevTrack,
  seekTrack,
  selectTrack,
  setVolume,
  togglePlay,
  toggleShuffle,
  useAudioState,
} from '../audio/AudioEngine.js';
import './MusicOverlay.css';

function fmt(secs) {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function Icon({ name }) {
  return (
    <svg className="icon" aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

export default function MusicOverlay({ lanyard }) {
  const audio = useAudioState();
  const track = TRACKS[audio.currentTrack];
  const nextIx = (audio.currentTrack + 1) % TRACKS.length;
  const next = TRACKS[nextIx];
  const progress = Math.min(100, (audio.currentTime / Math.max(1, audio.duration)) * 100);

  return (
    <article className="music-panel" aria-labelledby="music-heading">
      <div className="chapel-tag">
        <span className="chapel-tag-cross" aria-hidden="true">♰</span>
        <span>CHAPEL IV // ALTAR OF NOISE</span>
      </div>

      <h2 id="music-heading" className="chapel-title">altar of noise</h2>

      <div className="music-head-row">
        <div className={`music-cover-frame ${audio.playing ? 'playing' : ''}`}>
          <img className="music-cover-img" src={track.cover} alt={`${track.artist} — ${track.title}`} />
        </div>
        <div className="music-now">
          <div className="music-track-title">
            <span className={audio.playing ? 'c-red' : 'c-dim'} aria-hidden="true">▶ </span>
            {track.title}
          </div>
          <div className="music-track-artist">{track.artist}</div>
          <div className="music-time-row">
            <span>{fmt(audio.currentTime)} / {fmt(audio.duration)}</span>
            <span>{audio.playing ? 'LIVE SCOPE' : 'IDLE STATIC'}</span>
          </div>
        </div>
      </div>

      <div className="music-seek-wrap">
        <div className="music-seek-fill" style={{ width: `${progress}%` }} />
        <input
          type="range"
          className="music-seek-input"
          min={0}
          max={Math.max(1, audio.duration)}
          step={0.5}
          value={audio.currentTime}
          aria-label="Seek track position"
          onChange={(e) => seekTrack(e.target.valueAsNumber)}
        />
      </div>

      <div className="music-controls-row">
        <div className="music-btn-group">
          <button type="button" className="music-btn" onClick={prevTrack} aria-label="Previous track">
            <Icon name="prev" />
          </button>
          <button
            type="button"
            className={`music-btn ${audio.playing ? 'active' : ''}`}
            onClick={togglePlay}
            aria-label={audio.playing ? 'Pause' : 'Play'}
          >
            <Icon name={audio.playing ? 'pause' : 'play'} />
          </button>
          <button type="button" className="music-btn" onClick={nextTrack} aria-label="Next track">
            <Icon name="next" />
          </button>
          <button
            type="button"
            className={`music-btn ${audio.shuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            aria-pressed={audio.shuffle}
            aria-label="Shuffle"
          >
            <Icon name="shuffle" />
          </button>
          <button
            type="button"
            className={`music-btn ${audio.loopMode ? 'active' : ''}`}
            onClick={cycleLoop}
            aria-label={LOOP_LABELS[audio.loopMode]}
            title={LOOP_LABELS[audio.loopMode]}
          >
            <Icon name={audio.loopMode === 2 ? 'repeat-1' : 'repeat'} />
          </button>
        </div>

        <label className="music-vol-wrap">
          <span>VOL</span>
          <input
            type="range"
            className="music-vol-slider"
            min={0}
            max={1}
            step={0.02}
            value={audio.volume}
            aria-label="Volume"
            onChange={(e) => setVolume(e.target.valueAsNumber)}
          />
        </label>
      </div>

      <div className="music-tracklist" role="list" aria-label="Playlist tracks">
        {TRACKS.map((t, i) => (
          <button
            key={t.title}
            type="button"
            className={`music-track-item ${i === audio.currentTrack ? 'active' : ''}`}
            onClick={() => selectTrack(i)}
          >
            <span>{i + 1}. {t.artist} — {t.title}</span>
            <span>{fmt(t.duration)}</span>
          </button>
        ))}
      </div>

      <div className="music-next-up">
        <span>next up: </span>
        <button type="button" className="c-red xerox-hover" onClick={() => selectTrack(nextIx)}>
          {next.artist} — {next.title}
        </button>
      </div>

      {lanyard?.listening_to_spotify && lanyard.spotify && (
        <div className="music-spotify">
          <span className="c-red" aria-hidden="true">♪ </span>
          <span className="c-dim">i&apos;m currently listening to: </span>
          <span className="c-bone">{lanyard.spotify.song}</span>
          <span className="c-dim"> — {lanyard.spotify.artist}</span>
        </div>
      )}
    </article>
  );
}
