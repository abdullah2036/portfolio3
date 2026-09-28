import { createGL, dpr, NOISE_GLSL, program, uniforms } from './util'

/**
 * Renders a photographic aurora plate with the light itself brought to life:
 *  - curtains sway through a slow, mostly-horizontal flow displacement
 *  - rays drift upward along the curtains (luminance only, never hue)
 *  - the ice reflection mirrors the sky's motion with a faint ripple
 *  - `reveal` drives the intro: stars first, then light rising from the horizon
 *
 * Only pixels that are both bright and saturated (i.e. aurora) are displaced,
 * so mountains, the figure and the stars stay perfectly still.
 */

const VS = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uPos;
uniform float uTime;
uniform float uReveal;
uniform float uHorizon;
uniform float uAmp;
in vec2 vUv;
out vec4 outColor;
${NOISE_GLSL}

float auroraWeight(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = mx - mn;
  float lum = dot(c, vec3(0.3, 0.55, 0.15));
  return smoothstep(0.1, 0.38, sat) * smoothstep(0.12, 0.42, lum);
}

void main() {
  // object-fit: cover with object-position = uPos
  vec2 frag = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float s = max(uRes.x / uImg.x, uRes.y / uImg.y);
  vec2 size = uImg * s;
  vec2 off = (uRes - size) * uPos;
  vec2 uv = (frag - off) / size;

  float H = uHorizon;
  float water = smoothstep(H - 0.004, H + 0.012, uv.y);
  // sample the sky point this pixel reflects, so the reflection moves with it
  vec2 src = uv;
  src.y = mix(uv.y, H - (uv.y - H) * 1.35, water);

  vec3 base = texture(uTex, uv).rgb;
  float w = auroraWeight(base);

  float t = uTime;
  vec2 q = vec2(src.x * 3.1, src.y * 1.25);
  float n1 = fbm(q + vec2(t * 0.032, -t * 0.045));
  float n2 = fbm(q * 1.7 + vec2(-t * 0.027, t * 0.018) + 5.2);
  vec2 disp = vec2(n1 - 0.5, (n2 - 0.5) * 0.3) * uAmp;
  disp.y *= mix(1.0, -0.7, water);
  // surface ripple on the ice
  disp.x += sin(uv.y * 820.0 + t * 1.1 + n1 * 6.0) * 0.00055 * water;

  vec2 uv2 = uv + disp * w;
  vec3 col = texture(uTex, uv2).rgb;

  // rays travelling up the curtains
  float rays = fbm(vec2(src.x * 15.0 + n1 * 2.2, src.y * 1.1 - t * 0.11));
  float w2 = auroraWeight(col);
  col *= 1.0 + w2 * ((rays - 0.5) * 0.34 + 0.045 * sin(t * 0.37 + src.x * 2.0));

  // ── intro reveal ───────────────────────────────
  if (uReveal < 0.999) {
    vec3 blur = textureLod(uTex, uv, 3.2).rgb;
    vec3 detail = max(col - blur, 0.0);
    float starLum = dot(detail, vec3(0.33));
    // luminance only, tinted cool white: chroma noise in the high-pass must never read as coloured specks
    vec3 stars = vec3(0.86, 0.93, 1.0) * starLum * smoothstep(0.03, 0.14, starLum) * 2.6 * (1.0 - water);
    float r1 = smoothstep(0.0, 0.3, uReveal);
    float r2 = smoothstep(0.18, 1.0, uReveal);
    float d = abs(uv.y - H) * 1.1 + abs(uv.x - 0.52) * 0.25;
    float m = smoothstep(d, d + 0.42, r2 * 1.55 - 0.08);
    vec3 pre = stars * r1 + col * 0.035 * r1;
    col = mix(pre, col, m);
  }

  outColor = vec4(col, 1.0);
}`

export interface PlateOptions {
  horizon?: number
  position?: [number, number]
  amplitude?: number
  maxDpr?: number
}

export class AuroraPlate {
  private gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private u: Record<string, WebGLUniformLocation | null>
  private tex: WebGLTexture | null = null
  private img = { w: 1, h: 1 }
  private raf = 0
  private start = performance.now()
  private visible = true
  private running = false
  private ro: ResizeObserver
  private io: IntersectionObserver
  reveal = 1
  frozen = false
  position: [number, number]
  private horizon: number
  private amp: number
  private maxDpr: number
  ready = false
  private disposed = false

  constructor(private canvas: HTMLCanvasElement, opts: PlateOptions = {}) {
    const gl = createGL(canvas, { alpha: false })
    if (!gl) throw new Error('WebGL2 unavailable')
    this.gl = gl
    this.horizon = opts.horizon ?? 0.71
    this.position = opts.position ?? [0.5, 0.5]
    this.amp = opts.amplitude ?? 0.011
    this.maxDpr = opts.maxDpr ?? 1.5
    this.prog = program(gl, VS, FS)
    this.u = uniforms(gl, this.prog, ['uTex', 'uRes', 'uImg', 'uPos', 'uTime', 'uReveal', 'uHorizon', 'uAmp'] as const)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(this.prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.play()
    })
    this.io.observe(canvas)
  }

  async load(url: string) {
    const image = new Image()
    // `decode()` can stall indefinitely in background/throttled tabs; the load event can't
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error(`Failed to load ${url}`))
      image.src = url
      if (image.complete && image.naturalWidth) resolve()
    })
    if (this.disposed) return
    const gl = this.gl
    this.tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    if (this.disposed) return
    this.img = { w: image.naturalWidth, h: image.naturalHeight }
    this.ready = true
    this.resize()
    this.render()
  }

  resize() {
    const r = this.canvas.getBoundingClientRect()
    const d = dpr(this.maxDpr)
    const w = Math.max(1, Math.round(r.width * d))
    const h = Math.max(1, Math.round(r.height * d))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    if (!this.running) this.render()
  }

  render(time = (performance.now() - this.start) / 1000) {
    if (!this.ready || this.disposed) return
    const gl = this.gl
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(this.prog)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.uniform1i(this.u.uTex, 0)
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform2f(this.u.uImg, this.img.w, this.img.h)
    gl.uniform2f(this.u.uPos, this.position[0], this.position[1])
    gl.uniform1f(this.u.uTime, time + 40)
    gl.uniform1f(this.u.uReveal, this.reveal)
    gl.uniform1f(this.u.uHorizon, this.horizon)
    gl.uniform1f(this.u.uAmp, this.frozen ? 0 : this.amp)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  play() {
    if (this.running || this.frozen) return
    this.running = true
    let last = 0
    const loop = (now: number) => {
      if (!this.visible || document.hidden) {
        this.running = false
        return
      }
      // ~40fps is plenty for motion this slow and halves GPU cost
      if (now - last > 24) {
        last = now
        this.render()
      }
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.running = false
  }

  dispose() {
    this.disposed = true
    this.stop()
    this.ro.disconnect()
    this.io.disconnect()
    if (this.tex) this.gl.deleteTexture(this.tex)
    this.gl.deleteProgram(this.prog)
  }
}
