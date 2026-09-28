# Aurora Portfolio

The `reference.png` mood board, built as a working site. React + TypeScript + Vite, GSAP/ScrollTrigger for the scroll choreography, and a small raw-WebGL layer for the moving light.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build
```

## Design system (extracted from the board)

| | |
|---|---|
| Palette | `#0B1026` `#0D3B8F` `#1E6FFF` `#00D4E7` `#2AD6A0` `#A7F2B2` `#C6A4FF` `#E9F8FF` (tokens in `src/styles/global.css`) |
| Type | Space Grotesk 300 for display, Inter for body, uppercase micro-labels tracked at 0.32em |
| Grid | 12 columns. Page margin 4.4vw (the board's 45/1024), gap about 1.4vw (14/1024) |
| Surfaces | Hairline borders `rgba(180,220,255,.26–.62)`, a catch-light on top edges, radii 26/20/14px |
| Motion | One house ease, `aurora` (long deceleration, no overshoot). Only transform, opacity and clip-path are animated |

## Layout

- **Hero**: full-bleed, with no frame or border. The plate's lower edge fades into the page and runs on beneath the About section. On scroll the plate drifts back (parallax), the type lifts off and fades, and the scene flows straight into About. There's no pin.
- **Other sections** are one-viewport scenes. Each frame is inset by the same margin on all four sides:
  - `--page-x` is the side margin (4.4vw, the board's 45/1024)
  - `--gy = min(--page-x, 7svh)` is the top/bottom inset
  - `--frame-h = 100svh - 2 × --gy` is the frame height

  Nav links land exactly on a scene's composed position (`data-stop`).

## Scrolling and transitions

- **Scrolling is native.** Wheel, trackpad and touch behave exactly as the device intends, and the page never moves on its own.
- Motion is attached to scroll with a short scrub lag (0.7s), so transitions stay smooth even with notched wheels.
- **One scene transition** (`src/lib/frames.ts`) is shared by About, every card, the gallery board, Philosophy, Journal and Contact. On entry each `[data-frame]` opens from an inset rounded mask while rising, and its `[data-frame-media]` image settles from 1.14 to 1. On exit the scene's `.scene-content` recedes (scale 0.93, dims).
- The intro, the living aurora shader, hovers, cursor drift and parallax are unchanged. Every parallax is symmetric, so a scene at its composed position shows everything exactly where the layout puts it.

## Content and languages

All copy is in **[src/content/copy.ts](src/content/copy.ts)**, written separately in English and Arabic rather than translated. Projects, the Maher series and the certificates are in **[src/content/projects.ts](src/content/projects.ts)**, with an `en` and an `ar` block each.

- Wrap words in `*asterisks*` to set them in the accent face: Instrument Serif italic in English, Aref Ruqaa in Arabic.
- The language switch (EN ⇄ ع) flips `lang` and `dir` on `<html>`. The whole layout uses logical properties, so Arabic mirrors to right-to-left, and the hero, portrait and planet images mirror with it. The choice is remembered, and `?lang=ar` forces it.
- Fonts: Bricolage Grotesque (display), Instrument Serif (accent), Instrument Sans (text), JetBrains Mono (labels). In Arabic: Alexandria, Aref Ruqaa and IBM Plex Sans Arabic.
- The résumé lives at `public/resume/Abdullah_Bokhary_Resume.pdf`. Replace the file to update it.

## Images

Run `npm run assets` to rebuild `public/media`. It reads the aurora art from `../images` and the project screenshots and certificates from `tools/sources/`. The mapping is at the top of `tools/import_images.py`.

## Structure

```
src/
  content/     site copy, projects, image registry
  sections/    Hero, SelectedWork, Series, About, Certifications, Philosophy, Contact
  components/  Navigation, SectionLabel, RevealText, CTA (PillCTA / ArrowCircle), AuroraMedia,
               AnimatedImage, ProjectCard, Footer
  gl/          auroraPlate.ts (living hero plate), ribbon.ts (light ribbon), util.ts
  lib/         motion.ts (GSAP setup, useGsap, intro state), transition.tsx (route transitions)
  pages/       Home, ProjectPage
```

## Deploying

This is a single-page app, so the host must rewrite unknown paths to `/index.html` for `/work/:slug` to work. `vercel.json` and `public/_redirects` (Netlify) already do this.
