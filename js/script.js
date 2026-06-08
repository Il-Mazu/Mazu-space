/* ── BOOT SEQUENCE ───────────────────────── */
const bootMsgs = [
  { text: '[ BIOS ] BOIA-BIOS v1.0a',         delay: 350 },
  { text: '[ BIOS ] POST: OK',                     delay: 200 },
  { text: '[ BIOS ] Si va: a letto',               delay: 300 },
  { text: '[ BIOS ] loading kernel...',            delay: 350 },
  { text: '[ SYS  ] mazu/OS v0.2.0',                delay: 200 },
  { text: '[ SYS  ] Per: forza',                   delay: 200 },
  { text: '[ NET  ] interface: loopback only',     delay: 300 },
  { text: '[ SYS  ] entering desktop...',          delay: 600 },
];

const $ = id => document.getElementById(id);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function bootSequence() {
  const boot   = $('boot');
  const status = $('boot-status');
  const cursor = $('boot-cursor');
  status.innerHTML = '';

  try {

  // Phase 1 — power-on (CSS animation plays)
  await sleep(700);

  // Phase 2 — memory test (rapid counter)
  const memLine = document.createElement('div');
  status.appendChild(memLine);
  cursor.style.display = 'none';
  for (let mem = 0; mem <= 65536; mem += 1024) {
    memLine.textContent =
      '[ BIOS ] memory: ' + String(mem).padStart(5, '0') + 'KB';
    await sleep(4);
  }
  memLine.textContent = '[ BIOS ] memory: 65536KB OK';
  await sleep(350);
  cursor.style.display = '';

  // Phase 3 — typewriter messages
  for (const msg of bootMsgs) {
    const line = document.createElement('div');
    status.appendChild(line);

    for (let c = 0; c < msg.text.length; c++) {
      line.textContent += msg.text[c];
      await sleep(10 + Math.random() * 8);
    }

    await sleep(msg.delay);
  }

  // Phase 4 — loading bar (ASCII, visible)
  const loadLine = document.createElement('div');
  status.appendChild(loadLine);
  cursor.style.display = 'none';

  for (let pct = 0; pct <= 100; pct += 2) {
    const blocks = Math.floor(pct / 5);
    const bar = '#'.repeat(blocks) + '.'.repeat(20 - blocks);
    loadLine.textContent = '[ SYS  ] [' + bar + '] ' +
      String(pct).padStart(3) + '%';
    await sleep(25);
  }
  loadLine.textContent = '[ SYS  ] [####################] 100%';
  await sleep(600);

  // Phase 5 — fade out
  await sleep(200);
  boot.classList.add('hidden');
  await sleep(600);
  boot.style.display = 'none';

  } catch (e) {
    console.error('boot error:', e);
    boot.classList.add('hidden');
    setTimeout(() => { boot.style.display = 'none'; }, 600);
  }
}

/* ── GLITCH ENGINE ───────────────────────── */
function triggerGlitch() {
  const win = document.querySelector('.window.focused');
  if (win) {
    win.classList.remove('tear');
    void win.offsetWidth;
    win.classList.add('tear');
  }
}

function triggerScreenShake() {
  const desktop = document.getElementById('desktop');
  desktop.style.animation = 'none';
  void desktop.offsetWidth;
  desktop.style.animation = 'shake 0.15s ease-out';
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 1px); }
    40% { transform: translate(2px, -1px); }
    60% { transform: translate(-1px, 2px); }
    80% { transform: translate(1px, -2px); }
  }
