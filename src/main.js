import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { World } from './world/World.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* World                                                               */
/* ------------------------------------------------------------------ */
const world = new World($('#world'));
if (import.meta.env.DEV) window.__world = world;
world.setSections({
  hero: $('#hero'), descent: $('#descent'), work: $('#work'), about: $('#about'), contact: $('#contact'),
});

/* ------------------------------------------------------------------ */
/* Smooth scroll                                                       */
/* ------------------------------------------------------------------ */
const lenis = new Lenis({ duration: 1.35, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
lenis.stop();
if (import.meta.env.DEV) {
  window.__lenis = lenis;
  // dev: jump to a scroll position and render settled frames (works while the tab is throttled)
  window.__snap = (y, frames = 3) => {
    lenis.scrollTo(y, { immediate: true, force: true });
    ScrollTrigger.update();
    const { pos, tilt } = world.cameraAt(y);
    world.camPos.copy(pos); world.tiltS = tilt; world.prevCamY = undefined; world.blurS = 0;
    for (let i = 0; i < frames; i++) world.update(y, 1 / 60);
    return y;
  };
}
lenis.on('scroll', ScrollTrigger.update);

let last = performance.now();
gsap.ticker.add(() => {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lenis.raf(now);
  world.update(lenis.scroll, dt);
  frameUI(dt);
});
gsap.ticker.lagSmoothing(0);

$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  closeMenu();
  const target = $(a.dataset.scroll);
  if (target) lenis.scrollTo(target, { duration: 2.4, offset: a.dataset.scroll === '#top' ? 0 : -10 });
}));

/* ------------------------------------------------------------------ */
/* Loader -> entry                                                     */
/* ------------------------------------------------------------------ */
/* Loading indicator for anything that loads after the intro (images) */
const busy = (() => {
  const el = $('#busy');
  const jobs = new Set();
  let t;
  const sync = () => {
    clearTimeout(t);
    if (jobs.size) { el.hidden = false; t = setTimeout(() => el.classList.add('is-on'), 120); }
    else { el.classList.remove('is-on'); t = setTimeout(() => { el.hidden = true; }, 400); }
  };
  return { start(k) { jobs.add(k); sync(); }, end(k) { jobs.delete(k); sync(); } };
})();

const bar = $('#loaderBar'), pct = $('#loaderPct');
const setProgress = (p) => { bar.style.transform = `scaleX(${p})`; pct.textContent = `${Math.round(p * 100)}%`; };

world.load(setProgress).then(() => {
  world.layout();
  setProgress(1);
  ScrollTrigger.refresh();
  world.computeKeys();
  setTimeout(enter, 450);
}).catch((e) => {
  console.error(e);
  pct.textContent = 'Error';
});

function enter() {
  $('#loader').classList.add('is-done');
  document.body.classList.remove('is-loading');
  window.scrollTo(0, 0);
  ScrollTrigger.refresh();
  world.computeKeys();
  lenis.resize();
  lenis.start();
  gsap.to(world, { intro: 1, duration: reduced ? 0.01 : 3.6, ease: 'power2.inOut' });
  introText();
}

