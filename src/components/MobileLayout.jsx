import { useState, useCallback, useRef, useEffect } from 'react';
import MobileHomeScreen from './MobileHomeScreen';
import MobileAppView from './MobileAppView';

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

function AppIcon({ appId }) {
  switch (appId) {
    case 'win-home':
      return <img src={new URL('../../assets/icons/home.png', import.meta.url).href} alt="" />;
    case 'win-about':
      return <img src={new URL('../../assets/icons/about.png', import.meta.url).href} alt="" />;
    case 'win-blog':
      return <img src={new URL('../../assets/icons/blog.png', import.meta.url).href} alt="" />;
    case 'win-music':
      return <img src={new URL('../../assets/icons/music.png', import.meta.url).href} alt="" />;
    case 'win-dump':
      return <img src={new URL('../../assets/icons/dump.png', import.meta.url).href} alt="" />;
    case 'win-term':
      return <img src={new URL('../../assets/icons/terminal.svg', import.meta.url).href} alt="" />;
    case 'win-scope':
      return <img src={new URL('../../assets/icons/scope.png', import.meta.url).href} alt="" />;
    case 'win-games':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="2 4 20 16">
          <path d="M20 20H4v-2h16v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12Zm-12-7h2v2h-2v2H8v-2H6v-2h2V9h2v2Zm8 4h-2v-2h2v2Zm-2-4h-2V9h2v2Zm4-5H4V4h16v2Z"/>
        </svg>
      );
    default:
      return null;
  }
}

export default function MobileLayout(props) {
  const [screen, setScreen] = useState('home');
  const [exiting, setExiting] = useState(false);
  const [openedApps, setOpenedApps] = useState([]);
  const [showRecents, setShowRecents] = useState(false);
  const [gamesSort, setGamesSort] = useState('default');
  const [gamesStatusText, setGamesStatusText] = useState('');
  const [gamesCache, setGamesCache] = useState(() => {
    try {
      const stored = localStorage.getItem('games_cache');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const appBackRef = useRef(null);
  const handleRegisterBack = useCallback((fn) => {
    appBackRef.current = fn;
  }, []);

  useEffect(() => {
    appBackRef.current = null;
  }, [screen]);

  const handleOpenApp = useCallback((appId) => {
    setExiting(false);
    setScreen(appId);
    setOpenedApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
  }, []);

  const handleBack = useCallback(() => {
    if (showRecents) {
      setShowRecents(false);
      return;
    }
    if (screen === 'home') return;
    if (appBackRef.current) {
      appBackRef.current();
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setScreen('home');
      setExiting(false);
    }, 250);
  }, [screen, showRecents]);

  const handleHome = useCallback(() => {
    setExiting(false);
    setShowRecents(false);
    setScreen('home');
  }, []);

  const handleToggleRecents = useCallback(() => {
    setShowRecents(p => !p);
  }, []);

  const handleRemoveRecent = useCallback((appId) => {
    setOpenedApps(prev => prev.filter(id => id !== appId));
  }, []);

  const handleTerminalOpen = useCallback((appId) => {
    setExiting(false);
    setScreen(appId);
    setOpenedApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
  }, []);

  const sharedGamesProps = {
    gamesSort,
    setGamesSort,
    gamesStatusText,
    setGamesStatusText,
    gamesCache,
    setGamesCache,
  };

  return (
    <div className="mobile-layout">
      {screen === 'home' ? (
        <MobileHomeScreen
          onOpen={handleOpenApp}
          lanyard={props.lanyard}
          commits={props.commits}
          remote={props.remote}
          buildDate={props.buildDate}
          blogCount={props.blogCount}
          tracksCount={props.tracksCount}
        />
      ) : (
        <MobileAppView
          appId={screen}
          onBack={handleBack}
          onTerminalOpen={handleTerminalOpen}
          onRegisterBack={handleRegisterBack}
          exiting={exiting}
          {...sharedGamesProps}
          {...props}
        />
      )}

      <div className="mobile-system-nav">
        <button
          className={'sys-nav-btn' + (screen === 'home' && !showRecents ? ' sys-nav-disabled' : '')}
          onClick={handleBack}
        >←</button>
        <button className="sys-nav-btn" onClick={handleHome}>⌂</button>
        <button className="sys-nav-btn" onClick={handleToggleRecents}>□</button>
      </div>

      {showRecents && (
        <div className="recents-overlay" onClick={() => setShowRecents(false)}>
          <div className="recents-container" onClick={e => e.stopPropagation()}>
            {openedApps.length === 0 ? (
              <div className="recents-empty">no recent apps</div>
            ) : (
              [...openedApps].reverse().map(appId => (
                <div
                  key={appId}
                  className={'recents-card' + (appId === screen ? ' recents-card-current' : '')}
                  onClick={() => { setShowRecents(false); setScreen(appId); }}
                  onTouchStart={e => { e.currentTarget.dataset.startX = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                    const dx = e.changedTouches[0].clientX - startX;
                    if (Math.abs(dx) > 60) {
                      e.stopPropagation();
                      handleRemoveRecent(appId);
                    }
                  }}
                >
                  <div className="recents-card-icon">
                    <AppIcon appId={appId} />
                  </div>
                  <span className="recents-card-title">
                    {APP_TITLES[appId] || appId}
                  </span>
                  <button
                    className="recents-card-close"
                    onClick={e => { e.stopPropagation(); handleRemoveRecent(appId); }}
                  >×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
