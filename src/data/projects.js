// Curated works, in display order. GitHub fills in description, language,
// stars, topics, homepage and last push at build time (see vite.config.js);
// anything here wins over what GitHub returns.
export const GITHUB_OWNER = 'Il-Mazu';

export const PROJECTS = [
  {
    repo: 'DemoMaker',
    name: 'DemoMaker',
    blurb: 'Turns an HTML page into a showcase video: a browser window on a wallpaper, a scripted cursor and camera, rendered frame by frame so nothing ever drops.',
    details: [
      'The page clock is stepped 1/60 s at a time, so slow machines still get every frame and the page animations play exactly as written.',
      'Scroll stops and hover targets are read from the page itself: section tops, and elements whose :hover rules change more than colour.',
      'No npm packages: Node, headless Chrome and ffmpeg.',
    ],
    note: 'Every video in these niches was rendered with DemoMaker.',
    stack: ['Node.js', 'headless Chrome', 'ffmpeg'],
    media: { video: '/works/demomaker.mp4', poster: '/works/demomaker.webp' },
  },
  {
    repo: 'De-PerPortal',
    name: 'Dè PerPortal',
    blurb: 'Portable Windows companion for the Cemu Skylanders portal: figure presets for two players and a controller quick-swap dial.',
    details: [
      "Hold L3 + R3 in game for a radial dial; point a stick at an element to swap that player's Skylander.",
      'Backs up every figure before it goes on the portal, and can diagnose, fix or reset "broken toy" dumps.',
      'A collection view with per-element progress, a Nuzlocke mode, themes for every game, and self-updates checked against SHA-256.',
    ],
    stack: ['Electron', 'JavaScript', 'Windows'],
    media: { video: '/works/deperportal.mp4', poster: '/works/deperportal.webp' },
    live: 'https://il-mazu.github.io/De-PerPortal/',
    download: 'https://github.com/Il-Mazu/De-PerPortal/releases/latest',
  },
  {
    repo: 'Swiffer',
    name: 'Swiffer',
    blurb: 'Local disk-space dashboard with one-click cleanup for Linux and Windows, written with nothing but the Python standard library.',
    details: [
      'Shows free space, what takes the most room, and a chart of free space over time.',
      'Cleans package caches (pacman, APT, DNF), unused packages, Flatpak runtimes, logs, crash dumps and app caches; admin steps go through pkexec or UAC.',
      'The server only listens on localhost.',
    ],
    stack: ['Python', 'stdlib only', 'Linux', 'Windows'],
    media: { image: '/works/swiffer.webp' },
  },
  {
    repo: 'BibliotecAPP',
    name: 'BibliotecAPP',
    blurb: 'A library catalog with reservations and admin tools; covers and metadata come from Open Library.',
    details: [
      'Users search the catalog and hold up to three active reservations, each with its own code.',
      'Admins manage books and accounts; books can be imported straight from Open Library.',
      'JWT auth on an Express API over MongoDB, with a React front end in light and dark.',
    ],
    stack: ['React', 'Express', 'MongoDB'],
    media: { image: '/works/bibliotecapp.webp' },
  },
];
