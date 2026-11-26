# Mazu-space

Personal portfolio rebuilt as a continuous dark gothic-punk 3D cathedral nave. Visitors enter through swinging gothic doors and descend through eight chapels on a scroll-driven camera spline: the CRT Eye, whoami reliquary, live Discord halo, vinyl altar and 3D oscilloscope, stained-glass dump gallery, virtualized game crypt, interactive confessional terminal, and carved commit ledger.

[mazu.is-a.dev](https://mazu.is-a.dev)

## Features

- Continuous 3D cathedral nave in Three.js (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) with procedural lancet arches, fluted columns, swaying iron chains, floor smoke, and selective crimson bloom.
- Diegetic 3D typography (`drei` `<Html transform>`), boxless minimal HUD, and shared grain, scanline, and vignette film post-layer.
- Gothic doors onboarding with red seam loading light, dust motes, returning-visitor shortcut (`localStorage`), door push-in, and CRT Eye power-on shader sequence.
- Live Discord presence and Spotify status via Lanyard, framed by 3D wings and a status-colored halo.
- Lazy-loaded Web Audio music player with dynamic metadata durations, driving bloom, light flicker, floor smoke, eye pupil dilation, and a 128-sample 3D red neon oscilloscope.
- Automatic `public/Dump/` stained-glass gallery with fullscreen lightbox, plus a virtualized 110-game crypt modal with category filters, sorting, condemned badges, and build-time Wikipedia metadata (no API key required).
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

## Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Enter the site from the threshold doors |
| `Tab` / `Shift+Tab` | Move between HUD, chapel index, controls, and links |
| `←` / `→` | Previous / next image in the Dump lightbox |
| `↑` / `↓` | Cycle terminal command history |
| `Esc` | Close the Dump lightbox, close the game crypt, or exit the terminal confessional |

## Structure

| Path | Contents |
| --- | --- |
| `src/scenes/` | Canvas, camera spline, procedural textures, gothic nave, chains, smoke, lighting, oscilloscope, postprocessing |
| `src/sections/` | Doors onboarding and the eight chapels + overlays (`Hero`, `About`, `Presence`, `Music`, `Dump`, `Games`, `Terminal`, `Exit`) |
| `src/ui/` | Minimal boxless HUD, film grain/vignette post-layer, and in-scene diegetic UI overlays |
| `src/shaders/` | Custom GLSL for CRT eye (with power-on sweep), smoke, chain sway, stained glass, and glitch cuts |
| `src/audio/` | Web Audio engine, procedural cathedral convolution reverb synth, `AnalyserNode` sampling, and SFX |
| `src/hud/` | Pixel cursor trail |
| `src/data/` | Centralized content, ASCII art, tracklist, and game dataset |
| `src/fallback/` | Styled 2D gothic-punk fallback when WebGL is disabled or lost |

## Sound design and licenses

| Sound | Source | License |
| --- | --- | --- |
| Cathedral stereo impulse reverb (`ConvolverNode`) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Ambient bed (detuned drone, formant organ pad, room tone, CRT hum, random chain creaks) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Per-chapel ambient tinting (heart pulse, shimmer, cavern lowpass, CRT hum shift) | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| Door opening rumble and bronze bell toll | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| CRT degauss thump and flyback power-on whine | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |
| UI hover tick, stone click hit, section shift whoosh, glitch burst, keystroke, lightbox slide | Procedural Web Audio API (`src/audio/cathedralSynth.js`) | Original / CC0 |

## Assets and licenses

| Asset | Source / License |
| --- | --- |
| `UnifrakturMaguntia` (`public/fonts/unifraktur-maguntia.woff2`) | SIL Open Font License 1.1 |
| `Departure Mono` (`public/fonts/departure-mono.woff2`) | SIL Open Font License 1.1 |
| `Silkscreen` (`public/fonts/silkscreen.woff2`) | SIL Open Font License 1.1 |
| Pixel UI icon sprite (`public/icons.svg`) | [pixelarticons](https://github.com/halfmage/pixelarticons) by Gerrit Halfmann, MIT License |
| 3D cathedral meshes, chains, frames, and surface textures | Procedural code in `src/scenes/` (MIT / repo source) |
| Eye video/poster, `public/Dump/` images, `assets/` music tracks and covers | Personal/site media; check third-party track rights separately before reuse |
