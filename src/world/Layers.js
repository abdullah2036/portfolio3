import * as THREE from 'three';
import { NOISE } from './glsl.js';

/* ------------------------------------------------------------------ */
/* Cutout: a matted photographic element (flower, fern) that sways.   */
/* ------------------------------------------------------------------ */
const cutVert = /* glsl */ `
uniform float uTime, uAmp, uFreq, uPhase, uBend;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float k = pow(uv.y, uBend);
  float t = uTime * uFreq + uPhase;
  float sway = sin(t) * .55 + sin(t * 2.27 + 1.3) * .22 + sin(uTime * .37 + uPhase) * .45;
  float gust = .6 + .4 * sin(uTime * .61) * sin(uTime * .23 + 1.3);
  p.x += sway * uAmp * k * gust;
  p.z += cos(t * .8) * uAmp * .35 * k;
  p.y -= abs(sway) * uAmp * .12 * k;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const cutFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uBias, uExposure, uSat, uOpacity, uRimAmt, uBaseFade, uEdgeFade;
uniform vec3 uTint, uRim, uFog;
uniform float uFogAmt;
uniform vec2 uLightDir;
varying vec2 vUv;
${NOISE}
void main() {
  vec4 t = texture2D(uMap, vUv, uBias);
  // light-facing edge only: alpha present here but not one step toward the light
  float a2 = texture2D(uMap, vUv + uLightDir * .012, uBias).a;
  float a3 = texture2D(uMap, vUv - uLightDir * .012, uBias).a;
  float rim = clamp(t.a - a2, 0., 1.) * smoothstep(.2, .9, a3);
  vec3 c = t.rgb * uExposure;
  c = mix(vec3(luma(c)), c, uSat) * uTint;
  c = mix(c, uFog, uFogAmt);
  c += uRim * rim * uRimAmt;
  float bf = uBaseFade > 0. ? smoothstep(0., uBaseFade, vUv.y) : 1.;
  // dissolve any edge where the source photo cropped the subject
  if (uEdgeFade > 0.) bf *= smoothstep(0., uEdgeFade, vUv.x) * smoothstep(0., uEdgeFade, 1. - vUv.x) * smoothstep(0., uEdgeFade, vUv.y) * smoothstep(0., uEdgeFade, 1. - vUv.y);
  c *= mix(.25, 1., bf);
  gl_FragColor = vec4(c, t.a * uOpacity * bf);
}`;

export class Cutout {
  constructor(tex, o) {
    const aspect = tex.image.width / tex.image.height;
    const geo = new THREE.PlaneGeometry(aspect, 1, 1, 24);
    geo.translate(0, 0.5, 0);
    this.o = o;
    this.uniforms = {
      uMap: { value: tex },
      uTime: { value: 0 },
      uAmp: { value: o.amp ?? 0.03 },
      uFreq: { value: o.freq ?? 1.2 },
      uPhase: { value: o.phase ?? Math.random() * 6.28 },
      uBend: { value: o.bend ?? 1.6 },
      uBias: { value: o.blur ?? 0 },
      uExposure: { value: o.exposure ?? 0.5 },
      uSat: { value: o.sat ?? 0.85 },
      uOpacity: { value: o.opacity ?? 1 },
      uBaseFade: { value: o.baseFade ?? 0 },
      uEdgeFade: { value: o.edgeFade ?? 0 },
      uTint: { value: new THREE.Vector3(...(o.tint ?? [0.7, 0.85, 1.0])) },
      uRim: { value: new THREE.Color(o.rim ?? 0x9fe8ff) },
      uRimAmt: { value: o.rimAmt ?? 1.2 },
      uFog: { value: new THREE.Vector3(...(o.fog ?? [0.02, 0.05, 0.08])) },
      uFogAmt: { value: o.fogAmt ?? 0 },
      uLightDir: { value: new THREE.Vector2(...(o.lightDir ?? [0.7, 0.2])) },
    };
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      vertexShader: cutVert, fragmentShader: cutFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.order ?? 0;
    if (o.flip) this.mesh.scale.x = -1;
  }
  place(pos, height, rotZ = 0) {
    this.mesh.position.copy(pos);
    this.mesh.scale.set(height * (this.o.flip ? -1 : 1), height, height);
    this.mesh.rotation.z = rotZ;
  }
}

