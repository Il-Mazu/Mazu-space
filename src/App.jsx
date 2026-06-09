import { useState, useCallback, useRef, useEffect } from 'react';
import Boot from './components/Boot';
import CrtOverlay from './components/CrtOverlay';
import NoiseOverlay from './components/NoiseOverlay';
import DesktopIcons from './components/DesktopIcons';
import Window from './components/Window';
import AboutWindow from './components/AboutWindow';
import BlogWindow from './components/BlogWindow';
import MusicWindow from './components/MusicWindow';
import DumpWindow from './components/DumpWindow';
import TerminalWindow from './components/TerminalWindow';
import OscilloscopeWindow from './components/OscilloscopeWindow';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import Notification from './components/Notification';
import ambientSound from '../assets/ASMR - Alien： Isolation - Nap Time near a Computer Console - Ambient Sounds - NO Aliens Aboard! [rPMG0PLmh9s].mp3';
import macSound from '../assets/Mac OS startup sound Big Sur [coxK3eWG20c].mp3';
import { fadeIn, fadeOut } from './utils/audio';
import track0 from '../assets/Musica/00 - AKIBA - カガミ.flac';
import track1 from '../assets/Musica/00 - Goreshit - Fine Night.flac';
import track2 from '../assets/Musica/00 - Machine Girl - Ghost.flac';
import track3 from '../assets/Musica/00 - Machine Girl - うずまき.flac';
import track4 from '../assets/Musica/00 - Sewerslvt - Mr. Kill Myself.flac';
import cover0 from '../assets/covers/00 - AKIBA - カガミ.jpg';
import cover1 from '../assets/covers/00 - Goreshit - Fine Night.jpg';
import cover2 from '../assets/covers/00 - Machine Girl - Ghost.jpg';
import cover3 from '../assets/covers/00 - Machine Girl - うずまき.jpg';
import cover4 from '../assets/covers/00 - Sewerslvt - Mr. Kill Myself.jpg';

const AMBIENT_VOL = 0.06;

  const INITIAL_WINDOWS = {
    'win-about': { open: false, visible: false, focused: false, zIndex: 1,  x: 80,  y: 0,   w: 380, h: null },
    'win-blog':  { open: false, visible: false, focused: false, zIndex: 1,  x: 440, y: 28,  w: 330, h: null },
    'win-music': { open: false, visible: false, focused: false, zIndex: 1,  x: 440, y: 300, w: 480, h: null },
    'win-dump':  { open: false, visible: false, focused: false, zIndex: 1,  x: 620, y: 390, w: 480, h: 360 },
    'win-term':  { open: false, visible: false, focused: false, zIndex: 1,  x: 780, y: 28,  w: 240, h: null },
    'win-scope': { open: false, visible: false, focused: false, zIndex: 1,  x: 580, y: 540, w: 560, h: 186 },
  };

const TRACKS = [
  { title: 'カガミ', artist: 'AKIBA',        src: track0, cover: cover0, duration: 138 },
  { title: 'Fine Night', artist: 'Goreshit',   src: track1, cover: cover1, duration: 316 },
  { title: 'Ghost', artist: 'Machine Girl',    src: track2, cover: cover2, duration: 185 },
  { title: 'うずまき', artist: 'Machine Girl', src: track3, cover: cover3, duration: 232 },
  { title: 'Mr. Kill Myself', artist: 'Sewerslvt', src: track4, cover: cover4, duration: 471 },
];

let zCounter = 10;

