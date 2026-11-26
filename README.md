# Mazu-space

Personal portfolio rebuilt as a continuous dark gothic-punk 3D cathedral nave. Visitors enter through swinging gothic doors and descend through the chapels on a scroll-driven camera spline: the CRT Eye, the whoami reliquary, the live Discord halo over a turntable altar, the stained-glass dump gallery, the games hall of fame, and the carved commit ledger.

[mazu.is-a.dev](https://mazu.is-a.dev)

## Features

- Continuous 3D cathedral nave in Three.js (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) with procedural lancet arches, fluted columns, swaying iron chains, floor smoke, and selective crimson bloom.
- Chapel text set directly on the scene as real DOM (readable by screen readers), boxless minimal HUD, and shared grain, scanline, and vignette film post-layer.
- One chapel list (`src/data/chapels.js`) drives numerals, nav, scroll stops, the camera path and where each chapel sits in the nave.
- Gothic doors onboarding with red seam loading light, dust motes, returning-visitor shortcut (`localStorage`), door push-in, and CRT Eye power-on shader sequence.
- Live chapel: Discord presence via Lanyard (status halo, wings, current activities) over a turntable altar that plays what I'm listening to. Live playback and progress come from Lanyard's Spotify activity; history, top tracks and the scrobble count come from Last.fm through `/api/music/*`.
- Procedural Web Audio sound bed whose analyser drives bloom, light flicker and floor smoke.
- Automatic `public/Dump/` stained-glass gallery with fullscreen lightbox, plus a virtualized 110-game crypt modal with category filters, sorting, condemned badges, and build-time Wikipedia metadata (no API key required).
- Mobile camera/layout tuning, `prefers-reduced-motion` support, keyboard navigation, and a full 2D fallback when WebGL is unavailable.

## Run locally

Requires Node.js 20+ and npm:

```bash
git clone https://github.com/Il-Mazu/Mazu-space.git
cd Mazu-space
npm install
npm run dev
```

`npm run dev` serves the site but not the `api/` functions. To run those too, use the Vercel CLI with a `.env.local` (see `.env.example`):

```bash
npx vercel dev
```

Other scripts:

```bash
npm run build     # production build in dist/
npm run preview   # preview dist/ locally
npm run thumbs    # regenerate public/Dump/thumbs/*.webp (needs ImageMagick)
```

Screenshots of every chapel (against a running `npm run preview`; run `npx playwright install chromium` once first):

```bash
node scripts/shots.mjs shots/latest desktop,mobile
```

Viewports: `desktop`, `1080p`, `1440p`, `4k`, `mobile`. Output goes to `shots/`, which is git-ignored.

## Environment variables

Set these in the Vercel project (and in `.env.local` for `vercel dev`). None are read by client code.

| Name | Used by | Notes |
| --- | --- | --- |
| `LASTFM_API_KEY` | `api/music/now`, `api/music/stats` | From https://www.last.fm/api/account/create |
| `LASTFM_USER` | same | Last.fm username |

Without them the music routes return 503 and the Live chapel falls back to Lanyard only.

## Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Enter the site from the threshold doors |
| `Tab` / `Shift+Tab` | Move between HUD, chapel index, controls, and links |
| `←` / `→` | Previous / next image in the Dump lightbox |
| `Esc` | Close the Dump lightbox or the game crypt |

## Structure

| Path | Contents |
| --- | --- |
| `src/scenes/` | Canvas, camera spline, chapel staging, procedural textures, gothic nave, chains, smoke, lighting, postprocessing |
| `src/sections/` | Doors onboarding, chapel scenes and their text overlays |
| `src/ui/` | Minimal boxless HUD and the film grain/vignette post-layer |
| `src/shaders/` | Custom GLSL for CRT eye (with power-on sweep), smoke, chain sway, stained glass, and glitch cuts |
| `src/audio/` | Web Audio engine, procedural cathedral convolution reverb synth, `AnalyserNode` sampling, and SFX |
| `src/hud/` | Pixel cursor trail |
| `src/data/` | Chapel list, content, ASCII art, and game dataset |
| `src/music/` | `useMusic` and its providers (`lanyard` for live playback, `lastfm` for history) |
| `api/` | Vercel functions (`music/now`, `music/stats`) |
| `src/fallback/` | Styled 2D gothic-punk fallback when WebGL is disabled or lost |

## Sound design and licenses

| Sound | Source | License |
| --- | --- | --- |
| Cathedral stereo impulse reverb (`ConvolverNode`) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Ambient bed (detuned drone, formant organ pad, room tone, CRT hum, random chain creaks) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Per-chapel ambient tinting (heart pulse, shimmer, cavern lowpass, CRT hum shift) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Door opening rumble and bronze bell toll | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| CRT degauss thump and flyback power-on whine | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| UI hover tick, stone click hit, section shift whoosh, glitch burst, lightbox slide | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |

## Assets and licenses

| Asset | Source / License |
| --- | --- |
| `UnifrakturMaguntia` (`public/fonts/unifraktur-maguntia.woff2`) | SIL Open Font License 1.1 |
| `Departure Mono` (`public/fonts/departure-mono.woff2`) | SIL Open Font License 1.1 |
| `Silkscreen` (`public/fonts/silkscreen.woff2`) | SIL Open Font License 1.1 |
| 3D cathedral meshes, chains, frames, and surface textures | Procedural code in `src/scenes/` (MIT / repo source) |
| Eye video/poster, `public/Dump/` images | Personal/site media |