/* ------------------------------------------------------------------ */
/* Mist: drifting volumetric smoke / fog plates (luminance -> alpha).  */
/* ------------------------------------------------------------------ */
const mistFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime, uOpacity, uSpeed, uSeed;
uniform vec3 uColor;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 uv = vUv;
  vec2 w = vec2(fbm(uv * 3. + vec2(uTime * .05, uSeed)), fbm(uv * 3. + vec2(uSeed, -uTime * .04))) - .5;
  vec2 su = uv * vec2(.8, .9) + vec2(uTime * uSpeed + uSeed, 0.) + w * .08;
  float m = texture2D(uMap, su).r;
  float m2 = texture2D(uMap, su * 1.3 + vec2(-uTime * uSpeed * .6, .3)).r;
  float mask = smoothstep(0., .25, uv.x) * smoothstep(0., .25, 1. - uv.x) * smoothstep(0., .35, uv.y) * smoothstep(0., .35, 1. - uv.y);
  float a = (m * .7 + m2 * .5) * mask * uOpacity;
  gl_FragColor = vec4(uColor, a);
}`;
const simpleVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export class Mist {
  constructor(tex, o) {
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
    this.base = o.opacity ?? 0.4;
    this.uniforms = {
      uMap: { value: tex },
      uTime: { value: 0 },
      uOpacity: { value: this.base },
      uSpeed: { value: o.speed ?? 0.01 },
      uSeed: { value: Math.random() * 10 },
      uColor: { value: new THREE.Color(o.color ?? 0xbfe6f0) },
    };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      vertexShader: simpleVert, fragmentShader: mistFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.order ?? 0;
  }
  place(x, y, z, w, h) { this.mesh.position.set(x, y, z); this.mesh.scale.set(w, h, 1); }
}

/* ------------------------------------------------------------------ */
/* Screen-blended living element (jellyfish) with pulsing bell.       */
/* ------------------------------------------------------------------ */
const jellyVert = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const jellyFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime, uOpacity, uBoost;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 uv = vUv;
  // pulse: the bell (upper area) contracts & relaxes, tentacles trail with a delay
  float pulse = pow(.5 + .5 * sin(uTime * 1.6), 2.);
  vec2 bell = vec2(.52, .66);
  vec2 d = uv - bell;
  float bm = exp(-dot(d * vec2(1., 1.6), d * vec2(1., 1.6)) * 18.);
  uv.x = bell.x + (uv.x - bell.x) * (1. + .06 * pulse * bm);
  uv.y += .012 * pulse * bm;
  float tm = smoothstep(.62, .2, uv.y);
  uv.x += sin(uv.y * 18. - uTime * 2.1) * .006 * tm + (vnoise(vec2(uv.y * 9., uTime * .4)) - .5) * .01 * tm;
  vec3 c = texture2D(uMap, uv).rgb;
  float edge = smoothstep(0., .18, vUv.x) * smoothstep(0., .18, 1. - vUv.x) * smoothstep(0., .1, vUv.y) * smoothstep(0., .14, 1. - vUv.y);
  c = max(c - .03, 0.) * 1.35;
  c *= 1. + .5 * pulse * bm + uBoost;
  gl_FragColor = vec4(c * edge * uOpacity, 1.);
}`;

export class Jelly {
  constructor(tex) {
    const aspect = tex.image.width / tex.image.height;
    this.uniforms = { uMap: { value: tex }, uTime: { value: 0 }, uOpacity: { value: 1 }, uBoost: { value: 0 } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), new THREE.ShaderMaterial({
      vertexShader: jellyVert, fragmentShader: jellyFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
  }
}

/* ------------------------------------------------------------------ */
/* Particles: fireflies, spores, drifting motes                       */
/* ------------------------------------------------------------------ */
const ffVert = /* glsl */ `
attribute vec4 aSeed;
attribute vec3 aColor;
uniform float uTime, uSize, uPixel;
varying vec3 vColor;
varying float vA;
void main() {
  vec3 p = position;
  float t = uTime * (.25 + aSeed.y * .35) + aSeed.x * 40.;
  p.x += sin(t * .9 + aSeed.z * 6.) * .35 + sin(t * .37) * .5;
  p.y += sin(t * .7 + aSeed.w * 6.) * .25 + cos(t * .23) * .3;
  p.z += cos(t * .5 + aSeed.x * 3.) * .3;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float blink = smoothstep(.15, 1., .5 + .5 * sin(uTime * (1.2 + aSeed.w * 2.) + aSeed.z * 30.));
  vA = blink;
  vColor = aColor;
  gl_PointSize = uSize * uPixel * (.5 + aSeed.y) / -mv.z;
}`;
const ffFrag = /* glsl */ `
uniform float uOpacity, uIntensity;
varying vec3 vColor;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - .5;
  float d = length(c);
  float core = exp(-d * d * 120.);
  float halo = exp(-d * d * 14.) * .35;
  float a = (core + halo) * vA * uOpacity;
  gl_FragColor = vec4(vColor * a * uIntensity, 1.);
}`;

export class Fireflies {
  constructor(count, box, palette, o = {}) {
    const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4), col = new Float32Array(count * 3);
    const cols = palette.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random());
      pos[i * 3 + 1] = THREE.MathUtils.lerp(box.min.y, box.max.y, Math.pow(Math.random(), o.lowBias ?? 1));
      pos[i * 3 + 2] = THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random());
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random();
      const c = cols[Math.floor(Math.random() * cols.length)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    this.uniforms = {
      uTime: { value: 0 }, uSize: { value: o.size ?? 0.06 }, uPixel: { value: 1 },
      uOpacity: { value: 1 }, uIntensity: { value: o.intensity ?? 3 },
    };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: ffVert, fragmentShader: ffFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 50;
    this.box = box;
  }
}