export default function App() {
  const [bootDone, setBootDone] = useState(false);
  const [windows, setWindows] = useState(INITIAL_WINDOWS);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [notif, setNotif] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const notifTimer = useRef(null);
  const [initialAnimDone, setInitialAnimDone] = useState(false);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentAudioTime, setCurrentAudioTime] = useState('00:00');
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [loopMode, setLoopMode] = useState(0); // 0=off, 1=repeat all, 2=repeat one

  const getResponsiveSizes = useCallback(() => ({
    aboutW: Math.min(420, Math.round(window.innerWidth * 0.32)),
    aboutH: window.innerHeight - 32,
    dumpW: Math.min(480, Math.round(window.innerWidth * 0.264)),
    dumpH: Math.min(360, Math.round(window.innerHeight * 0.288)),
    termX: Math.round(window.innerWidth * 0.28),
    termY: Math.round(window.innerHeight * 0.02),
    termW: Math.round(window.innerWidth * 0.32),
    termH: Math.round(window.innerHeight * 0.3),
    scopeW: Math.min(560, Math.round(window.innerWidth * 0.42)),
    scopeX: Math.round(window.innerWidth * 0.30),
    scopeY: Math.round(window.innerHeight * 0.68),
    scopeH: 186,
  }), []);

  const showNotif = useCallback((msg) => {
    setNotif(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(null), 2200);
  }, []);

  // ── Window management ──
  const focusWindow = useCallback((id) => {
    setWindows(prev => {
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

      const visible = Object.keys(prev)
        .filter(k => prev[k].visible && k !== id)
        .map(k => ({
          x: prev[k].x, y: prev[k].y,
          w: prev[k].w || 300, h: prev[k].h || 200,
        }));

      const winW = cur.w || 300;
      const winH = cur.h || 200;

      const overlaps = (x, y) =>
        visible.some(r =>
          x + winW > r.x && x < r.x + r.w &&
          y + winH > r.y && y < r.y + r.h
        );

      let nx = pos ? pos.x : cur.x, ny = pos ? pos.y : cur.y;

      if (overlaps(nx, ny)) {
        nx = cur.x + 30;
        ny = cur.y + 30;
        if (overlaps(nx, ny)) {
          const maxX = window.innerWidth - 180;
          const maxY = window.innerHeight - 32 - 100;
          let found = false;
          for (let gy = 0; gy <= maxY && !found; gy += 40) {
            for (let gx = 0; gx <= maxX && !found; gx += 40) {
              if (!overlaps(gx, gy)) {
                nx = gx; ny = gy;
                found = true;
              }
            }
          }
          if (!found) { nx = cur.x; ny = cur.y; }
        }
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
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], x, y },
    }));
  }, []);

  const resizeWindow = useCallback((id, x, y, w, h) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], x, y, w, h },
    }));
  }, []);

  // ── Music player ──
  const pickNextTrack = useCallback((prev) => {
    if (shuffle) {
      let next;
      do { next = Math.floor(Math.random() * TRACKS.length); }
      while (next === prev && TRACKS.length > 1);
      return next;
    }
    return (prev + 1) % TRACKS.length;
  }, [shuffle]);

  const pickPrevTrack = useCallback((prev) => {
    if (shuffle) {
      let next;
      do { next = Math.floor(Math.random() * TRACKS.length); }
      while (next === prev && TRACKS.length > 1);
      return next;
    }
    return (prev - 1 + TRACKS.length) % TRACKS.length;
  }, [shuffle]);

  const prevTrack = useCallback(() => {
    setCurrentTrack(prev => pickPrevTrack(prev));
    setProgress(0);
    setCurrentAudioTime('00:00');
  }, [pickPrevTrack]);
  const nextTrack = useCallback(() => {
    setCurrentTrack(prev => pickNextTrack(prev));
    setProgress(0);
    setCurrentAudioTime('00:00');
  }, [pickNextTrack]);
  const togglePlay = useCallback(() => setPlaying(prev => !prev), []);
  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);
  const toggleShuffle = useCallback(() => setShuffle(prev => !prev), []);
  const cycleLoop = useCallback(() => setLoopMode(prev => (prev + 1) % 3), []);
  const selectTrack = useCallback((i) => {
    setCurrentTrack(i);
    setProgress(0);
    setCurrentAudioTime('00:00');
    setPlaying(true);
  }, []);

  // ── Start menu ──
  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen(prev => !prev);
  }, []);

  // Close start menu on desktop click
  const handleDesktopClick = useCallback(() => {
    setStartMenuOpen(false);
  }, []);

  // Listen for custom mazu-notif events (from maximize button, etc.)
  useEffect(() => {
    const handler = (e) => showNotif(e.detail);
    window.addEventListener('mazu-notif', handler);
    return () => window.removeEventListener('mazu-notif', handler);
  }, [showNotif]);

  // ── Glitch ──
  const triggerGlitch = useCallback(() => {
    setWindows(prev => {
      const focusedId = Object.keys(prev).find(id => prev[id].focused);
      if (!focusedId) return prev;
      return prev; // glitch effect handled in component
    });
  }, []);

  // ── Glitch engine ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const el = document.querySelector('.window.focused');
        if (el) {
          el.classList.remove('tear');
          void el.offsetWidth;
          el.classList.add('tear');
        }
      }
      if (Math.random() < 0.05) {
        const desktop = document.getElementById('desktop');
        if (desktop) {
          desktop.classList.remove('shake');
          void desktop.offsetWidth;
          desktop.classList.add('shake');
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Open about and dump windows with CRT power-on after boot sequence completes
  useEffect(() => {
    if (bootDone) {
      const { dumpW, dumpH, termX, termY, termW, termH, scopeX, scopeY, scopeW, scopeH } = getResponsiveSizes();
      const bigW = Math.min(600, Math.round(dumpW * 1.25));
      const bigH = Math.min(450, Math.round(dumpH * 1.25));
      const dx = Math.max(0, window.innerWidth - bigW - 20 - Math.round(window.innerWidth * 0.045));
      const dy = Math.max(0, window.innerHeight - 32 - bigH - 20);
      const aboutZ = ++zCounter;
      const dumpZ = ++zCounter;
      setWindows(prev => {
        const next = {};
        for (const key of Object.keys(prev)) {
          next[key] = { ...prev[key], focused: key === 'win-dump' };
        }
        next['win-about'] = {
          ...prev['win-about'], open: true, visible: true, focused: false,
          zIndex: aboutZ,
        };
        next['win-dump'] = {
          ...prev['win-dump'], open: true, visible: true, focused: true,
          zIndex: dumpZ, x: dx, y: dy, w: bigW, h: bigH,
        };
        const musicW = 480;
        const musicX = Math.max(0, window.innerWidth - musicW - 16 - 80 - 16 - Math.round(window.innerWidth * 0.045));
        next['win-music'] = {
          ...prev['win-music'], open: true, visible: true, focused: false,
          zIndex: ++zCounter, x: musicX, y: 16,
        };
        next['win-term'] = {
          ...prev['win-term'], open: true, visible: true, focused: false,
          zIndex: ++zCounter, x: termX, y: termY, w: termW, h: termH,
        };
        next['win-scope'] = {
          ...prev['win-scope'], open: true, visible: true, focused: false,
          zIndex: ++zCounter, x: scopeX, y: scopeY, w: scopeW, h: scopeH,
        };
        return next;
      });
      setStartMenuOpen(false);
      setTimeout(() => setInitialAnimDone(true), 1200);
    }
  }, [bootDone, getResponsiveSizes]);

  // Play Mac startup sound then crossfade to ambient background after boot
  useEffect(() => {
    if (!bootDone) return;

    const mac = new Audio(macSound);
    const ambient = new Audio(ambientSound);
    ambient.loop = true;

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

    return () => {
      mac.pause();
      mac.currentTime = 0;
      ambient.pause();
      ambient.currentTime = 0;
    };
  }, [bootDone]);

  // ── Music track audio ──
  useEffect(() => {
    if (!bootDone) return;
    const audio = audioRef.current;
    if (!audio) return;

    const track = TRACKS[currentTrack];
    if (!track) return;

    audio.src = track.src;
    audio.volume = volume;
    audio.load();

    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60);
        setCurrentAudioTime(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };

    const onEnded = () => {
      if (loopMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      setCurrentTrack(prev => pickNextTrack(prev));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [bootDone, currentTrack, playing, loopMode, pickNextTrack]);

  // ── Responsive sizing ──
  useEffect(() => {
    const updateSizes = () => {
      const { aboutW, aboutH, dumpW, dumpH } = getResponsiveSizes();
      setWindows(prev => ({
        ...prev,
        'win-about': {
          ...prev['win-about'],
          x: 80,
          y: 0,
          w: aboutW,
          h: aboutH,
        },
        'win-dump': {
          ...prev['win-dump'],
          x: Math.min(prev['win-dump'].x, Math.max(0, window.innerWidth - (prev['win-dump'].w || dumpW) - 20 - Math.round(window.innerWidth * 0.045))),
          y: Math.min(prev['win-dump'].y, Math.max(0, window.innerHeight - 32 - (prev['win-dump'].h || dumpH) - 20)),
        },
        'win-term': {
          ...prev['win-term'],
          x: Math.round(window.innerWidth * 0.28),
          y: Math.round(window.innerHeight * 0.02),
          w: Math.round(window.innerWidth * 0.32),
          h: Math.round(window.innerHeight * 0.3),
        },
        'win-scope': {
          ...prev['win-scope'],
          x: Math.round(window.innerWidth * 0.30),
          y: Math.round(window.innerHeight * 0.68),
          w: Math.min(560, Math.round(window.innerWidth * 0.42)),
          h: 186,
        },
      }));
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [getResponsiveSizes]);

  // ── Window menubar configurations ──
  const menuFor = (id) => {
    const menus = {
      'win-about': [
        { label: 'File', onClick: () => showNotif() },
        { label: 'Edit', onClick: () => showNotif() },
        { label: 'View', onClick: () => showNotif() },
      ],
      'win-blog': [
        { label: 'New Post',  onClick: () => showNotif('// new post: not implemented') },
        { label: 'Archive',   onClick: () => showNotif() },
        { label: 'Tags',      onClick: () => showNotif() },
      ],
      'win-music': null,
    };
    return menus[id] || null;
  };

  // ── Statusbar configurations ──
  const statusFor = (id) => {
    const statuses = {
      'win-about': [
        { text: 'ONLINE', className: 'status-seg c-accent' },
        { text: 'v0.2.0', className: 'status-seg' },
        { text: 'UTF-8' },
      ],
      'win-blog': [
        { text: '6 posts', className: 'status-seg' },
        { text: 'read_only: false', className: 'status-seg' },
        { text: 'latest: 2025.06.07' },
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

  const w = windows;

  return (
    <>
      {!bootDone && <Boot onComplete={() => setBootDone(true)} />}
      <CrtOverlay />
      <NoiseOverlay />

      <div id="desktop" onClick={handleDesktopClick}>
        <div id="wallpaper">
          <img
            src="/assets/SnapInsta.to_AQP6ityFpUZrqTmrQLvEfDJDLAQZ4IymuY53NRO4PN-QJhqHphA2zinPKk_myDBZjalUVKln64QGcWrenJJqa8UqeibABN51CJXzfv4.gif"
            alt="wallpaper"
            draggable={false}
          />
        </div>

        <DesktopIcons onOpen={openWindow} />

        <Window
          id="win-about" title="about.txt — mazu-space"
          x={w['win-about'].x} y={w['win-about'].y}
          width={w['win-about'].w} height={w['win-about'].h}
          visible={w['win-about'].visible}
          focused={w['win-about'].focused}
          zIndex={w['win-about'].zIndex}
          powerOn={!initialAnimDone}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-about')}
          statusbar={statusFor('win-about')}
        >
          <AboutWindow />
        </Window>

        <Window
          id="win-blog" title="blog.txt — THOUGHTS"
          x={w['win-blog'].x} y={w['win-blog'].y}
          width={w['win-blog'].w} height={w['win-blog'].h}
          visible={w['win-blog'].visible}
          focused={w['win-blog'].focused}
          zIndex={w['win-blog'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-blog')}
          statusbar={statusFor('win-blog')}
        >
          <BlogWindow onNotif={showNotif} />
        </Window>

          <Window
            id="win-music" title="player.exe — MEDIA"
            x={w['win-music'].x} y={w['win-music'].y}
            width={w['win-music'].w} height={w['win-music'].h}
            visible={w['win-music'].visible}
            focused={w['win-music'].focused}
            zIndex={w['win-music'].zIndex}
            powerOn={!initialAnimDone}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            menubar={menuFor('win-music')}
            statusbar={statusFor('win-music')}
          >
          <MusicWindow
            tracks={TRACKS}
            currentTrack={currentTrack}
            playing={playing}
            progress={progress}
            currentAudioTime={currentAudioTime}
            volume={volume}
            shuffle={shuffle}
            loopMode={loopMode}
            onPrev={prevTrack}
            onNext={nextTrack}
            onTogglePlay={togglePlay}
            onToggleShuffle={toggleShuffle}
            onCycleLoop={cycleLoop}
            onVolumeChange={handleVolumeChange}
            onSelectTrack={selectTrack}
            onNotif={showNotif}
          />
          <audio ref={audioRef} preload="auto" />
        </Window>

        <DumpWindow
          id="win-dump"
          x={w['win-dump'].x} y={w['win-dump'].y}
          width={w['win-dump'].w} height={w['win-dump'].h}
          visible={w['win-dump'].visible}
          focused={w['win-dump'].focused}
          zIndex={w['win-dump'].zIndex}
          powerOn={!initialAnimDone}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        />



        <Window
          id="win-term" title="cmd.exe"
          x={w['win-term'].x} y={w['win-term'].y}
          width={w['win-term'].w} height={w['win-term'].h}
          visible={w['win-term'].visible}
          focused={w['win-term'].focused}
          zIndex={w['win-term'].zIndex}
          powerOn={!initialAnimDone}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        >
          <TerminalWindow
            startupCmd="cmatrix"
            onOpen={openWindow}
            onGlitch={() => {
              const el = document.querySelector('.window.focused');
              if (el) {
                el.classList.remove('tear');
                void el.offsetWidth;
                el.classList.add('tear');
                setTimeout(() => {
                  const desktop = document.getElementById('desktop');
                  if (desktop) {
                    desktop.classList.remove('shake');
                    void desktop.offsetWidth;
                    desktop.classList.add('shake');
                  }
                }, 100);
              }
            }}
          />
        </Window>

        <OscilloscopeWindow
          id="win-scope"
          x={w['win-scope'].x} y={w['win-scope'].y}
          width={w['win-scope'].w} height={w['win-scope'].h}
          visible={w['win-scope'].visible}
          focused={w['win-scope'].focused}
          zIndex={w['win-scope'].zIndex}
          powerOn={!initialAnimDone}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          audioElement={audioRef.current}
          trackKey={currentTrack}
        />

        <Notification message={notif} />
      </div>

      <StartMenu open={startMenuOpen} onOpen={openWindow} onNotif={showNotif} />
      <Taskbar
        windows={windows}
        focusedId={focusedId}
        onOpenWindow={openWindow}
        onMinimizeWindow={minimizeWindow}
        onToggleStartMenu={toggleStartMenu}
      />
    </>
  );
}