`;
document.head.appendChild(styleSheet);

let glitchInterval = null;

function startGlitchEngine() {
  glitchInterval = setInterval(() => {
    if (Math.random() < 0.15) {
      triggerGlitch();
    }
    if (Math.random() < 0.05) {
      triggerScreenShake();
    }
  }, 4000);
}

/* ── CLOCK ────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  document.getElementById('clock').textContent = h+':'+m;
}
updateClock();
setInterval(updateClock, 10000);

/* ── Z-INDEX MANAGER ──────────────────────── */
let zTop = 10;
function bringToFront(win) {
  document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
  win.classList.add('focused');
  win.style.zIndex = ++zTop;
  document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
  const tb = document.getElementById('task-' + win.id);
  if (tb) tb.classList.add('active');
}

/* ── WINDOW OPEN/CLOSE ────────────────────── */
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.style.display = 'flex';
  bringToFront(win);
  closeStartMenu();
}

document.querySelectorAll('.win-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const action = btn.dataset.action;
    const winId  = btn.dataset.win;
    const win    = document.getElementById(winId);
    if (!win) return;
    if (action === 'cls') { win.style.display = 'none'; }
    if (action === 'min') { win.style.display = 'none'; }
    if (action === 'max') { showNotif('// maximize: coming soon'); }
  });
});

/* ── DRAG ─────────────────────────────────── */
document.querySelectorAll('.window').forEach(win => {
  const tb = win.querySelector('.titlebar');
  let dragging = false, ox = 0, oy = 0;

  win.addEventListener('mousedown', e => {
    if (!e.target.classList.contains('win-btn')) bringToFront(win);
  });

  tb.addEventListener('mousedown', e => {
    if (e.target.classList.contains('win-btn')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const nx = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, e.clientX - ox));
    const ny = Math.max(0, Math.min(window.innerHeight - 32 - win.offsetHeight, e.clientY - oy));
    win.style.left = nx + 'px';
    win.style.top  = ny + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });
});

/* ── RESIZE (edge-based) ──────────────────── */
const RESIZE_MARGIN = 6;

document.querySelectorAll('.window').forEach(win => {
  let resizing = false;
  let resizeSides = {};
  let startX, startY, startW, startH, startL, startT;

  function getEdge(e) {
    const rect = win.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    return {
      top:    y - rect.top <= RESIZE_MARGIN,
      bottom: rect.bottom - y <= RESIZE_MARGIN,
      left:   x - rect.left <= RESIZE_MARGIN,
      right:  rect.right - x <= RESIZE_MARGIN,
    };
  }

  function edgeCursor(sides) {
    if (sides.top && sides.left)   return 'nwse-resize';
    if (sides.top && sides.right)  return 'nesw-resize';
    if (sides.bottom && sides.left) return 'nesw-resize';
    if (sides.bottom && sides.right) return 'nwse-resize';
    if (sides.top || sides.bottom) return 'ns-resize';
    if (sides.left || sides.right)  return 'ew-resize';
    return '';
  }

  win.addEventListener('mousemove', e => {
    if (resizing) return;
    const sides = getEdge(e);
    win.style.cursor = edgeCursor(sides) || '';
  });

  win.addEventListener('mouseleave', () => {
    if (!resizing) win.style.cursor = '';
  });

  win.addEventListener('mousedown', e => {
    if (e.target.closest('.titlebar') || e.target.closest('.win-btn')) return;
    const sides = getEdge(e);
    if (!sides.top && !sides.bottom && !sides.left && !sides.right) return;

    resizing = true;
    resizeSides = sides;
    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;
    startL = win.offsetLeft;
    startT = win.offsetTop;
    e.preventDefault();
    bringToFront(win);
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newL = startL, newT = startT, newW = startW, newH = startH;

    if (resizeSides.left)   { newL = startL + dx; newW = startW - dx; }
    if (resizeSides.right)  { newW = startW + dx; }
    if (resizeSides.top)    { newT = startT + dy; newH = startH - dy; }
    if (resizeSides.bottom) { newH = startH + dy; }

    const MIN_W = 200, MIN_H = 120;
    if (newW < MIN_W) {
      if (resizeSides.left) newL = startL + startW - MIN_W;
      newW = MIN_W;
    }
    if (newH < MIN_H) {
      if (resizeSides.top) newT = startT + startH - MIN_H;
      newH = MIN_H;
    }
    newL = Math.max(0, newL);
    newT = Math.max(0, newT);

    win.style.left = newL + 'px';
    win.style.top = newT + 'px';
    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (resizing) { resizing = false; win.style.cursor = ''; }
  });
});

/* ── START MENU ───────────────────────────── */
function toggleStartMenu() {
  document.getElementById('start-menu').classList.toggle('open');
}
function closeStartMenu() {
  document.getElementById('start-menu').classList.remove('open');
}
document.getElementById('desktop').addEventListener('click', closeStartMenu);

/* ── NOTIFICATION ─────────────────────────── */
let notifTimer = null;
function showNotif(msg) {
  const n = document.getElementById('notif');
  n.textContent = msg || '// function not implemented';
  n.style.display = 'block';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { n.style.display = 'none'; }, 2200);
}

/* ── MUSIC PLAYER ─────────────────────────── */
const tracks = [
  { title: 'burial — archangel',       time: '04:18', progress: 52 },
  { title: 'actress — raven',          time: '05:34', progress: 0  },
  { title: 'arca — coraje',            time: '03:12', progress: 0  },
  { title: 'raime — exist in repeat',  time: '06:47', progress: 0  },
];
let currentTrack = 0;
let playing = true;

function renderPlaylist() {
  const pl = document.getElementById('playlist');
  pl.innerHTML = '';
  tracks.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'pl-item';
    const isNow = i === currentTrack;
    el.innerHTML = `<span class="pl-num ${isNow ? 'pl-now' : 'c-dim'}">${isNow ? '▶' : String(i+1).padStart(2,'0')}</span>
      <span class="${isNow ? 'c-accent' : ''}">${t.title}</span>`;
    el.onclick = () => { currentTrack = i; playing = true; updatePlayer(); renderPlaylist(); };
    pl.appendChild(el);
  });
}

function updatePlayer() {
  const t = tracks[currentTrack];
  document.getElementById('now-playing-title').textContent = t.title;
  document.getElementById('now-playing-time').textContent  = '  00:00 / ' + t.time;
  document.getElementById('progress-fill').style.width     = t.progress + '%';
  document.getElementById('play-btn').textContent = playing ? '▶▶|' : '►';
}

function togglePlay() { playing = !playing; updatePlayer(); }
function prevTrack()  { currentTrack = (currentTrack - 1 + tracks.length) % tracks.length; renderPlaylist(); updatePlayer(); }
function nextTrack()  { currentTrack = (currentTrack + 1) % tracks.length; renderPlaylist(); updatePlayer(); }

renderPlaylist();
updatePlayer();

/* ── TERMINAL ─────────────────────────────── */
const termCmds = {
  help:    '// available: help, about, ls, date, clear, echo [text], glitch, sysinfo',
  about:   '// mazu-space — my little corner of the internet.',
  ls:      'about.txt\nblog.txt\nplayer.exe\ndump/\nlinks.ini',
  date:    '// ' + new Date().toLocaleDateString('en-GB'),
  clear:   '__CLEAR__',
  glitch:  '// glitching the matrix...',
  sysinfo: `// mazu-space OS v0.2.0\n// arch: x86\n// mem: 64MB\n// net: loopback\n// uptime: unknown`,
};

