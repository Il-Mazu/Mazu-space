export default function MusicWindow({
  tracks, currentTrack, playing,
  onPrev, onNext, onTogglePlay, onSelectTrack, onNotif,
}) {
  return (
    <>
      <span className="c-dim">now playing ─────────────────</span><br />
      <span className="c-green">▶ </span>
      <span className="c-accent">{tracks[currentTrack].title}</span><br />
      <span className="c-dim">  00:00 / {tracks[currentTrack].time}</span><br />
      <div className="progress">
        <div className="progress-fill" style={{ width: `${tracks[currentTrack].progress}%` }} />
      </div>
      <span className="c-dim">
        <span style={{ cursor: 'pointer' }} onClick={onPrev}>|◄◄</span>
        &nbsp;
        <span style={{ cursor: 'pointer' }} onClick={onTogglePlay}>
          {playing ? '▶▶|' : '►'}
        </span>
        &nbsp;
        <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// stop')}>■</span>
        &nbsp;
        <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// shuffle on')}>⇄</span>
        &nbsp;
        <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// repeat on')}>↻</span>
      </span><br /><br />
      <div className="hr" />
      <span className="c-dim">── queue ───────────────────</span><br />
      {tracks.map((t, i) => {
        const isNow = i === currentTrack;
        return (
          <div
            key={i}
            className="pl-item"
            onClick={() => onSelectTrack(i)}
          >
            <span className={`pl-num ${isNow ? 'pl-now' : 'c-dim'}`}>
              {isNow ? '▶' : String(i + 1).padStart(2, '0')}
            </span>
            <span className={isNow ? 'c-accent' : ''}>{t.title}</span>
          </div>
        );
      })}
    </>
  );
}
