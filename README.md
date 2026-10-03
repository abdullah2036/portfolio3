# Abdullah Bokhary — aurora portfolio

**Live:** https://abdullah2036.github.io/portfolio3/

A scroll-driven WebGL world: you start on a small lakeshore under the northern lights, dive through the
aurora reflected in the water, fall through curtains of light, and land among the peaks, the forest and a fjord.

## Run

```bash
npm install
npm run dev       # http://127.0.0.1:5174/portfolio3/
npm run build     # static site in dist/
```

Vite's `base` is `/portfolio3/` (see `vite.config.js`) so the site works from the GitHub Pages subpath.
Public assets referenced from JavaScript use `import.meta.env.BASE_URL`; HTML and CSS references are rewritten by Vite.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## The world

| Scene | Section | What moves |
|---|---|---|
| Lakeshore + ABDULLAH glass | Hero | Aurora curtains drift and shimmer (sky mask), rays race along the bands, stars twinkle, the lake mirrors it; the glass rises out of the water with a moving waterline, ripples and reflection; pine silhouettes frame the shore |
| Vertical aurora curtains | Transition | “Design first, then build it.” fills from wireframe to light; volumetric light veils you fly through, rising light motes, motion blur |
| Aurora rays over snow peaks | Work | Real projects in glass cards with case studies; hovering a project makes the sky flare |
| Violet curtains over a pine forest | About | Services panel, counters |
| Teal sky over a fjord + Hey. glass | Contact | Glass standing in the water |

Plates live in `public/assets/aurora/plates` with packed data maps (`*_data.png`: R = depth, G = water, B = sky),
made offline with Depth Anything V2 + Mask2Former. Phones get a lighter render path (lower resolution, fewer
parallax steps, no bloom or motion blur, fewer particles).

## Edit content

- Copy, sections, project cards: `index.html`
- Case-study text, facts and links: `PROJECTS` in `src/main.js`
- Scene grades, glass placement, veils: `PLATES` and `placeElements()` in `src/world/World.js`
- Brand colours and type: tokens in `src/style.css`; fonts are self-hosted in `public/assets/fonts`

## Credits

Landscape photography from [Unsplash](https://unsplash.com) (Unsplash License — attribution not required), listed in
`public/assets/aurora/credits.json`. Fonts: Clash Display and Satoshi (Fontshare, ITF Free Font License),
JetBrains Mono (OFL). Project images are from Abdullah's own repositories.
