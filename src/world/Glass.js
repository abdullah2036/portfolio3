import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { NOISE } from './glsl.js';

/**
 * Glowing glass monolith. Refracts the rendered world behind it (screen-space,
 * mip-blurred, chromatic), with fresnel rim light, inner edge glow, light sweep,
 * etched emissive typography and sparkles.
 */
const vert = /* glsl */ `
varying vec3 vN, vV, vObj, vW;
void main() {
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
uniform sampler2D uScene, uText;
uniform vec2 uRes;
uniform vec3 uSize;
uniform float uRadius, uTime, uGlow, uHover, uIntro, uSeed, uTone, uWaterY, uClear;
uniform vec3 uTintA, uTintB;
varying vec3 vN, vV, vObj, vW;
${NOISE}

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - (b - vec2(r));
  return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r;
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  float ndv = clamp(dot(N, V), 0., 1.);
  float fres = pow(1. - ndv, 2.4);
  vec2 suv = gl_FragCoord.xy / uRes;
  vec3 nV = normalize((viewMatrix * vec4(N, 0.)).xyz);

  vec2 tuv = vObj.xy / uSize.xy + .5;
  float front = smoothstep(uSize.z * .3, uSize.z * .5, vObj.z);

  // subtle cast-glass imperfection
  vec2 wob = (vec2(fbm(tuv * vec2(3., 5.) + uSeed + uTime * .02), fbm(tuv * vec2(3., 5.) + uSeed + 9.1 - uTime * .02)) - .5) * .012;
  vec2 off = nV.xy * (.045 + fres * .16) + wob;
  float lod = mix(.5, .15, uClear) + fres * 2.2 + (1. - front) * 1.5;
  vec3 refr;
  refr.r = textureLod(uScene, suv - off * 1.00, lod).r;
  refr.g = textureLod(uScene, suv - off * 1.07, lod).g;
  refr.b = textureLod(uScene, suv - off * 1.15, lod).b;

  float sd = sdRound(vObj.xy, uSize.xy * .5, uRadius);
  float edge = exp(sd / (uSize.x * .045));
  float edgeWide = exp(sd / (uSize.x * .07));
  float yN = tuv.y;

  vec3 inner = mix(uTintB, uTintA, smoothstep(0., 1., yN));
  float g = uGlow * (1. + uHover * .6);

  vec3 col = refr * vec3(.94, 1.01, 1.05) * mix(1.04 + .12 * g, .92 + .08 * g, uClear);
  col += inner * (.018 + .03 * g) * (1. - yN * .6);
  col += mix(uTintA, vec3(1.), .3) * edge * (.22 + .42 * g);
  col += mix(uTintA, uTintB, .35) * edgeWide * (.03 + .05 * g);
  col += vec3(.85, .95, 1.) * fres * (.16 + .26 * g);

  // light sweep across the face
  float diag = tuv.x * .8 - tuv.y * .55;
  float sp = fract(uTime * .055 + uSeed * .1) * 3.2 - 1.3;
  float sweep = exp(-pow((diag - sp) * 7., 2.));
  col += vec3(.75, .92, 1.) * sweep * .2 * front;

  // etched typography (emissive, slightly refracted)
  vec2 txu = tuv + nV.xy * .004;
  float tx = texture2D(uText, txu).r;
  float txb = textureLod(uText, txu, 3.).r;
  col += vec3(.86, .96, 1.) * (tx * (1.1 + .6 * g) + txb * .45 * g) * front;

  // sparkles caught inside the glass
  vec2 sg = tuv * vec2(46., 80.);
  vec2 id = floor(sg);
  float h = hash12(id + uSeed);
  float tw = pow(.5 + .5 * sin(uTime * (1.5 + h * 3.) + h * 40.), 12.);
  float sdot = exp(-dot(fract(sg) - .5, fract(sg) - .5) * 60.);
  col += vec3(.9, .96, 1.) * step(.975, h) * tw * sdot * 1.6 * front;

  col *= uTone;
  col = mix(refr, col, uIntro);

  // ---- emerging from the water: wavy waterline, submerged part seen through water, meniscus ----
  if (uWaterY > -1e4) {
    float wl = uWaterY + sin(vW.x * 22. + uTime * 2.1) * .006 + sin(vW.x * 47. - uTime * 3.3) * .003 + sin(vW.z * 30. + uTime * 1.7) * .004;
    float under = smoothstep(wl + .006, wl - .03, vW.y);
    vec2 wob = vec2(sin(vW.y * 90. + uTime * 2.5) * .004 + sin(vW.x * 60. - uTime * 1.8) * .003, 0.);
    // what you see below the surface is the river itself, the glass only a faint ghost just under it
    vec3 water = textureLod(uScene, suv + wob * .6, 0.).rgb;
    float depthBelow = smoothstep(0., uSize.y * .035, wl - vW.y);
    vec3 submerged = mix(col * .9, water, .55 + .45 * depthBelow);
    col = mix(col, submerged, under);
    float men = exp(-abs(vW.y - wl) / .007);
    col += mix(uTintA, vec3(1.), .5) * men * .32 * uIntro;
  }
  gl_FragColor = vec4(col, 1.);
}`;