/* ------------------------------------------------------------------ */
/* Spray: falling droplets / streaks alongside the waterfall          */
/* ------------------------------------------------------------------ */
const sprayVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime, uTop, uRange, uPixel, uSize;
varying float vA;
void main() {
  vec3 p = position;
  float sp = 2.2 + aSeed.y * 3.5;
  // motes of light drift upward past you while the camera falls through the aurora
  p.y = (uTop - uRange) + mod(uTime * sp * .3 + aSeed.x * uRange, uRange);
  p.x += sin(uTime * .7 + aSeed.z * 6.) * .15;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  vA = .35 + .65 * aSeed.w;
  gl_PointSize = uSize * uPixel * (.6 + aSeed.y) / -mv.z;
}`;
const sprayFrag = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - .5;
  float a = exp(-c.x * c.x * 400.) * smoothstep(.5, .0, abs(c.y)) * vA * uOpacity;
  gl_FragColor = vec4(uColor * a, 1.);
}`;

export class Spray {
  constructor(count, box) {
    const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random());
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random());
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.uniforms = {
      uTime: { value: 0 }, uTop: { value: box.max.y }, uRange: { value: box.max.y - box.min.y },
      uPixel: { value: 1 }, uSize: { value: 0.09 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xbff7ef) },
    };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: sprayVert, fragmentShader: sprayFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 60;
  }
}

/* ------------------------------------------------------------------ */
/* AuroraVeil: a volumetric curtain of light you can fly through      */
/* ------------------------------------------------------------------ */
const veilFrag = /* glsl */ `
uniform float uTime, uOpacity, uSeed, uScale, uBottom, uFalloff, uFade;
uniform vec3 uColA, uColB;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 uv = vUv;
  float x = uv.x * uScale + uSeed;
  float fold = (fbm(vec2(x * .55 + uTime * .025, uSeed + uTime * .018)) - .5) * 2.4;
  float band = x + fold;
  float base = uBottom + (fbm(vec2(band * 1.3, uTime * .04 + uSeed)) - .5) * .3;
  float h = uv.y - base;
  float prof = smoothstep(-.03, .04, h) * exp(-max(h, 0.) * uFalloff);
  float rays = pow(vnoise(vec2(band * 22. + uTime * .25, uSeed)), 2.2);
  float rays2 = fbm(vec2(band * 7. - uTime * .18, uv.y * .7 + uSeed));
  float shimmer = .75 + .25 * sin(uTime * .9 + band * 3.);
  float a = prof * (.06 + rays * 1.7 + rays2 * .35) * shimmer;
  vec3 col = mix(uColA, uColB, smoothstep(.05, .55, h));
  col += vec3(.6, 1., .9) * smoothstep(.02, -.01, abs(h - .01)) * .25;
  float edge = smoothstep(0., .18, uv.x) * smoothstep(0., .18, 1. - uv.x) * smoothstep(0., .08, uv.y) * smoothstep(0., .2, 1. - uv.y);
  gl_FragColor = vec4(col * a * edge * uOpacity * uFade, 1.);
}`;

export class AuroraVeil {
  constructor(o = {}) {
    this.base = o.opacity ?? 0.6;
    this.uniforms = {
      uTime: { value: 0 }, uOpacity: { value: this.base }, uFade: { value: 1 },
      uSeed: { value: o.seed ?? Math.random() * 50 }, uScale: { value: o.scale ?? 2.2 },
      uBottom: { value: o.bottom ?? 0.25 }, uFalloff: { value: o.falloff ?? 3.2 },
      uColA: { value: new THREE.Color(o.colA ?? 0x2affd5) }, uColB: { value: new THREE.Color(o.colB ?? 0x9b7dff) },
    };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      vertexShader: simpleVert, fragmentShader: veilFrag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.order ?? 40;
  }
  place(x, y, z, w, h) { this.mesh.position.set(x, y, z); this.mesh.scale.set(w, h, 1); }
  /** fade out as the camera approaches / passes through the curtain */
  update(t, cam) {
    this.uniforms.uTime.value = t;
    const dz = cam.position.z - this.mesh.position.z;
    const near = THREE.MathUtils.smoothstep(dz, 0.7, 3.0);
    const dy = Math.abs(cam.position.y - this.mesh.position.y) / (this.mesh.scale.y * 0.6 + 1e-3);
    this.uniforms.uFade.value = near * THREE.MathUtils.clamp(1.4 - dy, 0, 1);
    this.mesh.visible = this.uniforms.uFade.value > 0.002 && dz > 0;
  }
}
