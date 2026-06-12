import { useState, Suspense, lazy } from 'react';
import HomeWindow from './HomeWindow';
import AboutWindow from './AboutWindow';
import MusicWindow from './MusicWindow';
import TerminalWindow from './TerminalWindow';
import { DumpContent } from './DumpWindow';
import { ScopeContent } from './OscilloscopeWindow';
import { GamesContent } from './GamesWindow';
import MobileKeyboard from './MobileKeyboard';

const BlogWindow = lazy(() => import('./BlogWindow'));

const APP_TITLES = {
  'win-home': 'home.txt',
  'win-about': 'about.txt',
  'win-blog': 'blog.txt',
  'win-music': 'player.exe',
  'win-dump': 'dump/',
  'win-term': 'cmd.exe',
  'win-scope': 'scope.exe',
  'win-games': 'games.exe',
};

export default function MobileAppView({
  appId, onBack, onRegisterBack, exiting,
  tracks,
  currentTrack, playing, progress, currentAudioTime, volume, shuffle, loopMode,
  onPrev, onNext, onTogglePlay, onToggleShuffle, onCycleLoop, onVolumeChange, onSelectTrack,
  commits, remote, buildDate, blogCount, tracksCount, lanyard,
  onGlitch, onTerminalOpen,
  gamesCache, gamesSort, setGamesSort, gamesStatusText, setGamesStatusText, setGamesCache,
  showNotif,
  audioRef,
}) {
  const [dumpFullScreen, setDumpFullScreen] = useState(false);
  const title = APP_TITLES[appId] || 'mazu-space';

  const handleVirtualKey = (key) => {
    const input = document.querySelector('.terminal-hidden-input');
    if (!input) return;
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    input.focus();
  };

  const renderContent = () => {
    const common = { onNotif: showNotif };
    switch (appId) {
      case 'win-home':
        return (
          <HomeWindow
            commits={commits}
            remote={remote}
            buildDate={buildDate}
            blogCount={blogCount}
            tracksCount={tracksCount}
            lanyard={lanyard}
          />
        );
      case 'win-about':
        return <AboutWindow />;
      case 'win-blog':
        return (
          <Suspense fallback={<div className="c-dim" style={{ padding: 20 }}>loading...</div>}>
            <BlogWindow onNotif={showNotif} onRegisterBack={onRegisterBack} />
          </Suspense>
        );
      case 'win-music':
        return (
          <MusicWindow
            tracks={tracks}
            currentTrack={currentTrack}
            playing={playing}
            progress={progress}
            currentAudioTime={currentAudioTime}
            volume={volume}
            shuffle={shuffle}
            loopMode={loopMode}
            onPrev={onPrev}
            onNext={onNext}
            onTogglePlay={onTogglePlay}
            onToggleShuffle={onToggleShuffle}
            onCycleLoop={onCycleLoop}
            onVolumeChange={onVolumeChange}
            onSelectTrack={onSelectTrack}
            lanyard={lanyard}
            {...common}
          />
        );
      case 'win-dump':
        return <DumpContent focused={true} mobile={true} onFullScreenChange={setDumpFullScreen} onRegisterBack={onRegisterBack} />;
      case 'win-term':
        return <TerminalWindow onGlitch={onGlitch} onOpen={onTerminalOpen || onBack} />;
      case 'win-scope':
        return <ScopeContent audioElement={audioRef} trackKey={currentTrack} />;
      case 'win-games':
        return (
          <GamesContent
            sort={gamesSort}
            setSort={setGamesSort}
            statusText={gamesStatusText}
            setStatusText={setGamesStatusText}
            cache={gamesCache}
            setCache={setGamesCache}
          />
        );
      default:
        return <div className="c-dim" style={{ padding: 20 }}>unknown app</div>;
    }
  };

  return (
    <div className={'mobile-app-view' + (exiting ? ' mobile-app-view-exit' : '')}>
      {!(appId === 'win-dump' && dumpFullScreen) && (
        <div className="mobile-app-header">
          <span className="mobile-app-title">{title}</span>
        </div>
      )}
      <div className="mobile-app-content">
        {renderContent()}
      </div>
      {appId === 'win-term' && (
        <MobileKeyboard visible={true} onKey={handleVirtualKey} />
      )}
    </div>
  );
}
