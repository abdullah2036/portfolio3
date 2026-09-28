import { createGL, dpr, NOISE_GLSL, program, uniforms } from './util'

/**
 * An aurora ribbon: a twisting band of fine light strands drawn along a
 * spline. `head` / `tail` (0..1 along the path) let scroll draw it on and
 * carry it away, which is how the hero's aurora "travels" into the next scene.
 *
 * Two additive passes: a wide soft glow, then the sharp strand pass.
 * Renders on demand only — there is no idle loop.
 */

const VS = /* glsl */ `#version 300 es
in vec2 aPos;
in vec2 aNormal;
in float aS;
in float aV;
uniform vec2 uRes;
uniform float uWidth;
uniform float uTwist;
uniform float uPhase;
uniform float uSpread;
out float vS;
out float vV;
out float vTw;
void main() {
  float env = pow(sin(3.14159265 * clamp(aS, 0.0, 1.0)), 0.5);
  float tw = cos(aS * uTwist * 6.2831853 + uPhase);
  float hw = uWidth * env * (0.18 + 0.82 * abs(tw)) * uSpread;
  vec2 p = aPos + aNormal * aV * hw;
  vS = aS;
  vV = aV;
  vTw = tw;
  vec2 clip = p / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const FS = /* glsl */ `#version 300 es
precision highp float;
uniform float uHead;
uniform float uTail;
uniform float uTime;
uniform float uIntensity;
uniform float uSeed;
uniform float uGlow;
in float vS;
in float vV;
in float vTw;
out vec4 outColor;
${NOISE_GLSL}

