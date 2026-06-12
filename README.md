# mazu-space

A retro desktop-simulator portfolio built with React.

## Features

- Draggable, resizable, minimizable windows (home, about, blog, music, dump, terminal, scope, games)
- Music player with 5 tracks, shuffle, repeat modes, volume control
- Blog with markdown posts, frontmatter tags, syntax-highlighted code blocks
- Terminal emulator with basic commands (`help`, `echo`, `open`, `glitch`, ...)
- Oscilloscope audio visualizer
- CRT scanline overlay, noise overlay, periodic glitch/shake effects
- Ambient background audio (computer console hum)
- Mac startup sound on boot
- Mobile-responsive layout
- Discord presence via Lanyard API
- Light mode (CSS invert toggle)
- Vercel Analytics & Speed Insights

## Tech Stack

[React 18](https://react.dev) · [Vite 5](https://vitejs.dev) · CSS (no framework) · [react-markdown](https://github.com/remarkjs/react-markdown) · [Lanyard](https://github.com/Phineas/lanyard)

## Getting Started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

## Project Structure

```
src/
├── App.jsx               # main app, window management, music logic
├── main.jsx              # entry point
├── index.css             # global styles
├── components/           # all UI components (windows, taskbar, boot, etc.)
├── hooks/                # useLanyard, useScreenMode
├── blog/                 # markdown posts + posts loader
└── utils/                # audio helpers (fade in/out)
assets/                   # music tracks, cover art, wallpapers, ambient sounds
public/                   # static files (favicon)
```


