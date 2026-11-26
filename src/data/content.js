export const SITE = {
  title: 'Mazu-space',
  wordmark: 'MAZU',
  version: '3.0.0',
  motto: 'Never fade away',
  subtitle: 'digital reliquary // code, art & noise',
  scrollCue: '♰ DESCEND',
};

export const BOOT_LINES = [
  '[ BIOS ] BOIA-BIOS v1.0a ... POST OK',
  '[ BIOS ] Si va: a letto',
  '[ SYS  ] mazu/OS v3.0.0 -- Per: forza',
  '[ NET  ] interface: loopback only',
];

export const ABOUT = {
  prompt: 'C:\\mazu-space> whoami',
  greeting: [
    'hi, my name is Marco!',
    'here i write, draw, and code stuff.',
    'feel free to look around',
  ],
  facts: [
    { key: 'name', value: 'Marco' },
    { key: 'handle', value: 'mazu' },
    { key: 'age', value: '20' },
    { key: 'role', value: 'full stack dev student' },
    { key: 'tags', value: 'code, art, music' },
  ],
  motto: 'Never fade away',
};

export const PRESENCE = {
  userId: '864941785666813992',
  statusColors: {
    online: '#2bb57f',
    idle: '#d68d1f',
    dnd: '#e5484d',
    offline: '#8a8a94',
  },
};

export const LINKS = [
  { label: 'github', href: 'https://github.com/Il-Mazu' },
  { label: 'instagram', href: 'https://www.instagram.com/ilmazu_' },
  { label: 'spotify', href: 'https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj' },
];

export const SECTIONS = [
  {
    id: 'hero',
    roman: 'I',
    name: 'the eye',
    label: 'I. THE EYE',
    z: 0,
    scrollPos: 0.0,
    camPos: [0, 1.9, 9.5],
    lookAt: [0, 1.5, -2.0],
  },
  {
    id: 'about',
    roman: 'II',
    name: 'whoami',
    label: 'II. WHOAMI',
    z: -22,
    scrollPos: 0.143,
    camPos: [-1.8, 1.2, -13.5],
    lookAt: [0.4, 0.9, -22.0],
  },
  {
    id: 'presence',
    roman: 'III',
    name: 'presence',
    label: 'III. PRESENCE',
    z: -42,
    scrollPos: 0.286,
    camPos: [1.9, 0.6, -33.5],
    lookAt: [-0.2, 0.4, -42.0],
  },
  {
    id: 'music',
    roman: 'IV',
    name: 'altar of noise',
    label: 'IV. NOISE',
    z: -64,
    scrollPos: 0.429,
    camPos: [-1.6, 0.0, -54.5],
    lookAt: [0.2, -0.3, -64.0],
  },
  {
    id: 'dump',
    roman: 'V',
    name: 'stained glass',
    label: 'V. DUMP',
    z: -86,
    scrollPos: 0.571,
    camPos: [1.7, -0.8, -76.5],
    lookAt: [0, -1.0, -86.0],
  },
  {
    id: 'games',
    roman: 'VI',
    name: 'the crypt',
    label: 'VI. GAMES',
    z: -108,
    scrollPos: 0.714,
    camPos: [-1.5, -1.6, -98.0],
    lookAt: [0, -1.8, -108.0],
  },
  {
    id: 'terminal',
    roman: 'VII',
    name: 'confessional',
    label: 'VII. CMD',
    z: -130,
    scrollPos: 0.857,
    camPos: [1.2, -2.3, -122.0],
    lookAt: [0, -2.5, -130.0],
  },
  {
    id: 'exit',
    roman: 'VIII',
    name: 'log + links',
    label: 'VIII. EXIT',
    z: -152,
    scrollPos: 1.0,
    camPos: [0, -3.0, -142.5],
    lookAt: [0, -3.2, -156.0],
  },
];

export const TERMINAL_CONFIG = {
  version: '3.0.0',
  banner: [
    'mazu-space OS [v3.0.0]',
    '(c) 2026 mazu',
  ],
  commands: {
    help: '// available: help, about, ls, date, clear, echo [text], glitch, sysinfo, fastfetch, cmatrix, exit',
    about: '// mazu-space — my little corner of the internet.',
    ls: 'hero\nabout.txt\npresence\nplayer.exe\nscope.exe\ndump/\ngames.exe\nlinks',
    sysinfo: '// mazu-space OS v3.0.0\n// arch: webgl2\n// mem: 64MB\n// net: loopback\n// chassis: gothic-nave',
  },
  sectionAliases: {
    'hero': 'hero',
    'eye': 'hero',
    'about.txt': 'about',
    'about': 'about',
    'whoami': 'about',
    'presence': 'presence',
    'discord': 'presence',
    'player.exe': 'music',
    'scope.exe': 'music',
    'music': 'music',
    'dump/': 'dump',
    'dump': 'dump',
    'games.exe': 'games',
    'games': 'games',
    'cmd.exe': 'terminal',
    'terminal': 'terminal',
    'links': 'exit',
    'log': 'exit',
    'exit/': 'exit',
  },
};
