# Abdullah Bokhary — portfolio

**Simple on your side. Handled on mine.** · **بسيط من جهتك. والباقي عليّ.**

Every section exists twice: *your side* (for clients — blue-hour aurora, soft glass, round shapes) and
*my side* (for developers — night aurora, dark glass, square shapes). Both exist in Arabic and English, written separately rather than translated.

## Run

Static files, no build step:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Where things live

| File | What it holds |
|---|---|
| `assets/js/content.js` | **All copy** (EN/AR × your/my), project data, and `SITE_CONFIG` |
| `assets/js/aurora.js` | WebGL aurora sky + star layer, with automatic quality scaling |
| `assets/js/main.js` | Rendering, side/language switching, loader, GSAP motion, case studies |
| `assets/css/main.css` | Design system: tokens per side, per-language type, components |
| `assets/img/` | Project screenshots (WebP, 1440px) |

## Before publishing

- [ ] `SITE_CONFIG.whatsapp` in `content.js` — your number, digits only (e.g. `9665XXXXXXXX`).
      Until it is set, the idea box falls back to email.
- [ ] `SITE_CONFIG.email` — your real address.
- [ ] Read every claim in `content.js` once more; real client quotes would make it stronger.
- [ ] Check the Arabic spelling of your name (`عبدالله بخاري`).

## Notes

- Fonts: Geist for all Latin text, Geist Mono for code and tags only, and
  Thmanyah Sans for all Arabic ([font.thmanyah.com](https://font.thmanyah.com), free for commercial use).
- Libraries: GSAP 3.15 (ScrollTrigger, SplitText) and Lenis, pinned with SRI hashes.
- Section order: Work → Range → Certifications → About → Services → Process → Contact.
- Projects: Eloria Story (client), Pixel Portfolio, Pairing Board, LEAP ONE (personal).
- Deep links: `#case-eloria`, `#case-pixel`, `#case-chess`, `#case-leap`.
- Per section, the aurora re-forms and lifts away from text (`SKY` in `main.js`).
- Text that sits directly on the sky gets a soft halo and a local scrim (`--halo`, `--scrim` in `main.css`).
- `prefers-reduced-motion` is respected: no smooth scroll, no pinning, instant switches.
- Add `?qa` to the URL to force the cheapest aurora (used for automated screenshots).