/* ------------------------------------------------------------------ */
/* Type animation                                                      */
/* ------------------------------------------------------------------ */
function introText() {
  const tl = gsap.timeline({ delay: 0.9 });
  tl.from('.hero__title .w', {
    yPercent: 115, rotate: 3, duration: 1.6, ease: 'expo.out', stagger: 0.14,
    // once the words are in, let the glow breathe outside the reveal masks (no clipped box)
    onComplete: () => $('.hero__title').classList.add('is-revealed'),
  })
    .from('.hero .reveal-up', { y: 24, opacity: 0, filter: 'blur(8px)', duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0.35)
    .from(['.nav', '.secbar'], { y: -24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.2)
    .from('.grade-overlay', { opacity: 0, duration: 2 }, 0);
}

// section headings: per-line mask reveal
$$('.split').forEach((el) => {
  const st = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
  gsap.from(st.lines, {
    yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 82%' },
  });
});
$$('.sec:not(.hero) .reveal-up, .kicker, .filters, .viewall').forEach((el) => {
  gsap.from(el, { y: 26, opacity: 0, filter: 'blur(6px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
gsap.from('.card', {
  y: 80, opacity: 0, rotateX: 8, duration: 1.6, ease: 'expo.out', stagger: 0.12,
  scrollTrigger: { trigger: '.grid', start: 'top 85%' },
});

// hero copy drifts back into the world as you begin to fall
gsap.to('.hero__copy', {
  yPercent: -30, opacity: 0, filter: 'blur(10px)', ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 20%', scrub: true },
});
gsap.to(['.hero__scroll'], { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '30% top', scrub: true } });

// the one-beat transition: the line is drawn as a wireframe, then filled with light as you fall
{
  const stage = $('.descent__stage');
  const ticks = $$('.descent__ticks i');
  const clamp = (v) => Math.min(1, Math.max(0, v));
  ScrollTrigger.create({
    trigger: '#descent', start: 'top 85%', end: 'bottom 15%', scrub: true,
    onUpdate: (st) => {
      const p = st.progress;
      stage.style.setProperty('--in', clamp(p / 0.18).toFixed(3));
      stage.style.setProperty('--out', clamp((p - 0.78) / 0.2).toFixed(3));
      stage.style.setProperty('--f1', clamp((p - 0.16) / 0.3).toFixed(3));
      stage.style.setProperty('--f2', clamp((p - 0.4) / 0.3).toFixed(3));
      ticks.forEach((t, k) => t.classList.toggle('on', p > 0.12 + k * 0.075));
    },
  });
}

// nav states + the centred section bar
const secLinks = $$('.secbar a');
const secInd = $('.secbar__ind');
const secProg = $('#secProgress');
let secActive = null;
function setSec(link) {
  if (!link || link === secActive) return;
  secActive = link;
  secLinks.forEach((a) => a.classList.toggle('is-current', a === link));
  secInd.style.transform = `translateX(${link.offsetLeft}px)`;
  secInd.style.width = `${link.offsetWidth}px`;
}
function syncSecbar() {
  const y = lenis.scroll + innerHeight * 0.45;
  const pos = (sel) => { const el = $(sel); return el ? el.getBoundingClientRect().top + lenis.scroll : Infinity; };
  const order = [['hero', 0], ['work', pos('#work')], ['about', pos('#about')], ['services', pos('#about') + $('#about').offsetHeight * 0.55], ['contact', pos('#contact')]];
  let cur = 'hero';
  for (const [k, top] of order) if (y >= top) cur = k;
  const link = secLinks.find((a) => a.dataset.sec === cur && a.offsetParent) || secLinks.find((a) => a.dataset.sec === (cur === 'services' ? 'about' : cur));
  setSec(link);
  const max = document.documentElement.scrollHeight - innerHeight;
  secProg.style.transform = `scaleX(${max > 0 ? lenis.scroll / max : 0})`;
}
lenis.on('scroll', syncSecbar);
addEventListener('resize', () => { secActive = null; syncSecbar(); });
requestAnimationFrame(syncSecbar);

/* ------------------------------------------------------------------ */
/* Work: filters, tilt cards, case overlay                             */
/* ------------------------------------------------------------------ */
// public assets live under Vite's base path ("/portfolio3/" on GitHub Pages)
const C = `${import.meta.env.BASE_URL}assets/aurora/cards/`;
const GH = 'https://github.com/abdullah2036/';
const PROJECTS = {
  maher: {
    num: '01', type: 'Brand series · Web OS', title: 'Computerjy Maher OS', img: C + 'maher-os.webp',
    text: 'One mock tech-store brand, redesigned four times to push the front-end further each round: a cyberpunk terminal landing page, a first-person WebGL gaming room whose monitor is a portal into a 3D showroom, a single scroll-driven cinematic scene, and finally the studio as an operating system — a macOS-style desktop or an iOS-style phone, depending on the device you pick at the door.',
    facts: [['Role', 'Identity, art direction, front-end'], ['Stack', 'Three.js, WebGL, vanilla JS'], ['Format', 'Four versions of one brand'], ['Language', 'Arabic & English']],
    links: [['Live — OS edition', 'https://abdullah2036.github.io/computerjymaherOS/'], ['Live — 3D room', 'https://abdullah2036.github.io/computerjymaher3d/'], ['Code', GH + 'computerjymaherOS']],
  },
  leap: {
    num: '02', type: 'AI voice companion', title: 'LEAP ONE', img: C + 'leap.webp',
    text: 'A pocket AI guide for LEAP 2026 attendees in Riyadh. Hold the mic and ask where the Main Stage is or what is on right now; snap a sign or a badge and the photo goes to a vision model with your question. Answers are grounded in a hand-built knowledge base of the venue, and it is honest by design: it never invents booth numbers and points you to the official map instead.',
    facts: [['Role', 'Product, UI, engineering'], ['Stack', 'Web Speech API, vision LLM, web search'], ['Interface', 'Animated dot-matrix face'], ['Language', 'English & Arabic']],
    links: [['Live', 'https://abdullah2036.github.io/leap-one/leap-one.html'], ['Code', GH + 'leap-one']],
  },
  eloria: {
    num: '03', type: 'Full-stack publishing', title: 'Eloria Story', img: C + 'eloria.webp',
    text: 'A self-publishing home for an Arabic novelist. Version two moved from a JSON file in the repo to Postgres on Supabase: real author accounts, row-level security so only admins can write, covers in storage, chapters that go live instantly, and readers who subscribe in-page and get emailed when a new chapter lands.',
    facts: [['Role', 'Design & full-stack'], ['Stack', 'Supabase (Postgres, Auth, Storage), JS'], ['Security', 'Row-Level Security, no secrets in the client'], ['Language', 'Arabic, RTL']],
    links: [['Live', 'https://abdullah2036.github.io/eloriaprojectV2/'], ['Code', GH + 'eloriaprojectV2']],
  },
  pairing: {
    num: '04', type: 'Product UI', title: 'Pairing Board', img: C + 'pairing.webp',
    text: 'Built after watching chess players crowd around printed pairing sheets. Paste a chess-results link, type your name, and you get only what you need: a big “table tent” card with your board, colour, opponent and result. Order-agnostic name search, auto-refresh during live rounds, and shareable links that open straight to the event.',
    facts: [['Role', 'UX, UI, engineering'], ['Stack', 'JavaScript, Cloudflare Workers'], ['Detail', 'Keeps the last good pairings if a refresh fails'], ['Used at', 'Live tournaments']],
    links: [['Live demo', 'https://chessresults.pageui.workers.dev/#1434355'], ['Code', GH + 'chessUI']],
  },
  pixel: {
    num: '05', type: 'Playable world', title: 'Pixel Portfolio', img: C + 'pixel.webp',
    text: 'A developer portfolio as a small pixel-art world: a campsite in the woods at night. No page sections — you walk a character around and the portfolio is the things you find. A map carries the camera between places, number keys jump to About, Projects, Skills, Resume and Contact, and touch gets a D-pad or tap-to-walk.',
    facts: [['Role', 'Concept, pixel art direction, engineering'], ['Stack', 'TypeScript, canvas'], ['Controls', 'Keyboard, touch, map travel'], ['Mood', 'A quiet place to build big things']],
    links: [['Live', 'https://abdullah2036.github.io/pixelportfolio/'], ['Code', GH + 'pixelportfolio']],
  },
};

const chips = $$('.chip');
chips.forEach((c) => c.addEventListener('click', () => {
  chips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-selected', x === c); });
  const f = c.dataset.filter;
  $$('.card').forEach((card) => {
    const dim = f !== 'all' && !card.dataset.cat.split(' ').includes(f);
    gsap.to(card, { opacity: dim ? 0.2 : 1, filter: dim ? 'grayscale(1) blur(2px)' : 'grayscale(0) blur(0px)', scale: dim ? 0.97 : 1, duration: 0.8, ease: 'expo.out' });
  });
}));

$$('.card').forEach((card) => {
  const rx = gsap.quickTo(card, 'rotateX', { duration: 0.8, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotateY', { duration: 0.8, ease: 'power3.out' });
  const media = $('.card__media', card);
  const mx = gsap.quickTo(media, 'x', { duration: 1, ease: 'power3.out' });
  const my = gsap.quickTo(media, 'y', { duration: 1, ease: 'power3.out' });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    rx(-py * 9); ry(px * 11); mx(-px * 18); my(-py * 18);
    card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  });
  card.addEventListener('pointerenter', () => { world.setFocus(card.dataset.project); cursor.label('Open'); });
  card.addEventListener('pointerleave', () => { rx(0); ry(0); mx(0); my(0); world.setFocus(null); cursor.label(null); });
  card.addEventListener('click', () => openCase(card.dataset.project));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(card.dataset.project); } });
});

const caseEl = $('#case');
let lastFocus = null;
function openCase(id) {
  const p = PROJECTS[id];
  if (!p) return;
  lastFocus = document.activeElement;
  const img = $('#caseImg');
  if (!img.src.endsWith(p.img)) {
    busy.start('case');
    img.onload = img.onerror = () => busy.end('case');
    img.src = p.img;
  }
  img.alt = p.title;
  $('#caseNum').textContent = p.num; $('#caseType').textContent = p.type;
  $('#caseTitle').textContent = p.title; $('#caseText').textContent = p.text;
  const facts = $('#caseFacts');
  facts.replaceChildren(...p.facts.flatMap(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  }));
  $('#caseLinks').replaceChildren(...(p.links ?? []).map(([label, href]) => {
    const a = document.createElement('a');
    a.className = 'pill'; a.href = href; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = label + ' ↗';
    return a;
  }));
  caseEl.hidden = false;
  lenis.stop();
  gsap.fromTo('.case__scrim', { opacity: 0 }, { opacity: 1, duration: 0.6 });
  gsap.fromTo('.case__panel', { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'expo.out' });
  gsap.from('.case__body > *', { y: 20, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.15 });
  $('.case__close', caseEl).focus();
}
function closeCase() {
  gsap.to('.case__panel', { y: 40, opacity: 0, duration: 0.5, ease: 'power3.in' });
  gsap.to('.case__scrim', { opacity: 0, duration: 0.5, onComplete: () => { caseEl.hidden = true; lenis.start(); lastFocus?.focus(); } });
}
$$('[data-close]', caseEl).forEach((b) => b.addEventListener('click', closeCase));
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!caseEl.hidden) closeCase();
  closeMenu();
});

