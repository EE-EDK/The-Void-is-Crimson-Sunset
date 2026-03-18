# CLAUDE.md

## Project Overview

"The Void at Crimson Sunset" — an interactive cosmic horror web experience with a three-act narrative structure. Pure static site, no build tools.

## Project Structure

```
index.html                          # Title/landing page with vortex effect
The-Fifth-Harmonic-ACT1.html        # Act I
The-First-Weave-ACTII.html          # Act II
The-New-Rebirth-ACTIII.html         # Act III
final-video.html                    # Conclusion video page
assets/
  css/
    shared-styles.css               # Core styles, CSS custom properties
    act1-custom.css                 # Red theme overrides
    act2-custom.css                 # Red→blue transition theme
    act3-custom.css                 # Blue theme overrides
  js/
    visuals-engine.js               # WebGL shader engine (Three.js r160)
    horror-effects.js               # Audio synthesis, visual horror triggers
  video/
    Horror-Finale.mp4
docs/                               # Implementation status, guides, audits
```

## Tech Stack

- **HTML5/CSS3/Vanilla JS** — no frameworks, no bundler, no npm
- **Three.js r160** — loaded from CDN (cdnjs.cloudflare.com) with fallback
- **Web Audio API** — custom synthesis for horror audio (no pre-recorded files)
- **Google Fonts** — Cormorant Garamond (300/400/700)

## Development

No build step. Edit files directly and test in browser.

- **Deployment**: GitHub Pages from `main` branch
- **Live URL**: https://ee-edk.github.io/The-Void-at-Crimson-Sunset/
- No test framework — manual browser testing

## Key Architecture

- **visuals-engine.js**: Full-screen fragment shader on a Three.js plane. Renders vortex/black hole (main page only), starfield, nebula, and fluid effects. Key uniforms: `u_time`, `u_tension`, `u_scroll`, `u_themeColor`, `u_isMainPage`. IIFE pattern.
- **horror-effects.js**: Audio synthesis (dissonant chords, binaural beating, metal scrapes) and visual effects (chromatic aberration, screen breathing, film grain). Triggered via CSS classes and data attributes (`data-horror="scramble"`, `data-whisper="..."`).
- **CSS**: Custom properties in `:root` for theming. Act-specific overrides in separate files. Glassmorphism, fluid typography with `clamp()`.

## Coding Standards

- Maintain the horror/dark aesthetic in all visual updates
- Vanilla CSS only — no frameworks
- Three.js r160 for all 3D/WebGL effects
- IIFE pattern for JS scope isolation, `'use strict'`
- Verify asset paths after any structural changes
- Pixel ratio capped at 1.5x for WebGL performance
- Adaptive particle counts (1000 mobile, 2000 desktop)
