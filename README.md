# Atelier Astil — website redesign

An interactive, scroll-driven redesign of [atelierastil.com](https://atelierastil.com), inspired by the
cinematic, work-first feel of preymaker.com but built around the studio's own identity:
Bengaluru-based architecture & interiors, editorial typography, bronze/bone palette.

## What's in it

- **Hero** — a 360° panorama render you hold and drag to look around, with handwritten notes that
  blur in and out on elements in the room. No splash screen: the render shows straight away, with a
  hairline loading bar at the top while it loads. The name is set in light Cormorant Garamond.
- **Selected work** — scrolling moves through six projects floating in a dark 3D space.
  **Open project** turns the scroll horizontal: cover → statement & facts → gallery → materials → next.
- **Studio** — founder portrait, story and stats. **Disciplines**, **Press**, **Contact**.
- The journey is a loop: scrolling past Contact returns to the Hero, and scrolling up from the Hero
  lands in Contact.

Project content lives in `src/projects.js`; images in `public/img/`.

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
