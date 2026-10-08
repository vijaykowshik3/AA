# Atelier Astil — website redesign

An interactive, scroll-driven redesign of [atelierastil.com](https://atelierastil.com), inspired by the
cinematic, work-first feel of preymaker.com but built around the studio's own identity:
Bengaluru-based architecture & interiors, editorial typography, bronze/bone palette.

## What's in it

- **Preloader** — serif wordmark rises, counter runs to 100, curtain lifts into the hero.
- **Hero** — custom WebGL "liquid stone" shader (raw WebGL, no library): domain-warped noise lights
  the hero image, reacts to the pointer and deepens/fades as you scroll.
- **Smooth scroll** — Lenis wired into GSAP's ticker; ScrollTrigger drives every reveal.
- **Manifesto** — word-by-word opacity scrubbed by scroll position.
- **Selected work** — pinned horizontal gallery on desktop (progress bar, per-card parallax,
  hover zoom, "View" cursor label); falls back to a vertical stack on mobile.
- **Featured project** — full-bleed parallax image with line reveals.
- **Disciplines** — list rows that fill on hover with a floating image that follows the cursor.
- **Studio** — sticky portrait, counters that count up on entry.
- **Press** — velocity-aware marquee + article grid.
- **Contact / footer** — oversized CTA, giant wordmark that rises in.
- **Project overlay** — lightweight detail view (deep-linkable via `#project-<id>`), prev/next.
- **Fullscreen menu**, **custom cursor**, **magnetic buttons**, live Bengaluru clock.
- Honors `prefers-reduced-motion`; cursor/magnetic effects are disabled on touch devices.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview
```

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3, or a plain web server).

## Swapping in real assets

All imagery is **generated placeholder art** (see `scripts/gen-placeholders.py`) at low resolution for
testing. To go live, replace the files in `public/img/` keeping the same names:

| File | Used for |
|------|----------|
| `hero.jpg` | WebGL hero (any striking interior/material shot works; 2000px+ wide) |
| `pregame.jpg` | Pregame — work card, featured section, menu image, overlay |
| `lucifers-lair.jpg` | Lucifer's Lair |
| `knossos.jpg` | Knossos residence, Dubai |
| `school-lobby.jpg` | Primary school lobby |
| `tech-park.jpg` | Tech park / workplace |
| `residence.jpg` | Ultra-luxury residence |
| `studio.jpg` | Studio / founder portrait |

Project copy and facts live in `src/projects.js`; section copy is in `index.html`.

## Things to confirm before launch

Copy was drafted from published coverage (ArchDaily, ELLE Decor India, Interior Design,
BW Businessworld, LinkedIn) because the live site was not reachable from the build environment.
Please verify:

- Contact email (`projects@atelierastil.com`), studio hours, and social links.
- Stats in the Studio section: *30+ projects*, *3 continents*, *10k sq ft*.
- "Est. Bengaluru" / "2019 — 2026" date range in the hero.
- Project names, locations and areas (Knossos 2,300 m², Pregame 10,000 sq ft).
- The press links in the Press grid are `#` placeholders — point them at the real articles.

## Stack

Vite · GSAP 3 + ScrollTrigger · Lenis · raw WebGL · Google Fonts (Instrument Serif, Inter Tight)
