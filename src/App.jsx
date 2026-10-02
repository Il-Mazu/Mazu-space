import { useState, useCallback, useRef, useEffect } from 'react';
import Boot from './components/Boot';
import CrtOverlay from './components/CrtOverlay';
import NoiseOverlay from './components/NoiseOverlay';
import DesktopIcons from './components/DesktopIcons';
import Window from './components/Window';
import AboutWindow from './components/AboutWindow';
import MusicWindow from './components/MusicWindow';
import { DumpContent } from './components/DumpWindow';
import TerminalWindow from './components/TerminalWindow';
import OscilloscopeWindow from './components/OscilloscopeWindow';
import GamesWindow from './components/GamesWindow';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import Notification from './components/Notification';
import HomeWindow from './components/HomeWindow';
import useLanyard from './hooks/useLanyard';
import useScreenMode from './hooks/useScreenMode';
import MobileLayout from './components/MobileLayout';
import { WINDOWS } from './windows';
import './App.css';
import { commits, remote, buildDate } from 'virtual:git-info';
import { images as dumpImages } from 'virtual:dump-images';
import ambientSound from '../assets/ambient-sound.mp3';
import macSound from '../assets/mac-startup.mp3';
import { fadeIn, fadeOut } from './utils/audio';
import { glitch, tear, shake } from './utils/glitch';
import track0 from '../assets/Musica/akiba-kagami.mp3';
import track1 from '../assets/Musica/goreshit-fine-night.mp3';
import track2 from '../assets/Musica/machine-girl-ghost.mp3';
import track3 from '../assets/Musica/machine-girl-uzumaki.mp3';
import track4 from '../assets/Musica/sewerslvt-mr-kill-myself.mp3';
import cover0 from '../assets/covers/akiba-kagami.jpg';
import cover1 from '../assets/covers/goreshit-fine-night.jpg';
import cover2 from '../assets/covers/machine-girl-ghost.jpg';
import cover3 from '../assets/covers/machine-girl-uzumaki.jpg';
import cover4 from '../assets/covers/sewerslvt-mr-kill-myself.jpg';

const TASKBAR_H = 40;
const AMBIENT_VOL = 0.06;

function buildInitialWindows() {
  const result = {};
  for (const [id, { w, h }] of Object.entries(WINDOWS)) {
    result[id] = { open: false, visible: false, focused: false, zIndex: 1, x: 0, y: 0, w, h };
  }
  return result;
}

const TRACKS = [
  { title: 'カガミ', artist: 'AKIBA',        src: track0, cover: cover0, duration: 138 },
  { title: 'Fine Night', artist: 'Goreshit',   src: track1, cover: cover1, duration: 316 },
  { title: 'Ghost', artist: 'Machine Girl',    src: track2, cover: cover2, duration: 185 },
  { title: 'うずまき', artist: 'Machine Girl', src: track3, cover: cover3, duration: 232 },
  { title: 'Mr. Kill Myself', artist: 'Sewerslvt', src: track4, cover: cover4, duration: 471 },
];

let zCounter = 10;

