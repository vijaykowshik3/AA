# Atelier Astil — website redesign

An interactive, scroll-driven redesign of [atelierastil.com](https://atelierastil.com), inspired by the
cinematic, work-first feel of preymaker.com but built around the studio's own identity:
Bengaluru-based architecture & interiors, editorial typography, bronze/bone palette.

## What's in it

The whole site is **one continuous journey**: a Three.js world (floating stone slabs, dust, a warm light
at the far end) that the camera travels through as you scroll. Every section is a layer whose state is a
pure function of scroll position, so scrolling up plays everything in reverse.

- **Preloader** — serif wordmark rises, counter runs to 100, curtain lifts into the world.
- **Hero** — the wordmark scales and blurs away as you dive in.
- **Philosophy** — words light up one by one with scroll.
- **Selected work** — scrolling moves through six projects; the active project's image floats in 3D
  ahead of the camera while neighbours wait at the sides. Counter, project list and "Open project".
- **Project view** — opens in place and turns the scroll **horizontal** (wheel, drag, touch, arrow keys):
  cover → statement & facts → gallery images with parallax → material palette → next project.
- **Studio**, **Disciplines** (hover image follows the cursor), **Press** (velocity-aware marquee),
  **Contact** (email, hours, studio, social, careers).
- Journey rail on the right (click to jump), fullscreen menu, custom cursor, magnetic buttons,
  live Bengaluru clock, deep links (`#project-<id>`), `prefers-reduced-motion` support.

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
| `hero.jpg` | Texture on the floating slabs in the 3D world |
| `pregame.jpg` | Pregame — work carousel plane, project view cover |
| `lucifers-lair.jpg` | Lucifer's Lair |
| `knossos.jpg` | Knossos residence, Dubai |
| `school-lobby.jpg` | Primary school lobby |
| `tech-park.jpg` | Tech park / workplace |
| `residence.jpg` | Ultra-luxury residence |
| `studio.jpg` | Studio / founder portrait |

Project copy, facts, gallery captions and material lists live in `src/projects.js`; section copy is in `index.html`.
Gallery images currently reuse the six placeholders; add real per-project galleries there.

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

Vite · Three.js · GSAP 3 · Lenis · Google Fonts (Instrument Serif, Inter Tight)
