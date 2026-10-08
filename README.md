# Atelier Astil — website redesign

An interactive, scroll-driven redesign of [atelierastil.com](https://atelierastil.com), inspired by the
cinematic, work-first feel of preymaker.com but built around the studio's own identity:
Bengaluru-based architecture & interiors, editorial typography, bronze/bone palette.

## What's in it

The site is **one continuous world** built from five ideas, all procedural (no 3D files needed):

- **Living Monolith** — a sculpted clay mass stays centred for the whole site and transforms with
  scroll: carved niches open, it twists, splits for the studio, and dissolves into dust at the end.
- **Excavation** — the camera descends a shaft of strata; background colour and fog shift with depth.
- **Unbuilt City** — monolithic volumes along the shaft that carve openings as you pass.
- **Section Cut** — every volume (and the monolith itself) is drawn first as gold section lines,
  then fills with material as you approach.
- **Clay** — the cursor presses a dent into the monolith and reveals finished stone beneath.

The journey is a **ring**: scrolling past Contact arrives back at the Hero, scrolling up from the
Hero lands in Contact. Scroll length is three identical cycles; the page silently keeps you in the
middle one. Everything on screen is a function of progress mod 1, so the seam is invisible.

Sections (all layers over the world, driven purely by scroll position, reversible):
Hero → Philosophy → Selected work (3D render chambers, six projects) → Studio → Disciplines → Press → Contact.

**Project view** opens in place and turns the scroll horizontal (wheel, drag, touch, arrow keys):
cover → statement & facts → gallery images with parallax → material palette → next project.

Also: journey rail (right edge), fullscreen menu, custom cursor, magnetic buttons, live Bengaluru
clock, deep links (`#project-<id>`), `prefers-reduced-motion` support, reduced detail on phones.

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
