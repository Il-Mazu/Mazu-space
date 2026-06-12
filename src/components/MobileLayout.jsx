import { useState, useCallback, useRef, useEffect } from 'react';
import MobileHomeScreen from './MobileHomeScreen';
import MobileAppView from './MobileAppView';

export default function MobileLayout(props) {
  const [screen, setScreen] = useState('home');
  const [exiting, setExiting] = useState(false);
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
  }, []);

  const handleBack = useCallback(() => {
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
  }, [screen]);

  const handleTerminalOpen = useCallback((appId) => {
    setExiting(false);
    setScreen(appId);
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
    </div>
  );
}
