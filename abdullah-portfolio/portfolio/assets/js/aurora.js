/* ──────────────────────────────────────────────────────────────
   Aurora sky — a procedural WebGL background (no images, so it is
   sharp at any resolution) plus a crisp 2D star layer.
   state.mode: 0 = dawn (your side) → 1 = night (my side)
   Quality adapts to the device: if frames get slow, the shader
   renders at a lower internal scale (the aurora is soft, so this is
   invisible) and eventually caps to 30 fps.
   ────────────────────────────────────────────────────────────── */
(() => {
  const VERT = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uTime;
    uniform float uMode;
    uniform vec2  uMouse;
    uniform float uLift;   // pushes the curtains up and out of the reading area
    uniform float uAmp;    // how wavy the curtains are
    uniform float uShift;  // moves through the noise field: a new formation per section
    uniform float uDim;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

    // 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT). Gradient noise has no
    // grid-aligned plateaus, so the rays stay silky instead of blocky.
    vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x  = a0.x  * x0.x   + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    float noise(vec2 p){ return 0.5 + 0.5 * snoise(p); }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 r = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++){ v += a * noise(p); p = r * p; a *= 0.5; }
      return v;
    }

    // One aurora curtain. d = height above the curtain's lower edge.
    float curtain(vec2 uv, float t, float base, float amp, float freq, float seed, float thick, out float d){
      float x = uv.x;
      float w = base + amp * sin(x * freq + t * 0.07 + seed)
                     + amp * 1.1 * (fbm(vec2(x * 0.85 + seed, t * 0.035)) - 0.5);
      d = uv.y - w;
      float edge = smoothstep(-thick * 0.16, thick * 0.06, d);
      float tail = exp(-max(d, 0.0) / thick);
      float rays = fbm(vec2(x * 5.0 + seed * 5.0, d * 0.7 - t * 0.05));
      rays = 0.45 + 0.9 * smoothstep(0.3, 0.8, rays);
      float breathe = 0.78 + 0.22 * sin(t * 0.21 + seed * 2.3);
      return edge * tail * rays * breathe;
    }

    void main(){
      vec2 frag = gl_FragCoord.xy;
      vec2 uv = frag / uRes.y;
      vec2 sn = frag / uRes;
      uv += uMouse * vec2(0.035, 0.018);
      uv.x += uShift;
      float t = uTime;
      float lift = uLift;

      float d1, d2, d3;
      float a1 = curtain(uv, t,        0.52 + lift, 0.090 * uAmp, 1.25, 1.3 + uShift * 0.7, 0.22, d1);
      float a2 = curtain(uv, t * 1.1,  0.66 + lift, 0.070 * uAmp, 1.70, 4.1 - uShift * 0.5, 0.16, d2);
      float a3 = curtain(uv, t * 0.8,  0.80 + lift, 0.055 * uAmp, 2.10, 7.7 + uShift * 0.3, 0.12, d3);

      // ── night (my side) ──
      vec3 green  = vec3(0.165, 0.839, 0.627);
      vec3 cyan   = vec3(0.000, 0.831, 0.906);
      vec3 blue   = vec3(0.118, 0.435, 1.000);
      vec3 violet = vec3(0.776, 0.643, 1.000);

      vec3 skyTop = vec3(0.016, 0.024, 0.078);
      vec3 skyLow = vec3(0.043, 0.063, 0.150);
      vec3 night  = mix(skyLow, skyTop, smoothstep(0.0, 1.0, sn.y));
      night += vec3(0.051, 0.231, 0.561) * 0.28 * exp(-sn.y * 3.2);

      vec3 c1 = mix(green, cyan, smoothstep(0.0, 0.22, d1));
      c1 = mix(c1, violet, smoothstep(0.18, 0.55, d1));
      vec3 c2 = mix(cyan, blue, smoothstep(0.0, 0.2, d2));
      c2 = mix(c2, violet, smoothstep(0.15, 0.45, d2));
      vec3 c3 = mix(violet, blue, smoothstep(0.0, 0.3, d3));

      vec3 aur = c1 * a1 * 1.05 + c2 * a2 * 0.75 + c3 * a3 * 0.5;
      night += aur * uDim;
      night = night / (1.0 + night * 0.22);
      float vig = smoothstep(1.25, 0.25, length(sn - vec2(0.5, 0.55)));
      night *= mix(0.72, 1.0, vig);

      // ── dawn (your side) ──
      // a muted blue-hour morning rather than bright white
      vec3 dTop = vec3(0.620, 0.700, 0.860);
      vec3 dMid = vec3(0.760, 0.800, 0.890);
      vec3 dLow = vec3(0.820, 0.820, 0.900);
      vec3 dawn = mix(dLow, dMid, smoothstep(0.0, 0.45, sn.y));
      dawn = mix(dawn, dTop, smoothstep(0.45, 1.0, sn.y));
      dawn = mix(dawn, vec3(0.800, 0.880, 0.870), 0.30 * exp(-sn.y * 4.0));

      vec3 mint  = vec3(0.435, 0.867, 0.706);
      vec3 aqua  = vec3(0.384, 0.831, 0.918);
      vec3 lilac = vec3(0.710, 0.608, 0.961);
      vec3 sky   = vec3(0.553, 0.690, 1.000);
      vec3 t1 = mix(mint, aqua, smoothstep(0.0, 0.22, d1));
      t1 = mix(t1, lilac, smoothstep(0.2, 0.55, d1));
      vec3 t2 = mix(aqua, sky, smoothstep(0.0, 0.25, d2));
      vec3 t3 = lilac;
      float k = uDim;
      dawn = mix(dawn, t1 * 0.92, clamp(a1 * 0.55 * k, 0.0, 0.55));
      dawn = mix(dawn, t2 * 0.92, clamp(a2 * 0.40 * k, 0.0, 0.40));
      dawn = mix(dawn, t3 * 0.92, clamp(a3 * 0.30 * k, 0.0, 0.30));

      vec3 col = mix(dawn, night, uMode);
      col += (hash(frag + fract(t)) - 0.5) / 255.0 * 1.6;   // dither: no banding
      gl_FragColor = vec4(col, 1.0);
    }`;

  const state = { mode: 1, lift: 0, amp: 1, shift: 0, mx: 0, my: 0, dim: 1, speed: 1 };
  let gl, prog, uni = {}, glCanvas, starCanvas, sctx;
  let scale = 0.55, frameCap = 60, running = true, reduced = false, ready = false;
  let t0 = performance.now(), last = 0, time = 0, samples = [], stars = [], shoot = null, nextShoot = 6;
  let smx = 0, smy = 0;

  function compile(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function resize(){
    const w = innerWidth, h = innerHeight;
    if (gl){
      glCanvas.width = Math.max(2, Math.round(w * scale));
      glCanvas.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }
    const dpr = Math.min(devicePixelRatio || 1, 2);
    starCanvas.width = Math.round(w * dpr); starCanvas.height = Math.round(h * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars(w, h);
  }

  function makeStars(w, h){
    const n = Math.round(Math.min(420, (w * h) / 5200));
    const tints = ["255,255,255", "205,245,255", "226,214,255", "214,255,238"];
    stars = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++){
      const big = rnd() > 0.965;
      stars.push({
        x: rnd() * w, y: Math.pow(rnd(), 1.35) * h * 0.95,
        r: big ? 1.1 + rnd() * 0.8 : 0.35 + rnd() * 0.75,
        a: 0.35 + rnd() * 0.65, s: 0.4 + rnd() * 1.6, p: rnd() * 6.28,
        z: 0.3 + rnd() * 0.7, c: tints[(rnd() * tints.length) | 0], big
      });
    }
  }

  function drawStars(dt){
    const w = innerWidth, h = innerHeight;
    sctx.clearRect(0, 0, w, h);
    const vis = Math.max(0, (state.mode - 0.25) / 0.75);
    if (vis <= 0.01) return;
    const ox = -smx * 14 - state.shift * 60, oy = -smy * 8 - state.lift * 120;
    for (const s of stars){
      const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(time * s.s + s.p);
      const a = s.a * tw * vis;
      const x = s.x + ox * s.z, y = ((s.y + oy * s.z) % h + h) % h;
      if (s.big){
        const g = sctx.createRadialGradient(x, y, 0, x, y, s.r * 5);
        g.addColorStop(0, `rgba(${s.c},${a * 0.55})`); g.addColorStop(1, `rgba(${s.c},0)`);
        sctx.fillStyle = g; sctx.beginPath(); sctx.arc(x, y, s.r * 5, 0, 6.2832); sctx.fill();
      }
      sctx.fillStyle = `rgba(${s.c},${a})`;
      sctx.beginPath(); sctx.arc(x, y, s.r, 0, 6.2832); sctx.fill();
    }
    // an occasional shooting star, night only
    if (reduced || state.mode < 0.85) return;
    nextShoot -= dt;
    if (!shoot && nextShoot <= 0){
      const rtl = document.documentElement.dir === "rtl";
      shoot = { x: w * (0.2 + Math.random() * 0.6), y: h * (0.06 + Math.random() * 0.25), life: 0, dir: rtl ? -1 : 1 };
      nextShoot = 9 + Math.random() * 10;
    }
    if (shoot){
      shoot.life += dt / 1.1;
      const p = shoot.life, len = 140;
      const x = shoot.x + shoot.dir * p * 420, y = shoot.y + p * 170;
      const fade = Math.sin(Math.min(1, p) * Math.PI);
      const g = sctx.createLinearGradient(x, y, x - shoot.dir * len, y - len * 0.4);
      g.addColorStop(0, `rgba(233,248,255,${0.9 * fade})`); g.addColorStop(1, "rgba(233,248,255,0)");
      sctx.strokeStyle = g; sctx.lineWidth = 1.4; sctx.lineCap = "round";
      sctx.beginPath(); sctx.moveTo(x, y); sctx.lineTo(x - shoot.dir * len, y - len * 0.4); sctx.stroke();
      if (p >= 1) shoot = null;
    }
  }

  // Quality ladder: drop internal resolution first (invisible on a soft aurora),
  // then frame rate. Climb back up when the device has headroom.
  function adapt(ms){
    samples.push(ms);
    if (samples.length < (frameCap < 60 ? 20 : 40)) return;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    samples = [];
    if (avg > 22){
      if (scale > 0.3){ scale = Math.max(0.3, scale - 0.1); resize(); }
      else if (frameCap > 30){ frameCap = 30; }
      else if (scale > 0.18){ scale = 0.18; resize(); }
      else if (frameCap > 20){ frameCap = 20; }
    } else if (avg < 10 && frameCap === 60 && scale < 0.7){ scale = Math.min(0.7, scale + 0.05); resize(); }
  }

  function frame(now){
    requestAnimationFrame(frame);
    if (!running) { last = now; return; }
    const minGap = 1000 / frameCap - 2;
    if (now - last < minGap) return;
    const dtMs = Math.min(100, now - (last || now));
    last = now;
    const dt = dtMs / 1000;
    time += reduced ? 0 : dt * state.speed;
    smx += (state.mx - smx) * 0.05; smy += (state.my - smy) * 0.05;
    const tStart = performance.now();
    if (gl){
      gl.uniform2f(uni.uRes, glCanvas.width, glCanvas.height);
      gl.uniform1f(uni.uTime, time + 40.0);
      gl.uniform1f(uni.uMode, state.mode);
      gl.uniform2f(uni.uMouse, smx, smy);
      gl.uniform1f(uni.uLift, state.lift);
      gl.uniform1f(uni.uAmp, state.amp);
      gl.uniform1f(uni.uShift, state.shift);
      gl.uniform1f(uni.uDim, state.dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    drawStars(dt);
    if (!ready){ ready = true; api._resolve && api._resolve(); }
    if (!reduced) adapt(performance.now() - tStart + (dtMs > 40 ? 12 : 0));
  }

  const api = {
    state,
    ready: null,
    init(canvas, starsEl){
      glCanvas = canvas; starCanvas = starsEl; sctx = starsEl.getContext("2d");
      if (/[?&]qa\b/.test(location.search)){ scale = 0.12; frameCap = 20; }   // fast path for automated screenshots
      api.ready = new Promise(r => (api._resolve = r));
      try {
        gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
        if (!gl) throw new Error("no webgl");
        prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ["uRes", "uTime", "uMode", "uMouse", "uLift", "uAmp", "uShift", "uDim"].forEach(n => (uni[n] = gl.getUniformLocation(prog, n)));
      } catch (e){
        gl = null;
        document.documentElement.classList.add("no-webgl");
        console.warn("Aurora: WebGL unavailable, using CSS fallback.", e);
      }
      resize();
      addEventListener("resize", () => { clearTimeout(api._rt); api._rt = setTimeout(resize, 120); });
      document.addEventListener("visibilitychange", () => (running = !document.hidden));
      requestAnimationFrame(frame);
      return api.ready;
    },
    setReducedMotion(v){ reduced = v; },
    setPaused(v){ running = !v; }
  };

  window.Aurora = api;
})();