export default function App() {
  // Boot plays once per tab session; reloads go straight to the desktop.
  const [bootDone, setBootDone] = useState(() => {
    try { return sessionStorage.getItem('mazu_booted') === '1'; } catch { return false; }
  });
  const [windows, setWindows] = useState(buildInitialWindows);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [notif, setNotif] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const notifTimer = useRef(null);
  const ambientRef = useRef(null);
  const [desktopReveal, setDesktopReveal] = useState(false);
  const [mobileReveal, setMobileReveal] = useState(false);
  const audioRef = useRef(null);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const ambientEnabledRef = useRef(ambientEnabled);
  ambientEnabledRef.current = ambientEnabled;
  const [glitchEnabled, setGlitchEnabled] = useState(true);
  const [lightMode, setLightMode] = useState(false);
  const [allMinimized, setAllMinimized] = useState(false);
  const lanyard = useLanyard();
  const mode = useScreenMode();
  const savedVisible = useRef(null);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [loopMode, setLoopMode] = useState(0); // 0=off, 1=repeat all, 2=repeat one

  // Preload dump images during the boot sequence
  useEffect(() => {
    dumpImages.forEach(src => { const img = new Image(); img.src = src; });
  }, []);

  const finishBoot = useCallback(() => {
    try { sessionStorage.setItem('mazu_booted', '1'); } catch {}
    setBootDone(true);
  }, []);

  const showNotif = useCallback((msg) => {
    setNotif(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(null), 2200);
  }, []);

  // ── Window management ──
  const focusWindow = useCallback((id) => {
    setWindows(prev => {
      // The focused window is always on top, so re-focusing it is a no-op.
      if (prev[id].focused) return prev;
      zCounter++;
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], focused: key === id };
      }
      next[id].zIndex = zCounter;
      return next;
    });
  }, []);

  const openWindow = useCallback((id, pos) => {
    setWindows(prev => {
      const cur = prev[id];
      if (!cur) return prev;

      let nx = pos ? pos.x : cur.x, ny = pos ? pos.y : cur.y;

      if (!cur.open) {
        nx = Math.round((window.innerWidth - cur.w) / 2);
        ny = Math.round((window.innerHeight - TASKBAR_H - cur.h) / 2);
      }

      zCounter++;
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], focused: key === id };
      }
      next[id] = { ...cur, open: true, visible: true, focused: true, zIndex: zCounter, x: nx, y: ny };
      return next;
    });
    setStartMenuOpen(false);
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], open: false, visible: false } }));
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], visible: false } }));
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], x, y } }));
  }, []);

  const resizeWindow = useCallback((id, x, y, w, h) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], x, y, w, h } }));
  }, []);

  const win = (id) => ({
    id, title: WINDOWS[id].title, ...windows[id],
    onFocus: focusWindow, onClose: closeWindow, onMinimize: minimizeWindow,
    onMove: moveWindow, onResize: resizeWindow,
  });

  // ── Music player ──
  const pickTrack = useCallback((prev, dir) => {
    if (shuffle) {
      let next;
      do { next = Math.floor(Math.random() * TRACKS.length); }
      while (next === prev && TRACKS.length > 1);
      return next;
    }
    return (prev + dir + TRACKS.length) % TRACKS.length;
  }, [shuffle]);

  const prevTrack = useCallback(() => setCurrentTrack(prev => pickTrack(prev, -1)), [pickTrack]);
  const nextTrack = useCallback(() => setCurrentTrack(prev => pickTrack(prev, 1)), [pickTrack]);
  const togglePlay = useCallback(() => setPlaying(prev => !prev), []);
  const toggleShuffle = useCallback(() => setShuffle(prev => !prev), []);
  const cycleLoop = useCallback(() => setLoopMode(prev => (prev + 1) % 3), []);
  const selectTrack = useCallback((i) => {
    setCurrentTrack(i);
    setPlaying(true);
  }, []);

  // ── Toggles ──
  const toggleCrt = useCallback(() => setCrtEnabled(prev => !prev), []);
  const toggleNoise = useCallback(() => setNoiseEnabled(prev => !prev), []);
  const toggleAmbient = useCallback(() => setAmbientEnabled(prev => !prev), []);
  const toggleGlitch = useCallback(() => setGlitchEnabled(prev => !prev), []);
  const toggleLightMode = useCallback(() => setLightMode(prev => !prev), []);
  const toggleDesktop = useCallback(() => setAllMinimized(prev => !prev), []);

  useEffect(() => {
    setWindows(prev => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key] };
      }
      if (allMinimized) {
        savedVisible.current = {};
        for (const key of Object.keys(prev)) {
          savedVisible.current[key] = prev[key].visible;
          next[key].visible = false;
        }
      } else {
        for (const key of Object.keys(prev)) {
          next[key].visible = savedVisible.current?.[key] || false;
        }
      }
      return next;
    });
  }, [allMinimized]);

  // ── Start menu ──
  const toggleStartMenu = useCallback(() => setStartMenuOpen(prev => !prev), []);
  const handleDesktopClick = useCallback(() => setStartMenuOpen(false), []);

  // Listen for custom mazu-notif events (from maximize button, etc.)
  useEffect(() => {
    const handler = (e) => showNotif(e.detail);
    window.addEventListener('mazu-notif', handler);
    return () => window.removeEventListener('mazu-notif', handler);
  }, [showNotif]);

  // ── Glitch engine ──
  useEffect(() => {
    if (!glitchEnabled) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (Math.random() < 0.15) tear();
      if (Math.random() < 0.05) shake();
    }, 4000);
    return () => clearInterval(interval);
  }, [glitchEnabled]);

  // Sync reveal states when switching modes after boot
  useEffect(() => {
    if (!bootDone) return;
    setMobileReveal(mode === 'mobile');
    setDesktopReveal(mode !== 'mobile');
  }, [mode, bootDone]);

  // Open only AboutWindow after boot, then trigger reveal
  useEffect(() => {
    if (!bootDone) return;
    if (mode === 'mobile') {
      setMobileReveal(true);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight - TASKBAR_H;
    setWindows(prev => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], focused: false };
      }
      next['win-about'] = {
        ...prev['win-about'],
        x: Math.round(vw * 0.02),
        y: 0,
        w: Math.round(vw * 0.25),
        h: vh,
        open: true, visible: true, focused: true, zIndex: ++zCounter,
      };
      return next;
    });
    setStartMenuOpen(false);
    setDesktopReveal(true);
  }, [bootDone]);

  // Play Mac startup sound then crossfade to ambient background after boot
  useEffect(() => {
    if (!bootDone) return;

    const mac = new Audio(macSound);
    const ambient = new Audio(ambientSound);
    ambient.loop = true;
    ambientRef.current = ambient;

    fadeIn(mac, 0.12, 500);

    let crossfaded = false;

    mac.addEventListener('loadedmetadata', () => {
      const fadeStart = (mac.duration - 0.8) * 1000;
      if (fadeStart > 0) {
        setTimeout(() => {
          if (!crossfaded) {
            crossfaded = true;
            fadeOut(mac, 600);
            fadeIn(ambient, AMBIENT_VOL, 600);
          }
        }, fadeStart);
      }
    });

    mac.addEventListener('ended', () => {
      if (!crossfaded) {
        crossfaded = true;
        fadeIn(ambient, AMBIENT_VOL, 400);
      }
    });

    // A skipped boot has no user gesture yet, so autoplay is blocked until the first click.
    const unlock = () => { if (ambientRef.current === ambient && ambient.paused && ambientEnabledRef.current) fadeIn(ambient, AMBIENT_VOL, 600); };
    document.addEventListener('pointerdown', unlock, { once: true });

    return () => {
      document.removeEventListener('pointerdown', unlock);
      mac.pause();
      mac.currentTime = 0;
      ambient.pause();
      ambient.currentTime = 0;
      ambientRef.current = null;
    };
  }, [bootDone]);

  // ── Theme ──
  useEffect(() => {
    document.documentElement.dataset.theme = lightMode ? 'light' : 'dark';
  }, [lightMode]);

  // ── Ambient audio toggle ──
  useEffect(() => {
    if (!ambientRef.current) return;
    if (ambientEnabled) {
      ambientRef.current.play().catch(() => {});
    } else {
      ambientRef.current.pause();
    }
  }, [ambientEnabled]);

  // ── Music track audio ──
  // Track changes load a new source; play/pause only toggles playback, so
  // resuming continues where it stopped instead of restarting the track.
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const audio = audioRef.current;
    if (!bootDone || !audio) return;
    audio.src = TRACKS[currentTrack].src;
    if (playingRef.current) audio.play().catch(() => {});
  }, [bootDone, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!bootDone || !audio) return;
    if (playing) audio.play().catch(() => {});
    else audio.pause();
  }, [bootDone, playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (loopMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      setCurrentTrack(prev => pickTrack(prev, 1));
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [loopMode, pickTrack]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ── Responsive sizing for the about window ──
  useEffect(() => {
    const updateSizes = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - TASKBAR_H;
      setWindows(prev => prev['win-about'].visible ? {
        ...prev,
        'win-about': { ...prev['win-about'], x: Math.round(vw * 0.02), w: Math.round(vw * 0.25), h: vh },
      } : prev);
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // ── Statusbar configurations ──
  const statusFor = (id) => {
    const statuses = {
      'win-home': [
        { text: 'v0.2.0', className: 'status-seg' },
        { text: `source: ${remote.replace(/^git@/, '').replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(':', '/')}` },
      ],
      'win-about': [
        { text: 'ONLINE', className: 'status-seg c-accent' },
        { text: 'v0.2.0', className: 'status-seg' },
        { text: 'UTF-8' },
      ],
      'win-music': [
        { text: playing ? 'PLAYING' : 'PAUSED', className: 'status-seg c-red' },
        { text: `${TRACKS.length} tracks`, className: 'status-seg' },
        { text: `vol: ${Math.round(volume * 100)}%` },
      ],
    };
    return statuses[id] || null;
  };

  const focusedId = Object.keys(windows).find(id => windows[id].focused);

  const playerProps = {
    tracks: TRACKS, audioRef,
    currentTrack, playing, volume, shuffle, loopMode,
    onPrev: prevTrack, onNext: nextTrack, onTogglePlay: togglePlay,
    onToggleShuffle: toggleShuffle, onCycleLoop: cycleLoop,
    onVolumeChange: setVolume, onSelectTrack: selectTrack,
  };

  const mobileProps = {
    ...playerProps,
    commits, remote, buildDate,
    tracksCount: TRACKS.length,
    lanyard, showNotif,
    onGlitch: glitch,
  };

  return (
    <>
      {!bootDone && <Boot onComplete={finishBoot} />}
      {crtEnabled && <CrtOverlay />}
      {noiseEnabled && <NoiseOverlay />}

      <audio ref={audioRef} preload="auto" />

      {bootDone && mode === 'desktop' && (
        <>
          <div id="desktop" className={desktopReveal ? 'desktop-reveal' : ''} onClick={handleDesktopClick}>
            <div id="wallpaper">
              <img src="/assets/wallpaper.gif" alt="wallpaper" draggable={false} />
            </div>

            <DesktopIcons onOpen={openWindow} />

            <Window {...win('win-home')} statusbar={statusFor('win-home')}>
              <HomeWindow commits={commits} remote={remote} buildDate={buildDate} tracksCount={TRACKS.length} lanyard={lanyard} />
            </Window>

            <Window {...win('win-about')} statusbar={statusFor('win-about')}>
              <AboutWindow />
            </Window>

            <Window {...win('win-music')} statusbar={statusFor('win-music')}>
              <MusicWindow {...playerProps} onNotif={showNotif} lanyard={lanyard} />
            </Window>

            <Window {...win('win-dump')}>
              <DumpContent focused={windows['win-dump'].focused} />
            </Window>

            <Window {...win('win-term')}>
              <TerminalWindow onOpen={openWindow} onGlitch={glitch} />
            </Window>

            <OscilloscopeWindow {...win('win-scope')} audioRef={audioRef} />

            <GamesWindow {...win('win-games')} />

            <Notification message={notif} />
          </div>

          <StartMenu open={startMenuOpen} onOpen={openWindow} onNotif={showNotif} />
          <Taskbar
            windows={windows}
            focusedId={focusedId}
            onOpenWindow={openWindow}
            onMinimizeWindow={minimizeWindow}
            onToggleStartMenu={toggleStartMenu}
            settings={{ crt: crtEnabled, noise: noiseEnabled, ambient: ambientEnabled, glitch: glitchEnabled, lightMode }}
            onToggleCrt={toggleCrt}
            onToggleNoise={toggleNoise}
            onToggleAmbient={toggleAmbient}
            onToggleGlitch={toggleGlitch}
            onToggleLightMode={toggleLightMode}
            onToggleDesktop={toggleDesktop}
            allMinimized={allMinimized}
          />
        </>
      )}
      {bootDone && mode === 'mobile' && (
        <div className={'mobile-reveal-wrap' + (mobileReveal ? ' mobile-reveal-active' : '')}>
          <MobileLayout {...mobileProps} />
        </div>
      )}
    </>
  );
}
