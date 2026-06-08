# Assets Directory

This folder is reserved for static assets:

- **images/**: PNG, JPG, SVG files
- **fonts/**: Web fonts (if not using Google Fonts)
- **audio/**: Audio files for the music player
- **videos/**: Video files (if needed)

## Current Setup

Currently, fonts are loaded from Google Fonts CDN in `index.html`:
- VT323
- Share Tech Mono
- Silkscreen

To use local fonts, download them and place in a `fonts/` subfolder, then update the `@font-face` rules in `css/styles.css`.