/* ------------------------------------------------------------------ */
/* About: counters + services                                          */
/* ------------------------------------------------------------------ */
$$('[data-count]').forEach((el) => {
  const o = { v: +(el.dataset.from ?? 0) };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: +el.dataset.count, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
  });
});
const services = $$('.services li');
const thumb = $('#servicesThumb');
let svcLock = 0;
function setService(i) {
  services.forEach((s, k) => s.classList.toggle('is-active', k === i));
  const li = services[i];
  thumb.style.transform = `translateY(${li.offsetTop - thumb.parentElement.offsetTop}px)`;
}
services.forEach((li, i) => {
  li.addEventListener('mouseenter', () => { svcLock = performance.now(); setService(i); });
  li.addEventListener('click', () => { svcLock = performance.now(); setService(i); });
});
ScrollTrigger.create({
  trigger: '#about', start: 'top 40%', end: 'bottom 60%',
  onUpdate: (s) => { if (performance.now() - svcLock > 2500) setService(Math.min(3, Math.floor(s.progress * 4))); },
});

/* ------------------------------------------------------------------ */
/* Cursor & world interaction                                         */
/* ------------------------------------------------------------------ */
const cursor = (() => {
  const el = $('#cursor'), lab = $('#cursorLabel');
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
  let labelled = null;
  return {
    move(px, py) { x(px); y(py); },
    hover(on) { el.classList.toggle('is-hover', on && !labelled); },
    label(txt) { labelled = txt; lab.textContent = txt ?? ''; el.classList.toggle('is-label', !!txt); if (txt) el.classList.remove('is-hover'); },
  };
})();