export function makeTextTexture(kind, w = 1024, h = 1820) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const spaced = (txt, cx, cy, size, weight, track) => {
    x.font = `${weight} ${size}px "Clash Display", sans-serif`;
    const chars = [...txt];
    const widths = chars.map((ch) => x.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
    let px = cx - total / 2;
    chars.forEach((ch, i) => { x.fillText(ch, px + widths[i] / 2, cy); px += widths[i] + track; });
  };
  if (kind === 'soul') {
    spaced('ABDULLAH', w / 2, h * 0.44, w * 0.098, 400, w * 0.034);
    spaced('DESIGN', w / 2, h * 0.53, w * 0.037, 400, w * 0.03);
    spaced('DEVELOP', w / 2, h * 0.563, w * 0.037, 400, w * 0.03);
    spaced('CREATE', w / 2, h * 0.596, w * 0.037, 400, w * 0.03);
    x.fillRect(w * 0.44, h * 0.64, w * 0.12, Math.max(2, w * 0.003));
  } else {
    x.textAlign = 'left';
    x.font = `600 ${w * 0.25}px "Clash Display", sans-serif`;
    x.fillText('Hey.', w * 0.13, h * 0.42);
    // circular arrow button
    const r = w * 0.085, cx = w * 0.76, cy = h * 0.74;
    x.lineWidth = w * 0.008; x.strokeStyle = '#fff';
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
    x.lineWidth = w * 0.01; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(cx - r * 0.35, cy + r * 0.35); x.lineTo(cx + r * 0.35, cy - r * 0.35);
    x.moveTo(cx - r * 0.15, cy - r * 0.35); x.lineTo(cx + r * 0.35, cy - r * 0.35); x.lineTo(cx + r * 0.35, cy + r * 0.15);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Soft mirrored silhouette of the glass used for its rippled reflection on water. */
export function makeReflectionTexture(kind) {
  const w = 256, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  const pad = w * 0.18, r = w * 0.1;
  const bw = w - pad * 2, bh = kind === 'soul' ? h * 0.92 : (w - pad * 2);
  x.filter = 'blur(10px)';
  const grad = x.createLinearGradient(0, 0, 0, bh);
  grad.addColorStop(0, 'rgba(190,245,255,0.95)');
  grad.addColorStop(0.5, 'rgba(160,190,255,0.45)');
  grad.addColorStop(1, 'rgba(200,157,255,0.1)');
  x.fillStyle = grad;
  x.beginPath(); x.roundRect(pad, 0, bw, bh, r); x.fill();
  x.filter = 'blur(3px)';
  x.strokeStyle = 'rgba(230,252,255,0.95)'; x.lineWidth = 6;
  x.beginPath(); x.roundRect(pad, 2, bw, bh, r); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Glass {
  constructor(kind, sizeW, sizeH, sizeD, opts = {}) {
    const radius = Math.min(sizeW, sizeH) * (opts.radius ?? 0.14);
    this.kind = kind;
    this.geometry = new RoundedBoxGeometry(sizeW, sizeH, sizeD, 8, radius);
    this.uniforms = {
      uScene: { value: null },
      uText: { value: makeTextTexture(kind, 1024, kind === 'soul' ? Math.round(1024 * sizeH / sizeW) : 1024) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSize: { value: new THREE.Vector3(sizeW, sizeH, sizeD) },
      uRadius: { value: radius },
      uTime: { value: 0 },
      uGlow: { value: opts.glow ?? 1 },
      uHover: { value: 0 },
      uIntro: { value: 0 },
      uTone: { value: opts.tone ?? 1 },
      uClear: { value: opts.clear ? 1 : 0 },
      uWaterY: { value: -1e5 },
      uSeed: { value: Math.random() * 10 },
      uTintA: { value: new THREE.Color(opts.tintA ?? 0x9feeff) },
      uTintB: { value: new THREE.Color(opts.tintB ?? 0xc89dff) },
    };
    this.material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.reflection = makeReflectionTexture(kind);
    this.size = { w: sizeW, h: sizeH, d: sizeD };
    this.hover = 0;
    this.targetHover = 0;
  }
  rebuild(sizeW, sizeH, sizeD, radiusK = 0.14) {
    this.geometry.dispose();
    const radius = Math.min(sizeW, sizeH) * radiusK;
    this.geometry = new RoundedBoxGeometry(sizeW, sizeH, sizeD, 8, radius);
    this.mesh.geometry = this.geometry;
    this.uniforms.uSize.value.set(sizeW, sizeH, sizeD);
    this.uniforms.uRadius.value = radius;
    this.size = { w: sizeW, h: sizeH, d: sizeD };
  }
}
