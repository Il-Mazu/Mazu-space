# Mazu-space

My website, made to look like an old desktop. It has music, an image dump, a terminal and windows you can move around.

[mazu.is-a.dev](https://mazu.is-a.dev)

![Mazu-space desktop screenshot](https://github.com/user-attachments/assets/3b05e423-59d6-4343-b34e-61f2ba9b7786)

## What it has

- Draggable, resizable and minimizable windows.
- CRT scanlines, noise overlays and a boot sequence.
- A music player and audio oscilloscope.
- Discord presence through Lanyard.
- A separate mobile interface.

## Run it locally

Install Node.js and npm, then:

```bash
git clone https://github.com/Il-Mazu/Mazu-space.git
cd Mazu-space
npm install
npm run dev
```

Open the local URL Vite prints in your terminal (normally **http://localhost:5173**).

```bash
npm run build     # production files in dist/
npm run preview   # preview the production build
```

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Move between icons, taskbar and window controls |
| `Enter` / `Space` | Activate the focused item |
| `Esc` | Close the start menu, popup or focused window |
| ``Alt+` `` / ``Alt+Shift+` `` | Cycle focus between open windows |
| `←` / `→` | Previous / next image in `dump/` |

## Files

| Path | What's there |
| --- | --- |
| `src/App.jsx` | Desktop state, windows and music logic |
| `src/components/` | Desktop windows, mobile views, taskbar and boot screen |
| `src/hooks/` | Discord presence and screen-mode hooks |
| `src/utils/audio.js` | Audio helpers |
| `src/styles/base.css` | Design tokens, fonts and shared styles (each component imports its own `.css`) |
| `public/fonts/` | Self-hosted Departure Mono and Silkscreen (OFL) |
| `assets/` | Music, cover art and ambient audio |
| `public/wallpapers/`, `public/icons.svg` | Wallpapers and the pixel icon sprite ([pixelarticons](https://github.com/halfmage/pixelarticons), MIT) |
| `public/Dump/` | Gallery images; run `npm run thumbs` (needs ImageMagick) after adding some to create their WebP thumbnails |

## Customization

Start with the home/about components, then update the assets and presence configuration. Vercel Analytics and Speed Insights are integrated in the source; review those integrations when adapting the project. Check rights separately before reusing music, artwork or other media.
