import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Plate } from './Plate.js';
import { Cutout, Mist, Fireflies, Spray, AuroraVeil } from './Layers.js';
import { Glass } from './Glass.js';
import { NOISE } from './glsl.js';

const D = 10;          // rest distance camera -> plate
const FOV = 35;
const L_BG = 0, L_GLASS = 1, L_FG = 2;
const A = `${import.meta.env.BASE_URL}assets/aurora/`;   // respects Vite's base (GitHub Pages subpath)

/* Scene plates — top to bottom. A lakeshore, a fall through the aurora, peaks, a forest, a fjord. */
const GRADE = (o) => ({ gamma: 1.08, sat: 0.92, contrast: 1.08, shadow: [0.34, 0.62, 0.86], high: [0.8, 0.98, 1.0], lift: [0.002, 0.006, 0.012], fog: [0.01, 0.035, 0.05], fogAmt: 0.25, ...o });
export const PLATES = [
  {
    key: 'hero', aspect: 3840 / 2131, z: 0, marginW: 1.32, minH: 1.34, minHPortrait: 2.0, focusX: 0.6,
    relief: 2.2, focus: 0.5, waterGlow: 0.5, aurora: 1,
    flow: { dir: [0, 1], speed: 0.18, len: 0.006, warp: 0.0016 },
    feather: [0, 0.12, 0, 0],
    grade: GRADE({ exposure: 0.62, gamma: 1.12, fogAmt: 0.18 }),
  },
  {
    key: 'fall', aspect: 3198 / 4779, z: -3.5, marginW: 1.36, minH: 1.0, overlap: 0.5,
    relief: 1.2, focus: 0.5, waterGlow: 0, aurora: 1.25, soft: 0.9,
    feather: [0.16, 0.14, 0, 0],
    grade: GRADE({ exposure: 0.6, gamma: 1.06, sat: 0.95, contrast: 1.0 }),
  },
  {
    key: 'peaks', aspect: 3840 / 2560, z: -7, marginW: 1.32, minH: 1.32, overlap: 0.55,
    relief: 2.2, focus: 0.5, waterGlow: 0, aurora: 1,
    feather: [0.2, 0.18, 0, 0],
    grade: GRADE({ exposure: 0.58, gamma: 1.14 }),
  },
  {
    key: 'forest', aspect: 3840 / 2563, z: -11, marginW: 1.32, minH: 1.32, overlap: 0.28, focusX: 0.45,
    relief: 2.2, focus: 0.5, waterGlow: 0, aurora: 1,
    feather: [0.22, 0.2, 0, 0],
    grade: GRADE({ exposure: 0.72, gamma: 1.08, sat: 0.95 }),
  },
  {
    key: 'contact', aspect: 3840 / 2559, z: -15, marginW: 1.5, minH: 1.5, overlap: 0.28, focusX: 0.55,
    relief: 2.2, focus: 0.5, waterGlow: 0.4, aurora: 0.9,
    flow: { dir: [0, 1], speed: 0.18, len: 0.006, warp: 0.0016 },
    feather: [0.24, 0, 0, 0],
    grade: GRADE({ exposure: 0.42, gamma: 1.2, sat: 0.85, contrast: 1.04 }),
  },
];

