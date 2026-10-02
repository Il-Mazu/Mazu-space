import { useState } from 'react';
import HomeWindow from './HomeWindow';
import AboutWindow from './AboutWindow';
import MusicWindow from './MusicWindow';
import TerminalWindow from './TerminalWindow';
import { DumpContent } from './DumpWindow';
import { ScopeContent } from './OscilloscopeWindow';
import { GamesContent } from './GamesWindow';
import MobileKeyboard from './MobileKeyboard';
import Icon from './Icon';
import { WINDOWS } from '../windows';

// Each app renders the same content component as its desktop window.
export default function MobileAppView({
  appId, onBack, onRegisterBack, exiting,
  commits, remote, buildDate, tracksCount, lanyard,
  onGlitch, onTerminalOpen, showNotif,
  ...player
}) {
  const [dumpFullScreen, setDumpFullScreen] = useState(false);
  const title = WINDOWS[appId]?.title.split(' — ')[0] || 'mazu-space';

  const handleVirtualKey = (key) => {
    const input = document.querySelector('.terminal-hidden-input');
    if (!input) return;
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    input.focus();
  };

  const content = {
    'win-home': () => <HomeWindow commits={commits} remote={remote} buildDate={buildDate} tracksCount={tracksCount} lanyard={lanyard} />,
    'win-about': () => <AboutWindow />,
    'win-music': () => <MusicWindow {...player} lanyard={lanyard} onNotif={showNotif} />,
    'win-dump': () => <DumpContent focused mobile onFullScreenChange={setDumpFullScreen} onRegisterBack={onRegisterBack} />,
    'win-term': () => <TerminalWindow onGlitch={onGlitch} onOpen={onTerminalOpen || onBack} />,
    'win-scope': () => <ScopeContent audioRef={player.audioRef} />,
    'win-games': () => <GamesContent />,
  }[appId];

  return (
    <div className={'mobile-app-view' + (exiting ? ' mobile-app-view-exit' : '')}>
      {!(appId === 'win-dump' && dumpFullScreen) && (
        <header className="mobile-app-header">
          <button className="mobile-app-back" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
          <h1 className="mobile-app-title">{title}</h1>
        </header>
      )}
      <main className="mobile-app-content">
        {content ? content() : <div className="c-dim" style={{ padding: 20 }}>unknown app</div>}
      </main>
      {appId === 'win-term' && <MobileKeyboard visible onKey={handleVirtualKey} />}
    </div>
  );
}
