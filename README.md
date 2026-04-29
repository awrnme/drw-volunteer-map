# Dow RunWalk Interactive Volunteer Station Map

**Greater Midland — 2026**

An interactive, responsive web app that overlays numbered volunteer station markers on the Dow RunWalk race course map. Hover (desktop) or tap (mobile) a station to view setup instructions.

---

## Quick Start

1. **Unzip** this archive into a folder.

2. **Add your images:**
   - Place the race map image at:
     ```
     images/race-map.png
     ```
   - Place each station's instruction image in:
     ```
     images/stations/station-01.png
     images/stations/station-02.png
     ...
     images/stations/station-57.png
     ```
   - Note: Station 32.5 uses filename `station-32-5.png`

3. **Serve locally** (required for `fetch()` to work):
   ```bash
   # Option A: Python
   python3 -m http.server 8080

   # Option B: Node
   npx serve .

   # Option C: VS Code Live Server extension
   ```

4. **Open** `http://localhost:8080` in your browser.

---

## File Structure

```
dow-runwalk-volunteer-map/
├── index.html              ← Main page
├── css/
│   └── styles.css          ← All styles
├── js/
│   └── app.js              ← All interactivity
├── data/
│   └── stations.json       ← Station coordinates & metadata
├── images/
│   ├── race-map.png        ← Base map (2000×1545)
│   └── stations/           ← Instruction images per station
│       ├── station-01.png
│       ├── ...
│       └── station-57.png
└── README.md
```

---

## Customising Station Positions

All station coordinates are stored in `data/stations.json`. Each entry has:

| Field   | Description                                        |
|---------|----------------------------------------------------|
| `id`    | Station number (string, e.g. `"32.5"`)             |
| `name`  | Display name                                       |
| `xPct`  | X position as **percentage** of map width (0–100)  |
| `yPct`  | Y position as **percentage** of map height (0–100) |
| `image` | Filename of the instruction image                  |

To fine-tune positions, open the page in Chrome DevTools, inspect a marker, and adjust its `left` / `top` percentages live.

---

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Flexbox, no framework
- **Vanilla JavaScript (ES6+)** — No dependencies, < 15KB
- **Zero build step** — Just serve and go

---

## Accessibility (WCAG 2.1 AA)

- Markers are `<button>` elements with `aria-label`
- Keyboard navigable (Tab, Enter, Space, Escape)
- Focus management with visible focus rings
- Modal traps focus and restores on close
- All images have descriptive `alt` text
- Colour contrast ≥ 4.5:1

---

## Browser Support

Chrome, Edge, Safari, Firefox (latest 2 versions), iOS Safari, Android Chrome.

---

© 2026 Greater Midland. All rights reserved.