function handleTermCmd(e) {
  if (e.key !== 'Enter') return;
  const input  = document.getElementById('term-input');
  const output = document.getElementById('terminal-output');
  const cmd    = input.value.trim().toLowerCase();
  input.value  = '';

  const cmdBase = cmd.split(' ')[0];

  if (cmd === '') return;

  if (cmd === 'clear') {
    output.innerHTML = '<span class="c-accent">C:\\&gt;</span> <span class="cursor"></span>';
    return;
  }

  let response = '';
  if (cmdBase === 'echo') {
    response = cmd.slice(5);
  } else if (cmd === 'glitch') {
    response = '// glitching the matrix...';
    triggerGlitch();
    setTimeout(triggerScreenShake, 100);
  } else if (termCmds[cmd]) {
    response = termCmds[cmd];
  } else {
    response = `<span class="c-red">// '${cmd}' not recognized. type 'help'</span>`;
  }

  const lines = `<span class="c-dim">──</span><br><span class="c-accent">C:\\&gt;</span> ${cmd}<br>${response.replace(/\n/g,'<br>')}<br>`;
  output.insertAdjacentHTML('beforeend', lines);
  output.insertAdjacentHTML('beforeend', `<span class="c-accent">C:\\&gt;</span> <span class="cursor"></span>`);
  output.scrollTop = output.scrollHeight;
}

/* ── INIT ─────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  bootSequence();
  startGlitchEngine();

  const win = document.getElementById('win-about');
  win.style.opacity = '0';
  setTimeout(() => {
    win.style.transition = 'opacity 0.4s';
    win.style.opacity = '1';
  }, 2200);
});