/* --------------------------- render passes --------------------------- */
class WorldPass extends Pass {
  constructor(world) {
    super();
    this.world = world;
    this.needsSwap = false;
    this.copy = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { t: { value: null } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }',
      depthTest: false, depthWrite: false,
    }));
  }
  render(renderer, writeBuffer, readBuffer) {
    const { scene, camera, rtBG } = this.world;
    const prevAuto = renderer.autoClear;
    renderer.setClearColor(0x03080e, 1);
    camera.layers.set(L_BG);
    renderer.setRenderTarget(rtBG);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(readBuffer);
    renderer.clear();
    this.copy.material.uniforms.t.value = rtBG.texture;
    this.copy.render(renderer);
    renderer.autoClear = false;
    camera.layers.set(L_GLASS);
    renderer.render(scene, camera);
    camera.layers.set(L_FG);
    renderer.render(scene, camera);
    renderer.autoClear = prevAuto;
  }
}

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 1 }, uAberr: { value: 1 }, uBlur: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime, uFade, uVignette, uAberr, uBlur; uniform vec2 uRes;
    varying vec2 vUv;
    ${NOISE}
    void main() {
      vec2 c = vUv - .5;
      float r2 = dot(c, c);
      vec2 dir = c * r2 * .012 * uAberr;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - dir).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv + dir).b;
      if (uBlur > .0005) {
        vec3 acc = col; float wsum = 1.;
        for (int i = 1; i <= 8; i++) {
          float k = float(i) / 8.;
          float wgt = 1. - k * .6;
          acc += texture2D(tDiffuse, vUv + vec2(0., uBlur * k)).rgb * wgt;
          acc += texture2D(tDiffuse, vUv - vec2(0., uBlur * k)).rgb * wgt;
          wsum += 2. * wgt;
        }
        col = acc / wsum;
      }
      float vig = smoothstep(.95, .18, r2 * 1.6 * uVignette);
      col *= mix(.38, 1., vig);
      col += vec3(.004, .010, .018) * (1. - vig);
      float g = hash12(vUv * uRes + fract(uTime * 7.3) * 100.) - .5;
      col += g * .018 * (1. - smoothstep(0., .5, luma(col)));
      gl_FragColor = vec4(col * uFade, 1.);
    }`,
};

/* ------------------------------- world ------------------------------- */
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.isMobile = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // phones: fewer pixels, the same picture
    this.maxDpr = this.isMobile ? 1.25 : 2;
    this.dpr = Math.min(devicePixelRatio || 1, this.maxDpr);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 200);
    this.camera.position.set(0, 0, D);

    this.time = 0;
    this.intro = 0;
    this.mouse = new THREE.Vector2();
    this.mouseS = new THREE.Vector2();
    this.camTarget = new THREE.Vector3(0, 0, D);
    this.camPos = new THREE.Vector3(0, 0, D);
    this.tilt = 0; this.tiltS = 0;
    this.keys = [];
    this.focus = null;
    this.signals = { descent: 0, scene: 'hero', weights: { hero: 1, fall: 0, peaks: 0, forest: 0, contact: 0 } };
    this.glasses = [];
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(L_GLASS);
    this.hovered = null;
    this.perf = { acc: 0, n: 0, t: 0 };
  }

  /* ------------------------------ loading ------------------------------ */
  async load(onProgress) {
    const mgr = new THREE.LoadingManager();
    mgr.onProgress = (_, loaded, total) => onProgress?.(loaded / total);
    const tl = new THREE.TextureLoader(mgr);
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    const sfx = this.isMobile || innerWidth * this.dpr < 1600 ? '_m' : '';
    const tex = (url, srgb = true) => new Promise((res, rej) => tl.load(url, (t) => {
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = aniso;
      res(t);
    }, undefined, rej));

    const jobs = {};
    for (const p of PLATES) {
      // the hero is framed tightly on phones, so it always gets the full-resolution plate
      jobs[p.key] = tex(`${A}plates/${p.key}${p.key === 'hero' ? '' : sfx}.webp`);
      jobs[p.key + '_data'] = tex(`${A}plates/${p.key}_data${sfx}.png`, false);
    }
    for (const k of ['pines_l', 'pines_r', 'branch3', 'smoke', 'fog']) {
      jobs[k] = tex(`${A}cut/${k}.webp`, !['smoke', 'fog'].includes(k));
    }
    const keys = Object.keys(jobs);
    const vals = await Promise.all(keys.map((k) => jobs[k]));
    this.tex = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
    // the glass etches its type into a canvas: make sure the display face is ready first
    await Promise.all([document.fonts.load('400 64px "Clash Display"'), document.fonts.load('600 64px "Clash Display"')]).catch(() => {});
    await document.fonts.ready;
    this.build();
    // pre-upload textures to avoid hitching on first sight
    for (const t of Object.values(this.tex)) this.renderer.initTexture(t);
  }

  /* ------------------------------ building ----------------------------- */
  build() {
    const T = this.tex;
    this.plates = {};
    for (const cfg of PLATES) {
      const p = new Plate({ ...cfg, steps: this.isMobile ? 3 : 6 }, T[cfg.key], T[cfg.key + '_data']);
      const img = T[cfg.key + '_data'].image;
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      p.depthImg = { w: img.width, h: img.height, px: cx.getImageData(0, 0, img.width, img.height).data };
      p.mesh.layers.set(L_BG);
      this.scene.add(p.mesh);
      this.plates[cfg.key] = p;
    }

    // ---- glass ----
    this.glassSoul = new Glass('soul', 1, 1.78, 0.14, { glow: 0.5, tone: 0.86, tintA: 0x7ff5e6, tintB: 0xb9a2ff, radius: 0.13, clear: true });
    this.glassHey = new Glass('hey', 1.12, 1, 0.12, { glow: 0.25, tone: 0.72, tintA: 0x8ff6ea, tintB: 0xc6b2ff, radius: 0.2 });
    for (const g of [this.glassSoul, this.glassHey]) {
      g.mesh.layers.set(L_GLASS);
      this.scene.add(g.mesh);
      this.glasses.push(g);
    }
    this.plates.hero.uniforms.uRefl.value = this.glassSoul.reflection;
    this.plates.hero.uniforms.uReflAmt.value = 0.55;
    this.plates.contact.uniforms.uRefl.value = this.glassHey.reflection;
    this.plates.contact.uniforms.uReflAmt.value = 0.4;

    // ---- the woods around the shore: pine silhouettes + out-of-focus branches ----
    const cut = (k, o, layer = L_BG) => {
      const c = new Cutout(T[k], o);
      c.mesh.layers.set(layer);
      this.scene.add(c.mesh);
      return c;
    };
    // clean night silhouettes: the photo's grain is crushed out, only a faint aurora rim remains
    const pine = { exposure: 0.16, sat: 0.35, tint: [0.55, 0.85, 0.95], rim: 0x6ff2df, rimAmt: 0.22, bend: 2.2, blur: 0.6 };
    this.flora = {
      pinesL: cut('pines_l', { ...pine, amp: 0.012, freq: 0.5, order: 30, lightDir: [1, 0.3] }, L_FG),
      pinesR: cut('pines_r', { ...pine, amp: 0.012, freq: 0.45, order: 31, lightDir: [-1, 0.3] }, L_FG),
      forestBranch: cut('branch3', { amp: 0.04, freq: 0.6, exposure: 0.16, sat: 0.4, tint: [0.6, 0.85, 0.95], rim: 0xb9a2ff, rimAmt: 0.3, blur: 2.2, order: 84, lightDir: [1, 0.2], edgeFade: 0.22 }, L_FG),
    };

    // ---- mists ----
    const mist = (k, o, layer = L_BG) => {
      const m = new Mist(T[k], o);
      m.mesh.layers.set(layer);
      this.scene.add(m.mesh);
      return m;
    };
    this.mists = {
      heroLake: mist('fog', { opacity: 0.12, speed: 0.004, color: 0x9fe9df, order: 5 }),
      seam1: mist('fog', { opacity: 0.22, speed: 0.01, color: 0xa8f2e6, order: 20, additive: true }),
      seam2: mist('fog', { opacity: 0.35, speed: 0.008, color: 0x9fe0e8, order: 23 }),
      peaksLow: mist('smoke', { opacity: 0.18, speed: 0.005, color: 0xbfe8f2, order: 6 }),
      seam3: mist('fog', { opacity: 0.4, speed: -0.007, color: 0x8fc7d0, order: 24 }),
      forestLow: mist('fog', { opacity: 0.16, speed: 0.005, color: 0x9fd8cf, order: 7 }),
      seam4: mist('fog', { opacity: 0.4, speed: 0.006, color: 0x92c9d8, order: 25 }),
      contactLow: mist('fog', { opacity: 0.18, speed: 0.004, color: 0x8fe0ea, order: 8 }),
      nearFall: mist('fog', { opacity: 0.0, speed: 0.02, color: 0xb8fff2, order: 70, additive: true }, L_FG),
    };

    // ---- curtains of light the camera falls through ----
    this.veils = [
      new AuroraVeil({ seed: 3, scale: 2.0, bottom: 0.18, falloff: 2.6, opacity: 0.42, colA: 0x2affd5, colB: 0x8f7dff }),
      new AuroraVeil({ seed: 11, scale: 2.6, bottom: 0.3, falloff: 3.4, opacity: 0.5, colA: 0x35f5b8, colB: 0x6fd6ff }),
      new AuroraVeil({ seed: 23, scale: 1.7, bottom: 0.22, falloff: 2.2, opacity: 0.45, colA: 0x29f0e0, colB: 0xb38bff }),
      new AuroraVeil({ seed: 37, scale: 2.3, bottom: 0.26, falloff: 3.0, opacity: 0.45, colA: 0x3dffc9, colB: 0x7f9bff }),
      new AuroraVeil({ seed: 51, scale: 1.9, bottom: 0.2, falloff: 2.8, opacity: 0.4, colA: 0x2affd5, colB: 0xa78bfa }),
    ];
    if (this.isMobile) this.veils = this.veils.filter((_, i) => i % 2 === 0);
    for (const v of this.veils) { v.mesh.layers.set(L_FG); this.scene.add(v.mesh); }

    this.renderOrderFix();
    this.setupPost();
  }

  renderOrderFix() {
    // plates first (far to near), then mid layers, glass separately, fg last
    Object.values(this.plates).forEach((p) => { p.mesh.renderOrder = -100 + p.cfg.z; });
  }

  setupPost() {
    const r = this.renderer;
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    this.rtBG = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType, generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
    });
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType }));
    this.composer.setPixelRatio(this.dpr);
    this.worldPass = new WorldPass(this);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.3, 0.55, 0.95);
    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.worldPass);
    this.bloom.enabled = !this.isMobile;
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.final);
    this.composer.addPass(new OutputPass());
  }

  /* ------------------------------- layout ------------------------------ */
  layout() {
    const w = innerWidth, h = innerHeight;
    if (!w || !h) { this.Hv = 0; return; }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.rtBG?.setSize(size.x, size.y);
    this.final.uniforms.uRes.value.copy(size);
    for (const g of this.glasses) g.uniforms.uRes.value.copy(size);

    const Hv = 2 * D * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const Wv = Hv * (w / h);
    this.Hv = Hv; this.Wv = Wv;
    const P = this.plates;
    let top = Hv / 2 + Hv * 0.05;
    let prev = null;
    for (const cfg of PLATES) {
      const p = P[cfg.key];
      if (prev) top = prev.bottom + (cfg.overlap ?? 0.3) * Hv;
      p.layout(top, Hv, Wv, D);
      prev = p;
    }
    this.placeElements();
    this.computeKeys();
  }

  placeElements() {
    const { hero, fall, peaks, forest, contact } = this.plates;
    const Hv = this.Hv, Wv = this.Wv;
    const portrait = innerWidth / innerHeight < 0.9;
    const aspect = innerWidth / innerHeight;
    const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    // --- ABDULLAH glass rising out of the lake ---
    const gU = portrait ? 0.6 : 0.635, gV = portrait ? 0.72 : 0.79;
    const base = hero.anchor(gU, gV);
    const gh = Hv * (portrait ? 0.3 : 0.56), gw = gh * 0.54, gd = gh * 0.075;
    this.glassSoul.rebuild(gw, gh, gd, 0.13);
    this.glassSoul.mesh.position.set(base.x, base.y + gh / 2 - gh * 0.09, base.z);
    this.glassSoul.uniforms.uWaterY.value = base.y;
    this.glassSoul.basePos = this.glassSoul.mesh.position.clone();
    this.glassSoul.mesh.rotation.y = -0.22;
    hero.uniforms.uRipple.value.set(gU, 1 - gV, (gw * 1.05) / hero.W, 1);
    hero.setLight(gU, gV - (gh * 0.5) / hero.H, 0.16, 0.34, new THREE.Color(0x7ff5e6));
    hero.uniforms.uReflRect.value.set(gU, 1 - gV + 0.004, (gw / 0.64) / hero.W, (gh * 0.95) / hero.H);

    // --- the woods: framing pines and branches relative to the opening shot ---
    const F = this.flora;
    const c0 = hero.view(this.heroV0 ?? 0.5);
    const near = (c, zOff, fx, fy, hk, rot = 0) => {
      const half = tanH * zOff;
      c.place(new THREE.Vector3(c0.x + fx * half * aspect, c0.y + fy * half, c0.z - zOff), half * hk, rot);
    };
    near(F.pinesL, 6.2, portrait ? -1.75 : -0.9, -1.2, portrait ? 0.85 : 0.9, 0);
    near(F.pinesR, 6.0, portrait ? 1.65 : 0.86, -1.16, portrait ? 0.85 : 0.98, 0);
    const f0 = forest.view(0.5);
    const zO = 4.4, hf = tanH * zO;
    F.forestBranch.place(new THREE.Vector3(f0.x - hf * aspect * (portrait ? 1.3 : 0.98), f0.y - hf * 1.25, f0.z - zO), hf * (portrait ? 0.95 : 1.35), -0.3);

    // --- mists ---
    const M = this.mists;
    M.heroLake.place(hero.x, hero.top - hero.H * 0.7, hero.anchor(0.5, 0.72).z + 0.3, hero.W * 1.1, hero.H * 0.22);
    M.seam1.place(0, hero.bottom + Hv * 0.08, -1.4, Wv * 1.8, Hv * 0.7);
    M.seam2.place(0, fall.bottom + Hv * 0.05, peaks.cfg.z + 1.2, Wv * 2.2, Hv * 0.9);
    M.peaksLow.place(0, peaks.bottom + peaks.H * 0.12, peaks.cfg.z + 0.8, peaks.W * 1.1, peaks.H * 0.22);
    M.seam3.place(0, peaks.bottom + Hv * 0.05, forest.cfg.z + 1.2, Wv * 2.2, Hv * 0.8);
    M.forestLow.place(forest.x, forest.bottom + forest.H * 0.14, forest.cfg.z + 0.9, forest.W, forest.H * 0.25);
    M.seam4.place(0, forest.bottom + Hv * 0.05, contact.cfg.z + 1.2, Wv * 2.2, Hv * 0.8);
    M.contactLow.place(contact.x, contact.bottom + contact.H * 0.12, contact.cfg.z + 0.9, contact.W * 1.1, contact.H * 0.2);
    M.nearFall.place(0, fall.top - fall.H * 0.5, fall.cfg.z + 6.5, Wv * 1.4, fall.H * 0.9);

    // --- veils: staggered in depth along the fall so the camera passes through each one ---
    const zs = [8.1, 7.3, 6.6, 5.6, 4.4];
    const ys = [0.08, 0.3, 0.52, 0.72, 0.92];
    this.veils.forEach((v, i) => {
      const dist = 3.2;
      const hh = 2 * tanH * dist * 1.9;
      const k = this.isMobile ? i * 2 : i;   // phones keep every other curtain, spread over the whole fall
      v.place((k % 2 ? 1 : -1) * Wv * 0.06, fall.top - fall.H * ys[k] - Hv * 0.1, zs[k] - dist, hh * aspect * 1.25, hh);
    });

    // --- HEY glass standing in the fjord ---
    const hU = 0.62, hV = 0.905;
    const hb = contact.anchor(hU, hV);
    const hh = Hv * (portrait ? 0.19 : 0.23), hw = hh * 1.12;
    this.glassHey.rebuild(hw, hh, hh * 0.1, 0.2);
    this.glassHey.mesh.position.set(hb.x, hb.y + hh / 2 - hh * 0.08, hb.z);
    this.glassHey.uniforms.uWaterY.value = hb.y;
    this.glassHey.basePos = this.glassHey.mesh.position.clone();
    this.glassHey.mesh.rotation.y = -0.18;
    contact.uniforms.uRipple.value.set(hU, 1 - hV, (hw * 1.05) / contact.W, 0.8);
    contact.uniforms.uReflRect.value.set(hU, 1 - hV + 0.003, (hw / 0.64) / contact.W, (hh * 0.9) / contact.H);
    contact.setLight(hU, hV - (hh * 0.5) / contact.H, 0.16, 0.26, new THREE.Color(0x8ff6ea));
    peaks.setLight(0.5, 0.55, 0.4, 0.12, new THREE.Color(0x7ff5e6));
    forest.setLight(0.45, 0.45, 0.4, 0.1, new THREE.Color(0xb9a2ff));

    // --- particles: drifting ice dust, and streaks of light during the fall ---
    this.particles?.forEach((p) => { this.scene.remove(p.points); p.points.geometry.dispose(); });
    const box = (x0, x1, y0, y1, z0, z1) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
    const k = this.isMobile ? 0.55 : 1;
    const ice = ['#d9fffb', '#bff7ef', '#e9e2ff', '#c7f0ff'];
    const ffHero = new Fireflies(Math.round(200 * k), box(-hero.W * 0.5, hero.W * 0.5, hero.bottom + hero.H * 0.1, hero.top - hero.H * 0.05, -2, 7), ice, { size: 0.035, intensity: 2.2 });
    const ffPeaks = new Fireflies(Math.round(150 * k), box(-peaks.W * 0.5, peaks.W * 0.5, peaks.bottom, peaks.top, peaks.cfg.z - 0.5, peaks.cfg.z + 7), ice, { size: 0.03, intensity: 1.8 });
    const ffForest = new Fireflies(Math.round(130 * k), box(-forest.W * 0.5, forest.W * 0.5, forest.bottom + forest.H * 0.1, forest.top - forest.H * 0.1, forest.cfg.z - 1, forest.cfg.z + 7), ice, { size: 0.035, intensity: 2 });
    const ffCon = new Fireflies(Math.round(150 * k), box(-contact.W * 0.5, contact.W * 0.5, contact.bottom + contact.H * 0.1, contact.top - contact.H * 0.1, contact.cfg.z - 1, contact.cfg.z + 7), ice, { size: 0.035, intensity: 2.2 });
    this.spray = new Spray(Math.round(700 * k), box(-Wv * 0.8, Wv * 0.8, fall.bottom - Hv * 0.5, fall.top + Hv * 0.2, fall.cfg.z + 1, fall.cfg.z + 8.5));
    this.particles = [ffHero, ffPeaks, ffForest, ffCon, this.spray];
    this.ff = { hero: ffHero, peaks: ffPeaks, forest: ffForest, contact: ffCon };
    for (const p of this.particles) {
      p.points.layers.set(L_FG);
      p.uniforms.uPixel.value = this.pixelScale();
      this.scene.add(p.points);
    }
  }

  pixelScale() { return (innerHeight * this.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))); }

  /* --------------------------- camera path ----------------------------- */
  setSections(s) { this.sections = s; }

  computeKeys() {
    if (!this.sections) return;
    const { hero, fall, peaks, forest, contact } = this.plates;
    const S = this.sections;
    const vh = innerHeight;
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    const end = (el) => Math.max(top(el), top(el) + el.offsetHeight - vh);
    const maxS = document.documentElement.scrollHeight - vh;
    const portrait = innerWidth / innerHeight < 0.9;
    this.heroV0 = portrait ? 0.73 : 0.5;
    const k = (s, pos, tilt = 0) => ({ s, pos, tilt });
    const dTop = top(S.descent), dH = S.descent.offsetHeight;
    this.keys = [
      k(0, hero.view(this.heroV0)),
      k(dTop, hero.view(0.82, -1.3), -0.07),
      k(dTop + dH * 0.32, fall.view(0.28, -0.6), -0.1),
      k(dTop + dH * 0.72, fall.view(0.8, -0.8), -0.08),
      k(top(S.work), peaks.view(0.24)),
      k(end(S.work), peaks.view(0.66, -0.6), 0.02),
      k(top(S.about), forest.view(0.4)),
      k(end(S.about), forest.view(0.62, -0.8)),
      k(top(S.contact), contact.view(0.6)),
      k(Math.max(maxS, top(S.contact) + 1), contact.view(0.8, -0.9)),
    ];
    this.curve = new THREE.CatmullRomCurve3(this.keys.map((q) => q.pos), false, 'centripetal');
    this.descentRange = [dTop - vh * 0.3, top(S.work)];
  }

  cameraAt(scroll) {
    const K = this.keys;
    if (!K.length) return { pos: new THREE.Vector3(0, 0, D), tilt: 0 };
    let i = 0;
    while (i < K.length - 2 && scroll > K[i + 1].s) i++;
    const a = K[i], b = K[i + 1];
    const t = THREE.MathUtils.clamp((scroll - a.s) / Math.max(1, b.s - a.s), 0, 1);
    const u = (i + t) / (K.length - 1);
    const ts = t * t * (3 - 2 * t);
    return { pos: this.curve.getPoint(u), tilt: THREE.MathUtils.lerp(a.tilt, b.tilt, ts) };
  }

  /* ------------------------------ interaction -------------------------- */
  pointer(x, y) {
    this.mouse.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.glasses.map((g) => g.mesh), false);
    const g = hits.length ? this.glasses.find((q) => q.mesh === hits[0].object) : null;
    this.hovered = g;
    return g ? g.kind : null;
  }

  setFocus(name) { this.focus = name; }

  /* -------------------------------- frame ------------------------------ */
  update(scroll, dt) {
    if (!this.plates || !this.Hv) return;
    this.time += dt;
    const t = this.time;

    // camera
    const { pos, tilt } = this.cameraAt(scroll);
    this.camTarget.copy(pos);
    const ie = 1 - this.intro;
    this.camTarget.z -= ie * ie * 1.6;
    this.camTarget.y -= ie * ie * 0.25;
    const damp = 1 - Math.exp(-dt * 5.5);
    this.camPos.lerp(this.camTarget, damp);
    this.mouseS.lerp(this.mouse, 1 - Math.exp(-dt * 3));
    this.tiltS += (tilt - this.tiltS) * damp;
    const breathe = Math.sin(t * 0.35) * 0.04;
    this.camera.position.set(
      this.camPos.x + this.mouseS.x * 0.3,
      this.camPos.y + this.mouseS.y * 0.15 + breathe,
      this.camPos.z,
    );
    this.camera.rotation.set(this.tiltS + this.mouseS.y * 0.01, -this.mouseS.x * 0.018, Math.sin(t * 0.21) * 0.003);

    const camY = this.camera.position.y;
    const Hv = this.Hv;

    // plates
    for (const p of Object.values(this.plates)) {
      const key = p.cfg.key;
      const fadeOut = key === 'contact' ? 1 : THREE.MathUtils.smoothstep(camY, p.bottom + Hv * 0.02, p.bottom + Hv * 0.62);
      const fadeIn = key === 'hero' ? 1 : 1 - THREE.MathUtils.smoothstep(camY, p.top - Hv * 0.62, p.top - Hv * 0.02);
      p.fade = fadeOut * fadeIn;
      p.uniforms.uOpacity.value = p.fade;
      p.mesh.visible = p.fade > 0.003 && p.isNear(camY, Hv);
      p.uniforms.uTime.value = t;
    }
    const heroFade = this.plates.hero.fade;
    for (const k of ['pinesL', 'pinesR']) this.flora[k].uniforms.uOpacity.value = Math.min(1, heroFade * 1.3);
    this.flora.forestBranch.uniforms.uOpacity.value = this.plates.forest.fade;
    this.mists.heroLake.uniforms.uOpacity.value = 0.12 * heroFade;
    this.mists.peaksLow.uniforms.uOpacity.value = 0.18 * this.plates.peaks.fade;
    this.mists.forestLow.uniforms.uOpacity.value = 0.16 * this.plates.forest.fade;
    this.mists.contactLow.uniforms.uOpacity.value = 0.18 * this.plates.contact.fade;
    this.ff.peaks.uniforms.uOpacity.value = this.plates.peaks.fade;
    this.ff.forest.uniforms.uOpacity.value = this.plates.forest.fade;
    this.ff.contact.uniforms.uOpacity.value = this.plates.contact.fade;
    for (const v of this.veils) v.update(t, this.camera);
    // hovering a project makes the sky flare
    const boost = this.focus ? 0.35 : 0;
    this.auroraBoost = (this.auroraBoost ?? 0) + (boost - (this.auroraBoost ?? 0)) * damp;
    for (const p of Object.values(this.plates)) p.uniforms.uAuroraBoost.value = this.auroraBoost;
    // motion blur from vertical camera speed: you fall with the water
    const vy = this.prevCamY === undefined ? 0 : (camY - this.prevCamY) / Hv;
    this.prevCamY = camY;
    const blur = this.isMobile ? 0 : THREE.MathUtils.clamp(Math.abs(vy) * 0.6, 0, 0.02) * (1 - this.plates.hero.fade * 0.85);
    this.blurS = (this.blurS ?? 0) + (blur - (this.blurS ?? 0)) * (1 - Math.exp(-dt * 10));
    this.final.uniforms.uBlur.value = this.blurS;
    this.plates.hero.uniforms.uLight.value.w = 0.34 * this.intro * (1 + this.glassSoul.hover * 0.5);

    // flora / mist
    for (const c of Object.values(this.flora)) c.uniforms.uTime.value = t;
    for (const m of Object.values(this.mists)) m.uniforms.uTime.value = t;

    // glass
    for (const g of this.glasses) {
      g.targetHover = this.hovered === g ? 1 : 0;
      g.hover += (g.targetHover - g.hover) * (1 - Math.exp(-dt * 6));
      g.uniforms.uTime.value = t;
      g.uniforms.uHover.value = g.hover;
      g.uniforms.uScene.value = this.rtBG.texture;
      g.mesh.visible = Math.abs(g.mesh.position.y - camY) < Hv * 1.4;
      if (g.basePos) {
        g.mesh.position.y = g.basePos.y + (g === this.glassSoul ? Math.sin(t * 0.9) * 0.004 : Math.sin(t * 0.8) * 0.012);
        g.mesh.rotation.y = (g === this.glassSoul ? -0.22 : -0.18) + this.mouseS.x * 0.06 + g.hover * 0.05;
      }
    }
    const flick = this.intro < 1 ? (Math.sin(t * 40) > 0.2 ? 1 : 0.6) : 1;
    // the glass belongs to the lake: it dissolves with it as you dive
    this.glassSoul.uniforms.uIntro.value = Math.min(1, this.intro * 1.15) * flick * this.plates.hero.fade;
    this.glassSoul.mesh.visible = this.glassSoul.mesh.visible && this.plates.hero.fade > 0.04;
    this.glassHey.mesh.visible = this.glassHey.mesh.visible && this.plates.contact.fade > 0.04;
    this.glassHey.uniforms.uIntro.value = 1;

    // particles
    const px = this.pixelScale();
    for (const p of this.particles) { p.uniforms.uTime.value = t; p.uniforms.uPixel.value = px; }

    // descent signals
    const [d0, d1] = this.descentRange ?? [1, 2];
    const dp = THREE.MathUtils.clamp((scroll - d0) / (d1 - d0), 0, 1);
    this.signals.descent = dp;
    const inFall = Math.sin(dp * Math.PI);
    this.spray.uniforms.uOpacity.value = inFall * 0.9;
    this.mists.nearFall.uniforms.uOpacity.value = inFall * 0.12;
    this.ff.hero.uniforms.uOpacity.value = THREE.MathUtils.clamp(1 - dp * 2.2, 0, 1) * this.intro;

    // scene weights (UI signals)
    const P = this.plates, w = this.signals.weights;
    for (const key of Object.keys(w)) {
      const p = P[key];
      const c = (p.top + p.bottom) / 2, half = (p.top - p.bottom) / 2 + Hv * 0.3;
      w[key] = THREE.MathUtils.clamp(1 - Math.abs(camY - c) / half, 0, 1);
    }

    this.final.uniforms.uTime.value = t;
    this.final.uniforms.uFade.value = Math.min(1, this.intro * 1.6);

    this.composer.render(dt);
    this.adapt(dt);
  }

  adapt(dt) {
    const P = this.perf;
    P.acc += dt; P.n++; P.t += dt;
    if (P.t > 2.5) {
      const avg = P.acc / P.n;
      if (avg > 1 / 42 && this.dpr > 0.9) {
        this.dpr = Math.max(0.85, this.dpr - 0.2);
        this.renderer.setPixelRatio(this.dpr);
        this.composer.setPixelRatio(this.dpr);
        this.layout();
      }
      P.acc = 0; P.n = 0; P.t = 0;
    }
  }
}