let glassHover = null;
addEventListener('pointermove', (e) => {
  cursor.move(e.clientX, e.clientY);
  const overUI = e.target.closest('a, button, .card, .services li, .chip');
  const g = overUI ? null : world.pointer(e.clientX, e.clientY);
  if (!overUI) world.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (g !== glassHover) {
    glassHover = g;
    cursor.label(g === 'soul' ? 'Explore' : g === 'hey' ? 'Say hi' : null);
    document.body.style.cursor = g ? 'pointer' : '';
  }
  cursor.hover(!!overUI && !overUI.classList.contains('card'));
}, { passive: true });
addEventListener('click', (e) => {
  if (e.target.closest('a, button, .card, .case, .credits, .services li')) return;
  if (glassHover === 'soul') lenis.scrollTo('#work', { duration: 3.2 });
  if (glassHover === 'hey') location.href = 'mailto:hello@soul.studio';
});


/* ------------------------------------------------------------------ */
/* Per-frame UI                                                        */
/* ------------------------------------------------------------------ */
const meter = $('#depthMeter'), meterBox = $('.descent__meter');
const depthLayers = [['.hero .eyebrow', 8], ['.hero__title', 16], ['.hero__foot', 10]].map(([sel, k]) => [$(sel), k]);
function frameUI(dt) {
  const mx = world.mouseS.x, my = world.mouseS.y;
  for (const [el, k] of depthLayers) if (el) el.style.translate = `${(-mx * k).toFixed(2)}px ${(my * k * 0.6).toFixed(2)}px`;
  const d = world.signals.descent;
  meter.textContent = String(Math.round((1 - d) * 300)).padStart(3, '0');
  meterBox.style.opacity = d > 0.02 && d < 0.98 ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* Menu, credits, resize                                               */
/* ------------------------------------------------------------------ */
const burger = $('#burger'), menu = $('#menu');
function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
burger.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
});

$('#year').textContent = new Date().getFullYear();

let rz;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (!world.plates || !innerWidth || !innerHeight) return;
    world.layout();
    ScrollTrigger.refresh();
    world.computeKeys();
  }, 150);
});
ScrollTrigger.addEventListener('refresh', () => world.plates && world.computeKeys());
