/* ──────────────────────────────────────────────────────────────
   Abdullah Bokhary — portfolio runtime
   Rendering · side & language switching · loader · motion ·
   work filter · shuffle deck · case studies · interactions.
   Works (without motion) if the animation libraries fail to load.
   ────────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const C = window.CONTENT, CFG = window.SITE_CONFIG, PM = window.PROJECT_META;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  let lang = root.lang === "ar" ? "ar" : "en";
  let side = root.dataset.side === "my" ? "my" : "your";
  let filter = "all";
  let lenis = null, ctx = null, splits = [], caseId = null, lastFocus = null, booted = false, lastW = innerWidth;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    gsap.config({ nullTargetWarn: false });
  }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ─── helpers ─── */
  const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const t = p => get(C[lang], p);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const isAr = s => /[؀-ۿ]/.test(s);
  const icon = (n, c = "ic") => `<svg class="${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const tag = s => `<span class="tag${isAr(s) ? " ar" : ""}">${esc(s)}</span>`;
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const navOffset = () => -(parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 68) - 28;

  /* ─── busy pill: appears only when something is actually slow ─── */
  const Busy = (() => {
    const el = $("#busy"); let n = 0, timer = null;
    return {
      track(p, delay = 300) {
        n++; clearTimeout(timer);
        timer = setTimeout(() => { if (n > 0) el.classList.add("is-on"); }, delay);
        return Promise.resolve(p).catch(() => {}).finally(() => {
          n = Math.max(0, n - 1);
          if (!n) { clearTimeout(timer); el.classList.remove("is-on"); }
        });
      }
    };
  })();
  const imgReady = img => (!img || (img.complete && img.naturalWidth)) ? Promise.resolve() :
    new Promise(r => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });

  function ensureFonts(l) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const list = l === "ar"
      ? [['500 1em "Thmanyah Sans"', "عربي"], ['400 1em "Thmanyah Sans"', "عربي"], ['700 1em "Thmanyah Sans"', "عربي"], ['400 1em "Geist"', "a"]]
      : [['400 1em "Geist"', "a"], ['500 1em "Geist"', "a"], ['400 1em "Geist Mono"', "a"]];
    return Promise.all(list.map(([f, s]) => document.fonts.load(f, s))).catch(() => {});
  }

  /* ─── brand mark (inline so each side can fill its own shape) ─── */
  function inlineMarks() {
    $$("svg.mark").forEach(s => {
      s.setAttribute("viewBox", "0 0 48 16");
      s.innerHTML = '<circle class="mk-c" cx="8" cy="8" r="5.6"/><path class="mk-l" d="M13.6 8H32"/><rect class="mk-s" x="32" y="2.4" width="11.2" height="11.2" rx="1.4"/>';
    });
  }

  /* ─── ridges on the hero horizon ─── */
  function ridgePath(seed, base, amp, n) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * 1440;
      const peak = Math.pow(Math.abs(Math.sin(i * 1.7 + seed)), 1.4);
      pts.push([x, base - amp * (0.25 + 0.75 * peak) * (0.55 + 0.45 * rnd())]);
    }
    let d = `M0,360 L0,${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + " L1440,360 Z";
  }

  /* ════════════════════ RENDER ════════════════════ */
  function renderStatic(scope = document) {
    $$("[data-k]", scope).forEach(el => { const v = t(el.dataset.k); if (v != null && typeof v !== "object") el.textContent = v; });
    $$("[data-ka]", scope).forEach(el => el.dataset.ka.split(";").forEach(pair => {
      const i = pair.indexOf(":"); const v = t(pair.slice(i + 1)); if (v != null) el.setAttribute(pair.slice(0, i), v);
    }));
    if (scope === document) {
      document.title = t("meta.title");
      $('meta[name="description"]').setAttribute("content", t("meta.description"));
    }
  }

  function renderLists() {
    const L = C[lang];

    ["your", "my"].forEach(s => {
      $("#stats" + cap(s)).innerHTML = L.hero.stats[s].map(st =>
        `<li class="stat glass" data-spot><span class="stat-v"><bdi>${esc(st.v)}</bdi></span><span class="stat-l">${esc(st.l)}</span></li>`).join("");
      $("#id" + cap(s)).innerHTML = L.about.card[s].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd><bdi>${esc(v)}</bdi></dd></div>`).join("");
      $("#proc" + cap(s)).innerHTML = L.process[s].steps.map((st, i) =>
        `<li class="step"><span class="step-node">${lang === "ar" ? "٠١٢٣٤٥٦٧٨٩"[i + 1] : i + 1}</span><div class="step-card glass" data-spot><h3>${esc(st.t)}</h3><p>${esc(st.d)}</p></div></li>`).join("");
    });

    $("#expect").innerHTML = L.about.your.expect.map(e =>
      `<li class="glass" data-spot data-reveal><span class="ic-wrap">${icon(e.i)}</span><div><h4>${esc(e.t)}</h4><p>${esc(e.d)}</p></div></li>`).join("");
    $("#toolbox").innerHTML = L.about.my.toolbox.map(g =>
      `<div class="tool-group glass" data-spot data-reveal><h4>${esc(g.t)}</h4><div class="tags">${g.items.map(tag).join("")}</div></div>`).join("");

    // hero: a small stack of real work
    $("#heroShow").innerHTML = ["eloria", "pixel", "chess"].map((id, i) => {
      const p = L.projects.find(x => x.id === id), m = PM[id];
      return `<a class="show-card glass" href="#case-${id}" data-case="${id}" data-pos="${i}" aria-label="${esc(L.ui.openCase + ": " + p.name)}">
        <img src="assets/img/${m.hero}.webp" alt="${esc(L.alt[id])}" width="1440" height="900" decoding="async">
        <span class="show-label"><b>${esc(p.name)}</b><span>${esc(L.work.cat[m.cat])}</span></span>
      </a>`;
    }).join("");

    // work
    $("#workGrid").innerHTML = L.projects.map(p => {
      const m = PM[p.id];
      return `<article class="pcard" data-id="${p.id}" data-cat="${m.cat}" data-reveal>
        <a class="pcard-link glass" href="#case-${p.id}" data-spot data-case="${p.id}" aria-label="${esc(L.ui.openCase + ": " + p.name)}">
          <div class="pcard-media"><img src="assets/img/${m.hero}.webp" alt="${esc(L.alt[p.id])}" width="1440" height="900" loading="lazy" decoding="async" data-parallax><span class="pcard-cat">${esc(L.work.cat[m.cat])}</span></div>
          <div class="pcard-body">
            <div class="pcard-head"><h3 class="pcard-title">${esc(p.name)}</h3><span class="pcard-alt"><bdi>${esc(p.alt)}</bdi></span></div>
            <p class="pcard-for">${esc(p.for)}</p>
            <div class="swap">
              <p data-for="your" class="pcard-line">${esc(p.your.line)}</p>
              <div data-for="my"><p class="pcard-line">${esc(p.my.line)}</p><div class="tags">${m.tags.map(tag).join("")}</div></div>
            </div>
          </div>
        </a></article>`;
    }).join("");
    applyFilter(false);

    // range deck
    $("#deck").innerHTML = L.worlds.map((w, i) => {
      const m = window.WORLD_META[i];
      return `<article class="world glass" data-spot>
        <a class="world-media" href="${m.href}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="assets/img/${m.img}.webp" alt="" width="1440" height="900" loading="lazy" decoding="async"><span class="world-v">${w.v}</span></a>
        <div class="world-cap">
          <div class="swap">
            <div data-for="your"><h3>${esc(w.your[0])}</h3><p>${esc(w.your[1])}</p></div>
            <div data-for="my"><h3>${esc(w.my[0])}</h3><p>${esc(w.my[1])}</p></div>
          </div>
          <a class="world-go" href="${m.href}" target="_blank" rel="noopener" aria-label="Computerjy Maher ${w.v}">${icon("out")}</a>
        </div></article>`;
    }).join("");

    // certifications
    $("#certGrid").innerHTML = ["ecppt", "ibm"].map(id => {
      const c = L.certs.items[id], m = window.CERT_META[id];
      const verify = m.verify ? `<a class="btn btn-glass btn-sm" href="${m.verify}" target="_blank" rel="noopener">${esc(L.certs.verify)}${icon("out")}</a>` : "";
      return `<article class="cert glass" data-spot data-reveal>
        <button class="cert-media" type="button" data-cert="${m.img}" aria-label="${esc(L.certs.view + ": " + c.full)}">
          <img src="assets/img/${m.img}.webp" alt="" loading="lazy" decoding="async"><span class="cert-zoom">${icon("zoom")}</span>
        </button>
        <div class="cert-body">
          <p class="cert-issuer">${esc(c.issuer)} · ${esc(c.date)}</p>
          <h3 class="cert-name">${esc(c.name)}</h3>
          <p class="cert-full">${esc(c.full)}</p>
          <div class="swap">
            <p data-for="your" class="cert-line">${esc(c.your)}</p>
            <div data-for="my" class="tags">${c.tags.map(tag).join("")}</div>
          </div>
          <div class="cert-foot"><span class="cert-id">${esc(L.certs.id)} <bdi>${esc(m.id)}</bdi></span>${verify}</div>
        </div></article>`;
    }).join("");

    // services / stack
    $("#svcGrid").innerHTML = L.services.your.items.map(s =>
      `<article class="svc glass" data-spot data-reveal><span class="ic-wrap">${icon(s.i)}</span><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p><p class="svc-ref">${esc(L.services.your.like)} <b>${esc(s.ref)}</b></p></article>`).join("");
    $("#stackGrid").innerHTML = L.services.my.groups.map(g =>
      `<article class="svc glass" data-spot data-reveal><span class="ic-wrap">${icon(g.i)}</span><h3>${esc(g.t)}</h3><div class="tags">${g.items.map(tag).join("")}</div></article>`).join("");

    $("#lnGithub").href = CFG.github;
    $("#lnLinkedin").href = CFG.linkedin;
    $("#lnEmail").href = "mailto:" + CFG.email;
  }

  function renderAll() {
    renderStatic();
    renderLists();
    trackLazyImages();
    if (caseId) renderCase(caseId);
  }

  /* Slow network? Show the busy pill while a visible image is still loading. */
  let imgIO = null;
  function trackLazyImages() {
    if (!("IntersectionObserver" in window)) return;
    imgIO && imgIO.disconnect();
    imgIO = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      imgIO.unobserve(e.target);
      if (!(e.target.complete && e.target.naturalWidth)) Busy.track(imgReady(e.target), 700);
    }));
    $$("main img").forEach(img => imgIO.observe(img));
  }

  /* ════════════════════ WORK FILTER ════════════════════ */
  function layoutCards() {
    // alternate wide / narrow per row; a lone last card spans the row
    const vis = $$(".pcard").filter(c => !c.hidden);
    vis.forEach((c, i) => {
      const row = Math.floor(i / 2), first = i % 2 === 0;
      const alone = first && i === vis.length - 1;
      c.classList.remove("is-wide", "is-narrow", "is-full");
      c.classList.add(alone ? "is-full" : (row % 2 === 0) === first ? "is-wide" : "is-narrow");
    });
  }
  function applyFilter(animate = true) {
    const seg = $("#workFilter");
    const idx = ["all", "client", "personal"].indexOf(filter);
    seg.style.setProperty("--i", idx);
    $$("[data-filter]", seg).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    const cards = $$(".pcard");
    const show = () => {
      cards.forEach(c => (c.hidden = !(filter === "all" || c.dataset.cat === filter)));
      layoutCards();
      if (hasGSAP) {
        ScrollTrigger.refresh();
        if (animate && !reduce) gsap.fromTo(cards.filter(c => !c.hidden), { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out", stagger: 0.07, clearProps: "transform" });
      }
    };
    if (!animate || !hasGSAP || reduce) return show();
    gsap.to(cards.filter(c => !c.hidden), { opacity: 0, y: 16, duration: 0.28, ease: "power2.in", stagger: 0.03, onComplete: show });
  }

  /* ════════════════════ SHUFFLE DECK ════════════════════ */
  // The four cards wait as a hidden stack; as the deck comes into view they
  // appear, riffle once and are dealt to their places.
  let deckTl = null;
  const deckCards = () => $$("#deck .world");
  function hideDeck() {
    if (!hasGSAP || reduce) return;
    deckTl && deckTl.kill();
    gsap.set(deckCards(), { opacity: 0 });
  }
  function shuffleDeck() {
    const cards = deckCards();
    if (!hasGSAP || reduce || !cards.length) return;
    deckTl && deckTl.kill();
    gsap.set(cards, { clearProps: "transform" });
    const deck = $("#deck").getBoundingClientRect();
    const cx = deck.left + deck.width / 2, cy = deck.top + Math.min(deck.height, 520) / 2;
    const off = cards.map(c => { const r = c.getBoundingClientRect(); return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) }; });
    const rot = [-6, 4, -2, 7];
    deckTl = gsap.timeline({ defaults: { ease: "power3.inOut" } })
      .set(cards, { x: i => off[i].x, y: i => off[i].y + 60, rotation: i => rot[i], scale: 0.6, opacity: 0, zIndex: i => 10 + i })
      .to(cards, { y: i => off[i].y, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.05 })
      .to(cards, { x: i => off[i].x + (i % 2 ? 1 : -1) * 130, rotation: i => rot[i] * -1.3, duration: 0.28, stagger: 0.04 })
      .add(() => cards.forEach((c, i) => gsap.set(c, { zIndex: 10 + ((i + 2) % cards.length) })))
      .to(cards, { x: i => off[i].x, rotation: i => rot[(i + 1) % rot.length], duration: 0.28, stagger: 0.04 })
      .to(cards, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.85, ease: "expo.out", stagger: 0.08 })
      .set(cards, { clearProps: "zIndex,transform" });
  }

  /* ════════════════════ SIDE ════════════════════ */
  function applySide(s) {
    side = s;
    root.dataset.side = s;
    store.set("ab.side", s);
    $$("[data-side-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sideBtn === s)));
    $('meta[name="theme-color"]').setAttribute("content", s === "my" ? "#0B1026" : "#C9D2E6");
  }

  let switching = false;
  async function setSide(s, origin) {
    if (s === side || switching) return;
    switching = true;
    const target = s === "my" ? 1 : 0;
    const x = origin ? origin.x : innerWidth / 2, y = origin ? origin.y : innerHeight / 2;
    if (document.startViewTransition && !reduce) {
      root.classList.add("vt-side", "vt-active");
      const vt = document.startViewTransition(() => { applySide(s); window.Aurora.state.mode = target; });
      try {
        await vt.ready;
        const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 1100, easing: "cubic-bezier(.77,0,.18,1)", pseudoElement: "::view-transition-new(root)" });
        await vt.finished;
      } catch (e) {}
      root.classList.remove("vt-side", "vt-active");
    } else {
      applySide(s);
      if (hasGSAP) gsap.to(window.Aurora.state, { mode: target, duration: reduce ? 0 : 1.3, ease: "power2.inOut" });
      else window.Aurora.state.mode = target;
    }
    switching = false;
    moveNavInd();
  }

  /* ════════════════════ LANGUAGE ════════════════════ */
  async function setLang(l) {
    if (l === lang || switching) return;
    switching = true;
    await Busy.track(ensureFonts(l), 250);
    const run = () => {
      teardownMotion();
      lang = l;
      store.set("ab.lang", l);
      root.lang = l;
      root.dir = l === "ar" ? "rtl" : "ltr";
      renderAll();
      $$("[data-lang-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.langBtn === l)));
    };
    if (document.startViewTransition && !reduce) {
      root.classList.add("vt-lang", "vt-active");
      const vt = document.startViewTransition(run);
      try { await vt.finished; } catch (e) {}
      root.classList.remove("vt-lang", "vt-active");
    } else run();
    setupMotion({ instant: true });
    switching = false;
  }

  /* ════════════════════ MOTION ════════════════════ */
  // The aurora takes a new shape in every section and moves out of the reading area.
  const SKY = {
    top:      { lift: 0,    amp: 1,    shift: 0,    dim: 1 },
    work:     { lift: 0.36, amp: 0.7,  shift: 1.6,  dim: 0.55 },
    range:    { lift: 0.24, amp: 1.5,  shift: 3.1,  dim: 0.6 },
    certs:    { lift: 0.4,  amp: 0.55, shift: 4.4,  dim: 0.5 },
    about:    { lift: 0.3,  amp: 1.1,  shift: 5.9,  dim: 0.55 },
    services: { lift: 0.38, amp: 0.8,  shift: 7.2,  dim: 0.5 },
    process:  { lift: 0.32, amp: 1.3,  shift: 8.6,  dim: 0.55 },
    contact:  { lift: 0.08, amp: 1,    shift: 10.1, dim: 0.85 }
  };
  function skyTo(key) {
    const p = SKY[key]; if (!p) return;
    if (hasGSAP && !reduce) gsap.to(window.Aurora.state, { ...p, duration: 2.2, ease: "power2.inOut", overwrite: "auto" });
    else Object.assign(window.Aurora.state, p);
  }

  function setupMotion(opts = {}) {
    if (!hasGSAP) return;
    const seen = el => opts.instant && el.getBoundingClientRect().top < innerHeight * 0.95;
    ctx = gsap.context(() => {
      // headings: lines rise into place (no clipping masks, so nothing gets cropped)
      if (window.SplitText) {
        $$("[data-split]").forEach(el => {
          const split = SplitText.create(el, { type: "lines", linesClass: "sl" });
          splits.push(split);
          if (reduce || seen(el)) return;
          gsap.from(split.lines, { y: 26, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
      }

      if (!reduce) {
        const els = $$("[data-reveal]").filter(el => !seen(el));
        gsap.set(els, { opacity: 0, y: 36 });
        ScrollTrigger.batch(els, {
          start: "top 90%", once: true,
          onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.05, ease: "expo.out", stagger: 0.08, overwrite: true })
        });

        $$("[data-parallax]").forEach(img => gsap.fromTo(img, { yPercent: -4 }, {
          yPercent: 4, ease: "none", scrollTrigger: { trigger: img.closest(".pcard"), start: "top bottom", end: "bottom top", scrub: true }
        }));

        gsap.to("#ridgeBack", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to("#ridgeFront", { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        if (innerWidth >= 900 && $(".hero").offsetHeight <= innerHeight * 1.2)
          gsap.to(".hero-inner", { y: -60, opacity: 0.3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".scroll-cue", { opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "20% top", scrub: true } });

        // one brief, four designs: dealt as soon as the deck starts to come into view
        if (!seen($("#deck"))) {
          hideDeck();
          ScrollTrigger.create({
            trigger: "#deck", start: "top 96%",
            onEnter: () => shuffleDeck(),
            onLeaveBack: () => hideDeck()
          });
        }
      }

      // process: the line connects the steps as you scroll
      const vertical = innerWidth <= 900;
      const rope = $("#rope");
      ScrollTrigger.create({
        trigger: "#proc", start: "top 72%", end: vertical ? "bottom 55%" : "bottom 70%", scrub: reduce ? false : 0.6,
        onUpdate: self => {
          const p = reduce ? 1 : self.progress;
          rope.style.transform = vertical ? `scaleY(${p})` : `scaleX(${p})`;
          $$(".proc-steps").forEach(list => [...list.children].forEach((li, i, all) =>
            li.classList.toggle("is-lit", p >= (all.length === 1 ? 0 : i / (all.length - 1)) - 0.02)));
        }
      });

      // nav highlight + a new sky formation per section
      const map = { top: null, work: "work", range: "work", certs: "certs", about: "about", services: "about", process: null, contact: "contact" };
      $$("[data-section]").forEach(s => ScrollTrigger.create({
        trigger: s, start: "top 55%", end: "bottom 55%",
        onToggle: self => { if (self.isActive) { setActiveNav(map[s.dataset.section]); skyTo(s.dataset.section); } }
      }));
    });
    ScrollTrigger.refresh();
  }

  function teardownMotion() {
    if (!hasGSAP) return;
    deckTl && deckTl.kill();
    ctx && ctx.revert(); ctx = null;
    splits.forEach(s => { try { s.revert(); } catch (e) {} }); splits = [];
  }

  function intro() {
    if (!hasGSAP || reduce) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(".nav-bar", { y: -30, opacity: 0, duration: 1.1 }, 0.05)
      .from(".ht-line", { y: 40, opacity: 0, duration: 1.3, stagger: 0.12 }, 0.1)
      .from("[data-intro]", { y: 30, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.45)
      .from(".ridges", { yPercent: 30, opacity: 0, duration: 2 }, 0.1)
      .from(".scroll-cue", { opacity: 0, y: 10, duration: 1 }, 1.1);
  }

  /* ─── nav indicator ─── */
  let activeNav = null;
  function setActiveNav(key) { activeNav = key; moveNavInd(); }
  function moveNavInd() {
    const ind = $(".nav-ind"), links = $(".nav-links");
    $$(".nav-links a").forEach(a => a.classList.toggle("is-active", a.dataset.nav === activeNav));
    const a = activeNav && $(`.nav-links a[data-nav="${activeNav}"]`);
    if (!a || !links.offsetParent) { ind.style.opacity = 0; return; }
    const r = a.getBoundingClientRect(), lr = links.getBoundingClientRect();
    ind.style.opacity = 1;
    ind.style.left = (r.left - lr.left) + "px";
    ind.style.width = r.width + "px";
  }

  /* ════════════════════ CASE STUDIES ════════════════════ */
  function galleryHTML(list) {
    if (!list.length) return "";
    const mob = list.filter(g => g.includes("mobile")), desk = list.filter(g => !g.includes("mobile"));
    const fig = (g, cls) => `<figure class="${cls} skeleton"><img src="assets/img/${g}.webp" alt="" loading="lazy" decoding="async"></figure>`;
    let html = "";
    if (desk.length && mob.length) {
      html += fig(desk[0], "g-wide") + fig(mob[0], "g-tall");
      desk.slice(1).forEach(g => (html += fig(g, "g-full")));
    } else if (mob.length) {
      html += `<figure class="g-full g-phone skeleton"><img src="assets/img/${mob[0]}.webp" alt="" loading="lazy"></figure>`;
    } else desk.forEach((g, i) => (html += fig(g, desk.length === 1 ? "g-full" : "g-half")));
    return `<div class="case-sec"><h3>${esc(t("work.labels.gallery"))}</h3><div class="case-gallery">${html}</div></div>`;
  }

  function renderCase(id) {
    const L = C[lang], lb = L.work.labels;
    const i = L.projects.findIndex(p => p.id === id);
    const p = L.projects[i], m = PM[id], next = L.projects[(i + 1) % L.projects.length];
    const list = arr => `<ul class="case-list">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const flow = p.my.diagram.map((n, k) =>
      `${k ? '<span class="arrow" aria-hidden="true"></span>' : ""}<div class="node ${n[0] === "p" ? "person" : "machine"}"><span class="t">${esc(n[1])}</span><span class="s">${esc(n[2])}</span></div>`).join("");
    const links = [
      m.live ? `<a class="btn btn-primary btn-sm" href="${m.live}" target="_blank" rel="noopener"><span>${esc(lb.live)}</span>${icon("out")}</a>` : "",
      m.repo ? `<a class="btn btn-glass btn-sm" href="${m.repo}" target="_blank" rel="noopener">${icon("github")}<span>${esc(lb.source)}</span></a>` : ""
    ].join("");

    $("#caseContent").innerHTML = `
      <div class="case-hero skeleton"><img src="assets/img/${m.hero}.webp" alt="${esc(L.alt[id])}" decoding="async"></div>
      <header class="case-head">
        <div>
          <p class="case-cat">${esc(L.work.cat[m.cat])} · <bdi>${esc(p.alt)}</bdi></p>
          <h2 class="case-title" id="caseTitle">${esc(p.name)}</h2>
          <p class="case-for">${esc(p.for)}</p>
        </div>
        <div class="case-links">${links}</div>
      </header>
      <div class="swap">
        <div data-for="your">
          <p class="case-line">${esc(p.your.line)}</p>
          <div class="case-grid">
            <div class="case-block glass" data-spot><h3>${esc(lb.needed)}</h3><p>${esc(p.your.needed)}</p></div>
            <div class="case-block glass" data-spot><h3>${esc(lb.got)}</h3><p>${esc(p.your.got)}</p></div>
          </div>
        </div>
        <div data-for="my">
          <p class="case-line">${esc(p.my.line)}</p>
          <div class="case-grid">
            <div class="case-block glass" data-spot><h3>${esc(lb.constraints)}</h3>${list(p.my.constraints)}<h3 class="mt">${esc(lb.stack)}</h3><div class="tags">${m.tags.map(tag).join("")}</div></div>
            <div class="case-block glass" data-spot><h3>${esc(lb.decisions)}</h3>${list(p.my.decisions)}</div>
          </div>
          <div class="case-sec"><h3>${esc(lb.architecture)}</h3>
            <div class="diagram glass"><p class="legend" aria-hidden="true"><span class="lp">${esc(L.ui.person)}</span><span class="lm">${esc(L.ui.machine)}</span></p>
              <div class="flow">${flow}</div></div>
          </div>
        </div>
      </div>
      ${galleryHTML(m.gallery)}
      <a class="case-next glass" href="#case-${next.id}" data-case-next="${next.id}" data-spot>
        <div><span class="lbl">${esc(lb.next)}</span><span class="nm">${esc(next.name)}</span></div>
        <span class="icon-btn" aria-hidden="true">${icon("arrow", "ic flip")}</span>
      </a>`;
    renderStatic($("#case"));

    const imgs = $$("#caseContent img");
    imgs.forEach(img => imgReady(img).then(() => img.closest(".skeleton")?.classList.remove("skeleton")));
    Busy.track(imgReady(imgs[0]), 350);
  }

  const caseEl = $("#case"), panel = $("#casePanel");
  function openCase(id, from, push = true) {
    if (!PM[id]) return;
    const already = !!caseId;
    lastFocus = already ? lastFocus : document.activeElement;
    caseId = id;
    renderCase(id);
    if (push) history.pushState({ case: id }, "", "#case-" + id);
    if (already) {
      panel.scrollTo({ top: 0 });
      if (hasGSAP && !reduce) gsap.from("#caseContent > *", { y: 36, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 });
      return;
    }
    caseEl.hidden = false;
    lenis && lenis.stop();
    root.classList.add("case-open");
    panel.scrollTop = 0;
    const r = from && from.getBoundingClientRect();
    if (hasGSAP && !reduce) {
      const clip = r ? `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 32px)` : "inset(50% 50% 50% 50% round 32px)";
      gsap.fromTo(panel, { clipPath: clip }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.95, ease: "expo.inOut", clearProps: "clipPath" });
      gsap.fromTo(".case-scrim", { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.from("#caseContent > *, .case-top", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.42 });
    }
    setTimeout(() => $(".case-top [data-close]").focus({ preventScroll: true }), 60);
  }

  function closeCase(fromPop = false) {
    if (!caseId) return;
    if (!fromPop && history.state && history.state.case) { history.back(); return; }
    const card = $(`.pcard[data-id="${caseId}"] .pcard-link`);
    const done = () => {
      caseEl.hidden = true;
      lenis && lenis.start();
      root.classList.remove("case-open");
      caseId = null;
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    };
    if (hasGSAP && !reduce) {
      const r = card && card.getBoundingClientRect();
      const onScreen = r && r.bottom > 0 && r.top < innerHeight && r.width > 0;
      gsap.to(".case-scrim", { opacity: 0, duration: 0.5 });
      gsap.to(panel, {
        clipPath: onScreen ? `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 32px)` : "inset(50% 50% 50% 50% round 32px)",
        duration: 0.8, ease: "expo.inOut", onComplete: () => { gsap.set(panel, { clearProps: "clipPath" }); done(); }
      });
    } else done();
  }

  addEventListener("popstate", () => {
    const m = location.hash.match(/^#case-(\w+)/);
    if (m) openCase(m[1], null, false); else closeCase(true);
  });

  caseEl.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); closeCase(); return; }
    if (e.key !== "Tab") return;
    const f = $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', panel).filter(el => el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ─── certificate lightbox ─── */
  const lb = $("#lightbox");
  function openLightbox(img, alt) {
    $("#lbImg").src = `assets/img/${img}.webp`;
    $("#lbImg").alt = alt || "";
    lenis && lenis.stop();
    lb.showModal();
    if (hasGSAP && !reduce) gsap.fromTo("#lbImg", { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out" });
  }
  lb.addEventListener("close", () => lenis && !caseId && lenis.start());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  $("#lbClose").addEventListener("click", () => lb.close());

  /* ════════════════════ INTERACTIONS ════════════════════ */
  function bindInteractions() {
    document.addEventListener("click", e => {
      const sb = e.target.closest("[data-side-btn]");
      if (sb) { setSide(sb.dataset.sideBtn, { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 }); return; }
      const lbn = e.target.closest("[data-lang-btn]");
      if (lbn) { setLang(lbn.dataset.langBtn); return; }
      const fb = e.target.closest("[data-filter]");
      if (fb) { if (fb.dataset.filter !== filter) { filter = fb.dataset.filter; applyFilter(true); } return; }
      const cb = e.target.closest("[data-cert]");
      if (cb) { openLightbox(cb.dataset.cert, cb.getAttribute("aria-label")); return; }
      if (e.target.closest("#shuffleBtn")) { shuffleDeck(); return; }
      if (e.target.closest("[data-close]")) { closeCase(); return; }
      const nx = e.target.closest("[data-case-next]");
      if (nx) { e.preventDefault(); history.replaceState({ case: nx.dataset.caseNext }, "", "#case-" + nx.dataset.caseNext); openCase(nx.dataset.caseNext, null, false); return; }
      const cs = e.target.closest("[data-case]");
      if (cs) { e.preventDefault(); openCase(cs.dataset.case, cs); return; }
      const a = e.target.closest('a[href^="#"]');
      if (a && !a.closest(".case")) {
        const id = a.getAttribute("href");
        const target = id === "#top" ? 0 : $(id);
        if (target === null) return;
        e.preventDefault();
        closeMenu();
        if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : navOffset(), duration: 1.4 });
        else (target === 0 ? scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }) : target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
      }
    });


    // idea → WhatsApp (or email until a number is configured)
    const mail = v => `mailto:${CFG.email}?subject=${encodeURIComponent(lang === "ar" ? "فكرة موقع" : "Website idea")}&body=${encodeURIComponent(v)}`;
    $("#ideaForm").addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#idea").value.trim(), help = $("#ideaHelp");
      if (!v) { help.textContent = t("contact.your.empty"); help.classList.add("is-error"); $("#idea").focus(); return; }
      help.classList.remove("is-error"); help.textContent = t("contact.your.help");
      window.open(CFG.whatsapp ? `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(v)}` : mail(v), "_blank", "noopener");
    });
    $("#ideaEmail").addEventListener("click", e => { e.preventDefault(); location.href = mail($("#idea").value.trim()); });
    $("#idea").addEventListener("input", () => {
      const help = $("#ideaHelp");
      if (help.classList.contains("is-error")) { help.classList.remove("is-error"); help.textContent = t("contact.your.help"); }
    });

    // mobile menu
    $("#menuBtn").addEventListener("click", () => ($("#menu").hidden ? openMenu() : closeMenu()));
    $("#menu").addEventListener("click", e => { if (e.target.id === "menu") closeMenu(); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !$("#menu").hidden) { closeMenu(); $("#menuBtn").focus(); } });

    // spotlight on glass + sky parallax
    document.addEventListener("pointermove", e => {
      const el = e.target.closest && e.target.closest("[data-spot]");
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      }
      const A = window.Aurora.state;
      A.mx = (e.clientX / innerWidth - 0.5) * 2;
      A.my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    // ripple on press
    document.addEventListener("pointerdown", e => {
      const b = e.target.closest(".btn, .spec-publish, .seg button");
      if (!b || reduce) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.4;
      const sp = document.createElement("span");
      sp.className = "ripple";
      sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      b.appendChild(sp);
      setTimeout(() => sp.remove(), 750);
    });

    if (!fine || reduce || !hasGSAP) return;

    // magnetic buttons
    document.addEventListener("pointermove", e => {
      const m = e.target.closest && e.target.closest("[data-magnetic]");
      $$("[data-magnetic].is-mag").forEach(el => { if (el !== m) { el.classList.remove("is-mag"); gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,.45)" }); } });
      if (!m) return;
      const r = m.getBoundingClientRect();
      m.classList.add("is-mag");
      gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.5, ease: "power3.out" });
    }, { passive: true });

    // project cards: gentle tilt + contextual cursor label
    const label = $("#cursorLabel");
    const lx = gsap.quickTo(label, "x", { duration: 0.45, ease: "power3.out" });
    const ly = gsap.quickTo(label, "y", { duration: 0.45, ease: "power3.out" });
    document.addEventListener("pointermove", e => {
      const card = e.target.closest && e.target.closest(".pcard-link");
      lx(e.clientX); ly(e.clientY);
      if (!card) { label.classList.remove("is-on"); gsap.to(label, { scale: 0.6, duration: 0.3 }); return; }
      label.classList.add("is-on");
      gsap.to(label, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: px * 4, rotateX: -py * 4, transformPerspective: 1400, duration: 0.7, ease: "power3.out" });
    }, { passive: true });
    document.addEventListener("pointerout", e => {
      const card = e.target.closest && e.target.closest(".pcard-link");
      if (card && !card.contains(e.relatedTarget)) gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1,.5)" });
    });

    const show = $("#heroShow");
    $(".hero").addEventListener("pointermove", e => {
      const px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
      gsap.to(show, { rotateY: px * 8, rotateX: -py * 6, duration: 1.2, ease: "power3.out", transformPerspective: 1400 });
    });
  }

  function openMenu() {
    const m = $("#menu");
    m.hidden = false;
    $("#menuBtn").setAttribute("aria-expanded", "true");
    lenis && lenis.stop();
    if (hasGSAP && !reduce) {
      gsap.fromTo(".menu-sheet", { y: -24, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" });
      gsap.from(".menu-links a", { y: 16, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.04, delay: 0.08 });
    }
    setTimeout(() => $(".menu-links a").focus({ preventScroll: true }), 50);
  }
  function closeMenu() {
    const m = $("#menu");
    if (m.hidden) return;
    $("#menuBtn").setAttribute("aria-expanded", "false");
    lenis && lenis.start();
    if (hasGSAP && !reduce) gsap.to(".menu-sheet", { y: -16, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => (m.hidden = true) });
    else m.hidden = true;
  }

  /* ─── hero stack: the front card moves to the back every few seconds ─── */
  function cycleShow() {
    if (reduce) return;
    const box = $("#heroShow");
    let paused = false;
    box.addEventListener("pointerenter", () => (paused = true));
    box.addEventListener("pointerleave", () => (paused = false));
    setInterval(() => {
      if (paused || document.hidden || caseId) return;
      $$(".show-card", box).forEach(c => (c.dataset.pos = (+c.dataset.pos + 2) % 3));
    }, 4200);
  }

  /* ─── dock ─── */
  function bindScroll() {
    const dock = $("#dock");
    let lastY = scrollY, idle = null;
    addEventListener("scroll", () => {
      const y = scrollY;
      if (y > lastY + 6) dock.classList.add("is-away");
      else if (y < lastY - 6) dock.classList.remove("is-away");
      lastY = y;
      clearTimeout(idle);
      idle = setTimeout(() => dock.classList.remove("is-away"), 900);
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => dock.classList.toggle("is-on", !e.isIntersecting && !caseId), { rootMargin: "-40px 0px 0px 0px" })
        .observe($("#heroSwitch"));
    }
    addEventListener("resize", () => {
      clearTimeout(bindScroll._t);
      bindScroll._t = setTimeout(() => {
        moveNavInd();
        if (Math.abs(innerWidth - lastW) < 2) return;
        lastW = innerWidth;
        teardownMotion(); setupMotion({ instant: true });
      }, 250);
    });
  }

  /* ════════════════════ LOADER ════════════════════ */
  function runLoader() {
    const bar = $("#loaderBar"), count = $("#loaderCount");
    const start = performance.now(), minT = reduce ? 250 : 1200, maxT = 8000;
    const preload = src => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; });
    const jobs = [
      window.Aurora.ready, ensureFonts(lang), document.fonts ? document.fonts.ready : null,
      preload("assets/img/eloria-home.webp"), preload("assets/img/pixel-campsite.webp")
    ];
    let done = 0;
    jobs.forEach(p => Promise.resolve(p).catch(() => {}).finally(() => done++));
    if (hasGSAP && !reduce) {
      gsap.to(".loader-mark *", { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: 0.16 });
      gsap.from(".loader-names > *, .loader-bar, .loader-meta", { y: 14, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.15 });
    } else $$(".loader-mark *").forEach(el => (el.style.strokeDashoffset = 0));
    let shown = 0, prev = start;
    return new Promise(resolve => {
      const tick = () => {
        const now = performance.now(), el = now - start, dt = Math.min(0.1, (now - prev) / 1000);
        prev = now;
        let target = Math.min(done / jobs.length, el / minT);
        if (el > maxT) target = 1;
        shown += (target - shown) * (1 - Math.exp(-dt * 7));
        if (target >= 1 && shown > 0.994) shown = 1;
        bar.style.transform = `scaleX(${shown})`;
        count.textContent = String(Math.round(shown * 100)).padStart(3, "0");
        shown >= 1 ? resolve() : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function exitLoader() {
    const L = $("#loader"), target = side === "my" ? 1 : 0;
    const finish = () => { root.classList.remove("is-loading"); L.remove(); };
    if (!hasGSAP || reduce) { window.Aurora.state.mode = target; finish(); return Promise.resolve(); }
    return new Promise(res => {
      gsap.timeline({ onComplete: () => { finish(); res(); } })
        .to(".lm-c", { fill: "#2AD6A0", stroke: "#2AD6A0", duration: 0.3 })
        .to(".lm-l", { stroke: "#00D4E7", duration: 0.3 }, "<.06")
        .to(".lm-s", { fill: "#C6A4FF", stroke: "#C6A4FF", duration: 0.3 }, "<.06")
        .to(".loader-inner", { y: -24, opacity: 0, filter: "blur(10px)", duration: 0.55, ease: "power2.in" }, "+=.12")
        .add(() => gsap.to(window.Aurora.state, { mode: target, duration: 2.4, ease: "power2.inOut" }), "-=.25")
        .to(L, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.05, ease: "expo.inOut" }, "<")
        .add(() => { root.classList.remove("is-loading"); intro(); }, "<.3");
    });
  }

  /* ════════════════════ BOOT ════════════════════ */
  async function boot() {
    inlineMarks();
    $("#ridgeBack").setAttribute("d", ridgePath(3, 250, 170, 16));
    $("#ridgeFront").setAttribute("d", ridgePath(11, 330, 130, 10));
    applySide(side);
    $$("[data-lang-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.langBtn === lang)));
    renderAll();

    window.Aurora.state.mode = 1;               // the loader is night; dawn breaks as it lifts
    window.Aurora.setReducedMotion(reduce);
    window.Aurora.init($("#aurora"), $("#stars"));
    Object.assign(window.Aurora.state, SKY.top);

    if (hasGSAP && window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
    scrollTo(0, 0);
    bindInteractions();
    bindScroll();
    cycleShow();

    await runLoader();
    setupMotion();
    if (!location.hash) { scrollTo(0, 0); lenis && lenis.scrollTo(0, { immediate: true, force: true }); }
    await exitLoader();
    lenis && lenis.start();
    booted = true;
    if (hasGSAP) {
      ScrollTrigger.refresh();
      let ft = null;
      document.fonts && document.fonts.addEventListener("loadingdone", () => { clearTimeout(ft); ft = setTimeout(() => ScrollTrigger.refresh(), 150); });
      addEventListener("load", () => ScrollTrigger.refresh());
    }

    const h = location.hash;
    const m = h.match(/^#case-(\w+)/);
    if (m && PM[m[1]]) { history.replaceState({ case: m[1] }, "", h); openCase(m[1], null, false); }
    else if (h && h.length > 1 && $(h)) {
      setTimeout(() => lenis ? lenis.scrollTo($(h), { offset: navOffset(), duration: 1.6 }) : $(h).scrollIntoView(), 300);
    }
    const warm = () => ensureFonts(lang === "ar" ? "en" : "ar");
    if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);
  }

  // small handle for debugging from the console
  window.__site = { setSide, setLang, openCase, closeCase, shuffleDeck, get lenis() { return lenis; }, get ready() { return booted; } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
