import * as THREE from 'three';
import { NOISE } from './glsl.js';

/**
 * A photographic scene plate rendered as a living 2.5D relief:
 *  - per-pixel parallax from a monocular depth map (view-dependent, relative to a rest camera)
 *  - flow-mapped water driven by a semantic water mask
 *  - a living aurora: curtains undulate, rays race along the bands, stars twinkle (sky mask)
 *  - night grade, atmospheric depth fog, light spill and rippled reflections from glass objects
 */
const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
uniform sampler2D uMap, uData, uRefl;
uniform float uTime, uRelief, uFocus, uSway, uFlowSpeed, uFlowLen, uFlowWarp, uOpacity, uWaterGlow;
uniform vec2 uFlowDir, uSize;
uniform vec3 uRestCam;
uniform vec4 uFeather, uCrop;
uniform float uExposure, uGamma, uSat, uFogAmt, uContrast;
uniform vec3 uShadow, uHigh, uFog, uLift;
uniform vec4 uLight;
uniform vec3 uLightColor;
uniform vec4 uReflRect;
uniform float uReflAmt;
uniform vec4 uRipple; // xy base (plate uv), z width (uv), w amount
uniform float uAurora, uAuroraBoost, uSoft;
varying vec2 vUv;
varying vec3 vWorld;
${NOISE}

vec2 mapUV(vec2 p) { return mix(uCrop.xy, uCrop.zw, p); }

