# MY CORNER — Portfolio Website

A retro-themed personal portfolio website with a nostalgic Windows 95 aesthetic.

## Project Structure

```
Portfolio/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # All styling
├── js/
│   └── script.js        # All JavaScript functionality
├── README.md            # This file
└── mycorner.html        # Original single-file version (deprecated)
```

## Files Description

### `index.html`
The main entry point of the website. Contains:
- HTML structure and layout
- All interactive elements (windows, taskbar, start menu)
- Links to external CSS and JavaScript files
- Semantic HTML organization

### `css/styles.css`
Complete styling including:
- CSS variables for theming (colors, spacing)
- Retro CRT scanlines effect
- Window management and positioning
- Animations and transitions
- Responsive utilities

### `js/script.js`
All JavaScript functionality:
- Window management (drag, focus, minimize/maximize)
- Taskbar and start menu interactions
- Music player functionality
- Terminal emulator
- Clock and notification system

## Features

- **Retro Aesthetic**: Windows 95-inspired UI with cyan/blue color scheme
- **Interactive Windows**: Draggable, focusable, and closable window elements
- **Music Player**: Interactive playlist with playback controls
- **Terminal Emulator**: Simple command-line interface with built-in commands
- **Blog Section**: Personal blog entries display
- **Links Directory**: Curated collection of external links
- **CRT Scanlines**: Visual effect overlay for authentic retro feel

## How to Use

1. Open `index.html` in a web browser
2. Click on desktop icons or START menu to open windows
3. Drag windows around by their title bars
4. Use terminal with commands: `help`, `about`, `ls`, `date`, `clear`, `echo [text]`
5. Explore the music player, blog entries, and links

## Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
  --bg: #080810;
  --accent: #6666ff;
  /* ... more colors */
}
```

### Content
Update content directly in `index.html` within each window's div.

### Functionality
Modify or extend functionality in `js/script.js`.

## Browser Compatibility

Works in all modern browsers that support:
- CSS Grid and Flexbox
- CSS Variables (Custom Properties)
- ES6 JavaScript
- Google Fonts

## Notes

- This is a static website (no backend required)
- All functionality is client-side JavaScript
- Responsive to window resizing (though designed for desktop viewing)
- The retro aesthetic is intentional and core to the design

---

**Version**: 0.1.0  
**Last Updated**: 2025
