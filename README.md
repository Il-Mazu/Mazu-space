# Mazu-space

Personal portfolio rebuilt as a continuous dark gothic-punk 3D cathedral nave. Visitors descend through eight chapels on a scroll-driven camera spline: the CRT Eye, whoami reliquary, live Discord halo, vinyl altar + 3D oscilloscope, stained-glass dump gallery, virtualized game crypt, interactive confessional terminal, and carved commit ledger.

[mazu.is-a.dev](https://mazu.is-a.dev)

## Features

- Continuous 3D cathedral nave in Three.js (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) with procedural lancet arches, fluted columns, swaying iron chains, floor smoke, and selective crimson bloom.
- Boot preloader with real loading progress, sound toggle, and ASCII-to-3D chrome shatter transition.
- Live Discord presence and Spotify status via Lanyard, framed by 3D wings and a status-colored halo.
- Lazy-loaded Web Audio music player driving bloom, light flicker, floor smoke, eye pupil dilation, and a 128-sample 3D red neon oscilloscope.
- Automatic `public/Dump/` stained-glass gallery with fullscreen lightbox, plus a virtualized 110-game crypt with category filters, sorting, and condemned badges.
- Zoomed-in CRT confessional terminal (`help`, `about`, `ls`, `date`, `clear`, `echo`, `glitch`, `sysinfo`, `fastfetch`, `cmatrix`, section jumps).
- Mobile camera/layout tuning, `prefers-reduced-motion` support, keyboard navigation, and a full 2D fallback when WebGL is unavailable.

## Run locally

Requires Node.js 20+ and npm:

```bash
git clone https://github.com/Il-Mazu/Mazu-space.git
cd Mazu-space
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # production build in dist/
npm run preview   # preview dist/ locally
npm run thumbs    # regenerate public/Dump/thumbs/*.webp (needs ImageMagick)
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `RAWG_API_KEY` | Optional build-time RAWG API key used by `vite.config.js` to fetch game covers, release years, and genres without exposing the key to the browser. Without it, game plaques render styled monochrome fallbacks. |

## Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Enter the site from the boot preloader |
| `Tab` / `Shift+Tab` | Move between HUD, chapel index, controls, and links |
| `←` / `→` | Previous / next image in the Dump lightbox |
| `↑` / `↓` | Cycle terminal command history |
| `Esc` | Close the Dump lightbox or exit the terminal confessional (stops `cmatrix` first) |

## Structure

| Path | Contents |
| --- | --- |
| `src/scenes/` | Canvas, camera spline, procedural textures, gothic nave, chains, smoke, lighting, oscilloscope, postprocessing |
| `src/sections/` | Preloader and the eight chapels + DOM overlays (`Hero`, `About`, `Presence`, `Music`, `Dump`, `Games`, `Terminal`, `Exit`) |
| `src/shaders/` | Custom GLSL for CRT eye, smoke, chain sway, ASCII shatter, stained glass, and glitch cuts |
| `src/audio/` | Singleton Web Audio engine, `AnalyserNode` sampling, ambient bed, and UI micro-SFX |
| `src/hud/` | Fixed wordmark, sound toggle, Roman numeral nav, mini-player, scroll chain, and pixel cursor trail |
| `src/data/` | Centralized content, ASCII art, tracklist, and game dataset |
| `src/fallback/` | Styled 2D gothic-punk fallback when WebGL is disabled or lost |

## Assets and licenses

| Asset | Source / License |
| --- | --- |
| `UnifrakturMaguntia` (`public/fonts/unifraktur-maguntia.woff2`) | SIL Open Font License 1.1 |
| `Departure Mono` (`public/fonts/departure-mono.woff2`) | SIL Open Font License 1.1 |
| `Silkscreen` (`public/fonts/silkscreen.woff2`) | SIL Open Font License 1.1 |
| Pixel UI icon sprite (`public/icons.svg`) | [pixelarticons](https://github.com/halfmage/pixelarticons) by Gerrit Halfmann, MIT License |
| 3D cathedral meshes, chains, frames, and surface textures | Procedural code in `src/scenes/` (MIT / repo source) |
| Eye video/poster, `public/Dump/` images, `assets/` audio and covers | Personal/site media; check third-party track rights separately before reuse |