void main() {
  vec2 uv = vUv;

  // ---- view-dependent parallax (iterative relief mapping) ----
  vec3 V = cameraPosition - vWorld;
  vec3 V0 = uRestCam - vWorld;
  vec2 s = V.xy / max(V.z, .05) - V0.xy / max(V0.z, .05);
  vec2 shift = s * uRelief / uSize;
  vec2 p = uv;
  for (int i = 0; i < PSTEPS; i++) {
    float h = 1. - texture2D(uData, mapUV(clamp(p, .001, .999))).r;
    p = uv - shift * (h - uFocus);
  }
  p = clamp(p, .001, .999);

  vec4 D = texture2D(uData, mapUV(p));
  float depth = D.r, water = D.g, sky = D.b;

  // ---- aurora: the curtains breathe and drift (sky only) ----
  float aw = sky * uAurora;
  vec2 ad;
  ad.x = (fbm(vec2(p.x * 2.2 - uTime * .03, p.y * 1.4 + uTime * .045)) - .5) * .02
       + sin(p.y * 9. + p.x * 4. + uTime * .55) * .0028;
  ad.y = (fbm(vec2(p.x * 3. + 7., uTime * .035)) - .5) * .009;
  p += ad * aw;
  // the lake mirrors the same motion, softened
  vec2 aWater = vec2((fbm(vec2(p.x * 2.2 - uTime * .03, (1. - p.y) * 1.4 + uTime * .045)) - .5) * .012, 0.);
  p += aWater * water * uAurora;

  // concentric ripples spreading from where the glass meets the water
  float ring = 0., rmask = 0.;
  if (uRipple.w > 0.) {
    vec2 rd = (p - uRipple.xy) * vec2(uSize.x / uSize.y, 1.);
    rd.y *= 4.2;                                    // perspective-flattened ellipses on the water plane
    float hw = uRipple.z * uSize.x / uSize.y * .5;  // half glass width in height units
    vec2 q = vec2(max(abs(rd.x) - hw, 0.), rd.y);   // distance from the glass footprint
    float r = length(q);
    float ang = atan(rd.y, rd.x);
    float brk = smoothstep(.25, .75, vnoise(vec2(ang * 3. + uTime * .2, r * 30. - uTime * .9)));
    rmask = water * exp(-r * 34.) * smoothstep(.0, .003, r);
    float wave = r * 150. - uTime * 2.6 + vnoise(vec2(ang * 2., uTime * .3)) * 2.5;
    ring = sin(wave) * rmask * (.35 + .65 * brk);
    p += normalize(q + 1e-5) * ring * .0008 * vec2(sign(rd.x), 1.) * uRipple.w;
  }

  vec2 muv = mapUV(p);
  vec3 base = texture2D(uMap, muv, uSoft).rgb;
  vec3 col = base;

  // ---- water: two-phase flow map on the photograph itself ----
  float wm = smoothstep(.12, .6, water);
  if (wm > .001) {
    float ph = vnoise(p * 4.) * .8;
    float t0 = fract(uTime * uFlowSpeed + ph);
    float t1 = fract(uTime * uFlowSpeed + ph + .5);
    vec2 fl = uFlowDir * uFlowLen * mix(.6, 1., depth);
    vec2 wq = p * vec2(16., 5.) + vec2(0., uTime * uFlowSpeed * 9.);
    vec2 warp = (vec2(fbm(wq), fbm(wq + 5.2)) - .5) * uFlowWarp;
    vec3 c0 = texture2D(uMap, muv + fl * (t0 - .5) + warp).rgb;
    vec3 c1 = texture2D(uMap, muv + fl * (t1 - .5) + warp).rgb;
    vec3 cw = mix(c0, c1, abs(t0 * 2. - 1.));
    // glints riding the current
    float g = vnoise(p * vec2(160., 70.) + vec2(0., uTime * 3.2)) * vnoise(p * vec2(90., 40.) - vec2(uTime * .4, uTime * 1.5));
    cw += pow(g, 6.) * 5. * luma(cw) * uWaterGlow;
    col = mix(col, cw, wm);
  }

  // ---- aurora light: rays racing along the bands, slow pulses, colour drift, twinkling stars ----
  float cmax = max(max(base.r, base.g), base.b), cmin = min(min(base.r, base.g), base.b);
  float glowy = smoothstep(.03, .2, cmax - cmin) * smoothstep(.04, .3, cmax);
  float am = (sky + water * .8) * glowy * uAurora;
  float ry = water > .5 ? 1. - p.y : p.y;
  float rays = fbm(vec2(p.x * 24. + uTime * .32, ry * 1.1 - uTime * .05));
  float rays2 = vnoise(vec2(p.x * 70. - uTime * 1.1, ry * 2.));
  float pulse = .82 + .3 * sin(uTime * .37 + p.x * 3.2) * sin(uTime * .19 + 1.);
  col *= mix(1., (.5 + rays * 1.05 + rays2 * .22) * pulse * (1. + uAuroraBoost), am);
  float lav = am * smoothstep(.45, .95, ry) * (.5 + .5 * sin(uTime * .21 + p.x * 5.));
  col = mix(col, col * vec3(1.2, .82, 1.3), lav * .55);
  // only true point stars twinkle (bright, colourless, brighter than their surroundings)
  float local = luma(texture2D(uMap, muv, 3.5).rgb);
  float star = sky * (1. - glowy) * smoothstep(.12, .3, luma(base) - local);
  col *= mix(1., .6 + .8 * vnoise(p * 300. + uTime * 2.2), star);

  // ---- grade ----
  float Lb = luma(base);
  col *= uExposure;
  float L = luma(col);
  col = mix(vec3(L), col, uSat);
  col = mix(vec3(.18), col, uContrast);
  col = max(col, 0.);
  col *= mix(uShadow, uHigh, smoothstep(0., .45, L));
  col = pow(col, vec3(uGamma));
  col += uLift;
  col += water * pow(Lb, 2.5) * uWaterGlow * vec3(.35, .75, .95) * .6;

  // atmospheric depth
  col = mix(col, uFog, (1. - depth) * uFogAmt);

  // ---- light spill from glowing glass ----
  vec2 ld = (p - uLight.xy) * vec2(uSize.x / uSize.y, 1.);
  float fall = exp(-dot(ld, ld) / max(uLight.z * uLight.z, 1e-5));
  float fall2 = exp(-dot(ld, ld) / max(uLight.z * uLight.z * 9., 1e-5));
  col += uLightColor * uLight.w * (fall * (.05 + 1.6 * Lb) + fall2 * .035 + fall * water * .5);

  col += uLightColor * (max(ring, 0.) * .3 + rmask * .3) * uRipple.w * uLight.w * 1.6;

  // ---- rippled reflection of the glass on water ----
  if (uReflAmt > 0.) {
    vec2 rp = (p - uReflRect.xy) / uReflRect.zw;
    rp.y = -rp.y;
    if (rp.y > 0. && rp.y < 1. && abs(rp.x) < .75) {
      float rip = (vnoise(vec2(rp.y * 22. - uTime * 1.3, uTime * .25)) - .5) * .16 * (.2 + rp.y)
                + sin(rp.y * 70. - uTime * 3.4) * .008 * (.3 + rp.y);
      vec2 ru = vec2(rp.x + rip + .5, 1. - rp.y);
      vec3 refl = texture2D(uRefl, ru).rgb;
      float band = .8 + .2 * sin(rp.y * 90. - uTime * 2.2 + vnoise(vec2(rp.x * 8., rp.y * 10.)) * 6.);
      col += refl * band * water * uReflAmt * (1. - rp.y) * (1. - rp.y);
    }
  }

  float a = smoothstep(0., max(uFeather.x, 1e-4), 1. - vUv.y) * smoothstep(0., max(uFeather.y, 1e-4), vUv.y)
          * smoothstep(0., max(uFeather.z, 1e-4), vUv.x) * smoothstep(0., max(uFeather.w, 1e-4), 1. - vUv.x);
  gl_FragColor = vec4(col, a * uOpacity);
}`;

const BLACK = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
BLACK.needsUpdate = true;

export class Plate {
  constructor(cfg, map, data) {
    this.cfg = cfg;
    const g = cfg.grade;
    this.uniforms = {
      uMap: { value: map },
      uData: { value: data },
      uRefl: { value: BLACK },
      uTime: { value: 0 },
      uRelief: { value: cfg.relief },
      uFocus: { value: cfg.focus },
      uSway: { value: cfg.sway ?? 1 },
      uFlowDir: { value: new THREE.Vector2(...(cfg.flow?.dir ?? [0, 1])) },
      uFlowSpeed: { value: cfg.flow?.speed ?? 0.1 },
      uFlowLen: { value: cfg.flow?.len ?? 0.02 },
      uFlowWarp: { value: cfg.flow?.warp ?? 0.002 },
      uWaterGlow: { value: cfg.waterGlow ?? 0.5 },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRestCam: { value: new THREE.Vector3() },
      uFeather: { value: new THREE.Vector4(...cfg.feather) },
      uCrop: { value: new THREE.Vector4(...(cfg.crop ?? [0, 0, 1, 1])) },
      uOpacity: { value: 1 },
      uExposure: { value: g.exposure },
      uGamma: { value: g.gamma },
      uSat: { value: g.sat },
      uContrast: { value: g.contrast ?? 1 },
      uShadow: { value: new THREE.Vector3(...g.shadow) },
      uHigh: { value: new THREE.Vector3(...g.high) },
      uLift: { value: new THREE.Vector3(...(g.lift ?? [0, 0, 0])) },
      uFog: { value: new THREE.Vector3(...g.fog) },
      uFogAmt: { value: g.fogAmt },
      uLight: { value: new THREE.Vector4(0.5, 0.5, 0.0001, 0) },
      uLightColor: { value: new THREE.Color(0x9fe8ff) },
      uReflRect: { value: new THREE.Vector4(0.5, 0.5, 0.1, 0.1) },
      uReflAmt: { value: 0 },
      uRipple: { value: new THREE.Vector4(0.5, 0.5, 0.05, 0) },
      uAurora: { value: cfg.aurora ?? 1 },
      uSoft: { value: cfg.soft ?? 0 },
      uAuroraBoost: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      defines: { PSTEPS: cfg.steps ?? 6 },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.mesh.renderOrder = -100 - Math.round(-cfg.z * 2);
    this.mesh.frustumCulled = false;
    this.depthImg = null;
  }

  /** Lay the plate out so it covers the view from distance D. */
  layout(top, Hv, Wv, D) {
    const c = this.cfg;
    const crop = c.crop ?? [0, 0, 1, 1];
    const aspect = c.aspect * (Math.abs(crop[2] - crop[0]) / Math.abs(crop[3] - crop[1]));
    const portrait = Wv / Hv < 0.9;
    const minH = portrait ? (c.minHPortrait ?? c.minH) : c.minH;
    const W = Math.max(Wv * c.marginW, Hv * minH * aspect);
    const H = W / aspect;
    // never shift so far that the bleed needed for mouse parallax is lost
    const maxShift = Math.max(0, (W - Wv * 1.26) / 2);
    const fx = portrait ? (c.focusXPortrait ?? c.focusX ?? 0.5) : (c.focusX ?? 0.5);
    const x = THREE.MathUtils.clamp((0.5 - fx) * W, -maxShift, maxShift);
    this.W = W; this.H = H; this.top = top; this.bottom = top - H; this.x = x;
    this.mesh.scale.set(W, H, 1);
    this.mesh.position.set(x, top - H / 2, c.z);
    this.uniforms.uSize.value.set(W, H);
    this.uniforms.uRestCam.value.set(0, top - H / 2, c.z + D);
    this.Hv = Hv; this.D = D;
  }

  /** Camera position that frames the plate with its centre at fraction v (from top). */
  view(v, dz = 0) {
    const half = this.Hv / 2 * 1.1 * ((this.D + dz) / this.D);
    let y = this.top - v * this.H;
    y = THREE.MathUtils.clamp(y, this.bottom + half, this.top - half);
    return new THREE.Vector3(0, y, this.cfg.z + this.D + dz);
  }

  /** Sample depth (0 far .. 1 near) at plate uv (u from left, v from top). */
  depthAt(u, v) {
    if (!this.depthImg) return 0.5;
    const { w, h, px } = this.depthImg;
    const crop = this.cfg.crop ?? [0, 0, 1, 1];
    const mu = crop[0] + u * (crop[2] - crop[0]);
    const mv = 1 - (crop[1] + (1 - v) * (crop[3] - crop[1]));
    const x = Math.min(w - 1, Math.max(0, Math.round(mu * (w - 1))));
    const y = Math.min(h - 1, Math.max(0, Math.round(mv * (h - 1))));
    return px[(y * w + x) * 4] / 255;
  }

  /** World position of a photo point (u,v from top-left) placed at its reconstructed depth. */
  anchor(u, v, depthOverride) {
    const d = depthOverride ?? this.depthAt(u, v);
    const h = 1 - d;
    return new THREE.Vector3(
      this.x + (u - 0.5) * this.W,
      this.top - v * this.H,
      this.cfg.z - this.cfg.relief * (h - this.cfg.focus),
    );
  }

  setLight(u, v, radius, intensity, color) {
    this.uniforms.uLight.value.set(u, 1 - v, radius, intensity);
    if (color) this.uniforms.uLightColor.value.copy(color);
  }

  isNear(camY, Hv) {
    return camY < this.top + Hv * 1.2 && camY > this.bottom - Hv * 1.2;
  }
}
