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
- Works chapel: projects from `src/data/projects.js` merged with live GitHub data at build time, shown as stone niches playing their media (dithered to the palette until hovered). Clicking one moves the camera to it and opens a manuscript page. The showcase videos in `public/works/` were rendered with [DemoMaker](https://github.com/Il-Mazu/DemoMaker).
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
| `GITHUB_TOKEN` | build (`virtual:projects`) | Optional. Only lifts the GitHub API rate limit; without it the build still works and falls back to cached or curated data |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `api/guestbook` | Set by adding Upstash Redis from the Vercel Marketplace |
| `IP_HASH_SALT` | `api/guestbook` | Long random string; salts the hashed IP used for rate limiting (the raw IP is never stored) |
| `GUESTBOOK_ADMIN_TOKEN` | `api/guestbook/[id]` | Long random string; needed to delete entries from `/admin` |

Without the Last.fm pair the music routes return 503 and the Live chapel falls back to Lanyard only. Without the guestbook ones the guestbook says it isn't open yet and hides its form.

## Guestbook

Visitors light a candle in the last chapel: a name (24 characters) and a message (140). The API strips markup and links, drops anything a hidden honeypot field catches, filters Italian and English slurs, and allows one post per 10 minutes per salted IP hash. Entries are a Redis sorted set plus one hash each; the newest 100 are shown.

To delete an entry, open `/admin` (not linked anywhere, `noindex`), paste `GUESTBOOK_ADMIN_TOKEN` and press delete. The token stays in that tab's session storage only.

To try the API locally without an Upstash account, run Redis behind Upstash's REST emulator and point `KV_REST_API_URL` at it:

```bash
podman pod create --name gb -p 127.0.0.1:8079:80
podman run -d --pod gb docker.io/library/redis:7-alpine
podman run -d --pod gb -e SRH_MODE=env -e SRH_TOKEN=local -e SRH_CONNECTION_STRING=redis://localhost:6379 docker.io/hiett/serverless-redis-http:latest
```

Then `KV_REST_API_URL=http://127.0.0.1:8079` (not `localhost`, which may resolve to IPv6), `KV_REST_API_TOKEN=local` and an `IP_HASH_SALT` in `.env.local`, and `npx vercel dev`. Remove it with `podman pod rm -f gb`.

## Keyboard

| Key | Action |
| --- | --- |
| `Enter` | Enter the site from the threshold doors |
| `Tab` / `Shift+Tab` | Move between HUD, chapel index, controls, and links |
| `←` / `→` | Previous / next image in the Dump lightbox |
| `Esc` | Close the Dump lightbox, the game crypt, a Works page or the guestbook list |

## Structure

| Path | Contents |
| --- | --- |
| `src/scenes/` | Canvas, camera spline, chapel staging, procedural textures, gothic nave, chains, smoke, lighting, postprocessing |
| `src/sections/` | Doors onboarding, chapel scenes and their text overlays |
| `src/ui/` | Minimal boxless HUD and the film grain/vignette post-layer |
| `src/shaders/` | Custom GLSL for CRT eye (with power-on sweep), smoke, chain sway, stained glass, and glitch cuts |
| `src/audio/` | Web Audio engine, procedural cathedral convolution reverb synth, `AnalyserNode` sampling, and SFX |
| `src/hud/` | Pixel cursor trail |
| `src/data/` | Chapel list, content, projects, ASCII art, and game dataset |
| `src/music/` | `useMusic` and its providers (`lanyard` for live playback, `lastfm` for history) |
| `api/` | Vercel functions (`music/now`, `music/stats`, `guestbook`, `guestbook/[id]`) |
| `src/guestbook/` | `useGuestbook`: loads entries and signs the book |
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
