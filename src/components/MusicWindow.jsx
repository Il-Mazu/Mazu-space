const LOOP_LABELS = ['↻', '↻ all', '↻ 1'];

export default function MusicWindow({
  tracks, currentTrack, playing, progress, currentAudioTime, volume,
  shuffle, loopMode,
  onPrev, onNext, onTogglePlay, onToggleShuffle, onCycleLoop,
  onVolumeChange, onSelectTrack, onNotif, lanyard,
}) {
  const current = tracks[currentTrack];
  const nextIx = (currentTrack + 1) % tracks.length;
  const next = tracks[nextIx];
  const totalSecs = current.duration;
  const totalTime = `${String(Math.floor(totalSecs / 60)).padStart(2, '0')}:${String(totalSecs % 60).padStart(2, '0')}`;

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
          <span className={playing ? 'c-red' : 'c-dim'}>▶ </span>
          <span className="c-accent">{current.artist} — {current.title}</span>
        </div>
        <div className="time-display c-dim">{currentAudioTime} / {totalTime}</div>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="controls">
          <span className="c-dim" style={{ cursor: 'pointer' }} onClick={onPrev}>|◄◄</span>
          <span className={playing ? 'c-red' : 'c-dim'} style={{ cursor: 'pointer' }} onClick={onTogglePlay}>
            {playing ? '❚❚' : '▶'}
          </span>
          <span className="c-dim" style={{ cursor: 'pointer' }} onClick={onNext}>►►|</span>
          <span
            className={shuffle ? 'active' : 'c-dim'}
            style={{ cursor: 'pointer' }}
            onClick={onToggleShuffle}
          >⇄</span>
          <span
            className={loopMode ? 'active' : 'c-dim'}
            style={{ cursor: 'pointer' }}
            onClick={onCycleLoop}
          >{LOOP_LABELS[loopMode]}</span>
        </div>

        <div className="volume-row">
          <span className="c-dim vol-label">VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="any"
            value={volume}
            onChange={(e) => onVolumeChange(e.target.valueAsNumber)}
          />
        </div>

        <div className="next-up">
          <span className="c-dim">next up: </span>
          <span
            className="c-red"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTrack(nextIx)}
          >
            {next.artist} — {next.title}
          </span>
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