void main() {
  float v = vV;
  float s = vS;
  float n = fbm(vec2(s * 2.2 + uSeed + uTime * 0.03, v * 0.9));
  float n2 = fbm(vec2(s * 5.0 + uSeed * 1.7 + uTime * 0.05, v * 2.2 + 3.0));
  // silk folds: the across-coordinate is warped by slow noise
  float w = v + (n - 0.5) * 0.62;

  // a soft sheet that reaches zero at its edges (no hard polygon borders)
  float prof = pow(max(1.0 - v * v, 0.0), 1.6);
  // luminous leading edge, like the board's light trails
  float lead = exp(-pow((w - 0.58) * 5.0, 2.0));
  // a few sparse filaments, appearing and fading along the length
  float fil = pow(abs(sin((w * 8.0 + n2 * 1.8) * 3.14159)), 40.0) * smoothstep(0.38, 0.72, n2);
  float fold = 1.0 - abs(vTw);
  float sheet = prof * (0.34 + 0.42 * n) + lead * 0.8 * prof + fil * 0.3 * prof;
  sheet *= 0.62 + fold * 0.95;
  float glow = pow(max(1.0 - v * v, 0.0), 2.4);
  float body = mix(sheet, glow, uGlow);

  vec3 blue = vec3(0.118, 0.435, 1.0);
  vec3 cyan = vec3(0.0, 0.83, 0.906);
  vec3 green = vec3(0.165, 0.84, 0.63);
  vec3 mint = vec3(0.655, 0.95, 0.70);
  vec3 lilac = vec3(0.776, 0.643, 1.0);
  float a = clamp(w * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(lilac, blue, smoothstep(0.02, 0.3, a));
  col = mix(col, cyan, smoothstep(0.32, 0.55, a));
  col = mix(col, green, smoothstep(0.58, 0.78, a));
  col = mix(col, mint, smoothstep(0.84, 0.98, a) * 0.6);
  col = mix(col, blue, smoothstep(0.6, 1.0, s) * 0.3 * uGlow);
  col = mix(col, lilac, smoothstep(0.3, 0.0, s) * 0.2);

  float headSoft = 0.14;
  float vis = smoothstep(uHead + 0.001, uHead - headSoft, vS);
  vis *= smoothstep(uTail - 0.001, uTail + headSoft, vS);
  float ends = smoothstep(0.0, 0.06, vS) * smoothstep(1.0, 0.94, vS);
  float headGlow = exp(-pow((vS - uHead) * 16.0, 2.0)) * prof * step(vS, uHead + 0.03) * (1.0 - uGlow) * 0.35;
  float I = (body * vis + headGlow * step(uTail, vS)) * ends * uIntensity;
  outColor = vec4(col * I, I);
}`

export type Pt = [number, number]

export interface RibbonOptions {
  /** control points in 0..1 of the canvas box (y down) */
  points: Pt[]
  /** half-width in px at 1440 css px canvas width */
  width?: number
  twist?: number
  phase?: number
  seed?: number
  intensity?: number
  glow?: number
  segments?: number
  maxDpr?: number
}

function catmull(p: Pt[], t: number): Pt {
  const n = p.length - 1
  const f = Math.min(Math.max(t, 0), 1) * n
  const i = Math.min(Math.floor(f), n - 1)
  const u = f - i
  const p0 = p[Math.max(i - 1, 0)]
  const p1 = p[i]
  const p2 = p[i + 1]
  const p3 = p[Math.min(i + 2, n)]
  const u2 = u * u
  const u3 = u2 * u
  const c = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3)
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]
}

export class Ribbon {
  private gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private u: Record<string, WebGLUniformLocation | null>
  private vao: WebGLVertexArrayObject
  private buf: WebGLBuffer
  private count = 0
  private ro: ResizeObserver
  private cssW = 1
  private cssH = 1
  head = 1
  tail = 0
  time = 0
  phaseShift = 0
  private pending = 0

  constructor(private canvas: HTMLCanvasElement, private o: RibbonOptions) {
    const gl = createGL(canvas)
    if (!gl) throw new Error('WebGL2 unavailable')
    this.gl = gl
    this.prog = program(gl, VS, FS)
    this.u = uniforms(gl, this.prog, [
      'uRes', 'uWidth', 'uTwist', 'uPhase', 'uSpread', 'uHead', 'uTail', 'uTime', 'uIntensity', 'uSeed', 'uGlow',
    ] as const)
    this.vao = gl.createVertexArray()!
    this.buf = gl.createBuffer()!
    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    const stride = 6 * 4
    const attr = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(this.prog, name)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset)
    }
    attr('aPos', 2, 0)
    attr('aNormal', 2, 8)
    attr('aS', 1, 16)
    attr('aV', 1, 20)
    gl.bindVertexArray(null)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.resize()
  }

  private build() {
    const { points } = this.o
    const N = this.o.segments ?? 360
    const W = this.cssW
    const H = this.cssH
    const pts: Pt[] = []
    for (let i = 0; i <= N; i++) {
      const [x, y] = catmull(points, i / N)
      pts.push([x * W, y * H])
    }
    const data = new Float32Array((N + 1) * 2 * 6)
    let k = 0
    for (let i = 0; i <= N; i++) {
      const a = pts[Math.max(i - 1, 0)]
      const b = pts[Math.min(i + 1, N)]
      let tx = b[0] - a[0]
      let ty = b[1] - a[1]
      const l = Math.hypot(tx, ty) || 1
      tx /= l
      ty /= l
      const nx = -ty
      const ny = tx
      const s = i / N
      for (const v of [-1, 1]) {
        data[k++] = pts[i][0]
        data[k++] = pts[i][1]
        data[k++] = nx
        data[k++] = ny
        data[k++] = s
        data[k++] = v
      }
    }
    this.count = (N + 1) * 2
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  }

  resize() {
    const r = this.canvas.getBoundingClientRect()
    this.cssW = Math.max(1, r.width)
    this.cssH = Math.max(1, r.height)
    const d = dpr(this.o.maxDpr ?? 1.5)
    this.canvas.width = Math.round(this.cssW * d)
    this.canvas.height = Math.round(this.cssH * d)
    this.build()
    this.render()
  }

  setPoints(points: Pt[]) {
    this.o.points = points
    this.build()
    this.invalidate()
  }

  /** coalesce many scroll updates into one draw per frame */
  invalidate() {
    if (this.pending) return
    this.pending = requestAnimationFrame(() => {
      this.pending = 0
      this.render()
    })
  }

  render() {
    const gl = this.gl
    const o = this.o
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (this.head <= this.tail + 0.001) return
    gl.useProgram(this.prog)
    gl.bindVertexArray(this.vao)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    const scale = this.cssW / 1440
    gl.uniform2f(this.u.uRes, this.cssW, this.cssH)
    gl.uniform1f(this.u.uWidth, (o.width ?? 150) * Math.max(scale, 0.45))
    gl.uniform1f(this.u.uTwist, o.twist ?? 1.3)
    gl.uniform1f(this.u.uPhase, (o.phase ?? 0.6) + this.phaseShift)
    gl.uniform1f(this.u.uHead, this.head)
    gl.uniform1f(this.u.uTail, this.tail)
    gl.uniform1f(this.u.uTime, this.time)
    gl.uniform1f(this.u.uSeed, o.seed ?? 1)
    // pass 1: atmospheric glow
    gl.uniform1f(this.u.uSpread, 1.9)
    gl.uniform1f(this.u.uGlow, 1)
    gl.uniform1f(this.u.uIntensity, (o.intensity ?? 1) * (o.glow ?? 0.34))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count)
    // pass 2: strands
    gl.uniform1f(this.u.uSpread, 1)
    gl.uniform1f(this.u.uGlow, 0)
    gl.uniform1f(this.u.uIntensity, o.intensity ?? 1)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count)
    gl.bindVertexArray(null)
  }

  dispose() {
    cancelAnimationFrame(this.pending)
    this.ro.disconnect()
    this.gl.deleteBuffer(this.buf)
    this.gl.deleteVertexArray(this.vao)
    this.gl.deleteProgram(this.prog)
  }
}
