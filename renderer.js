// WebGL2 renderer for the GTA2 browser port (D07).
//
// The game core produces one draw list per presented frame (port/render/
// frame.h): 24-byte vertices in the game's reference space and 40-byte
// commands (triangle batches or clears). This draws them in order,
// with no depth buffer, matching the original driver's texture/diffuse
// modulation and its three blend modes.
//
// The reference space is always 480 high. Its width comes with each frame:
// 640 for menus and other 4:3 screens (pillarboxed), or the widescreen view
// width for gameplay frames.

import { registerDict, t } from './strings.js?v=11ff9757d2';

registerDict({
  en: {
    'ui.render.shaderCompile': 'shader compile failed: {log}',
    'ui.render.shaderLink': 'shader link failed: {log}',
    'ui.render.noWebgl2': 'WebGL2 is not available in this browser',
  },
  es: {
    'ui.render.shaderCompile': 'falló la compilación del shader: {log}',
    'ui.render.shaderLink': 'falló el enlazado del shader: {log}',
    'ui.render.noWebgl2': 'WebGL2 no está disponible en este navegador',
  },
  fr: {
    'ui.render.shaderCompile': 'échec de la compilation du shader : {log}',
    'ui.render.shaderLink': 'échec de l’édition de liens du shader : {log}',
    'ui.render.noWebgl2': "WebGL2 n'est pas disponible dans ce navigateur",
  },
});

const REF_W = 640;
const REF_H = 480;
const VERTEX_BYTES = 24;
const COMMAND_BYTES = 40;
const BLEND_OPAQUE = 0;
const BLEND_ALPHA = 1;
const BLEND_ADDITIVE = 2;

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPos;   // reference-space pixels
layout(location = 1) in float aRhw;  // reciprocal W from the game
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec4 aColour;
uniform vec4 uView;                  // xy: scale, zw: offset (reference px -> NDC)
out vec2 vUv;
out vec4 vColour;
void main() {
  // Clip-space W = 1/rhw gives perspective-correct texturing, as the
  // original pre-transformed vertices did.
  float w = 1.0 / max(aRhw, 1e-6);
  vec2 ndc = aPos * uView.xy + uView.zw;
  gl_Position = vec4(ndc * w, 0.0, w);
  vUv = aUv;
  vColour = aColour;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec4 vColour;
uniform sampler2D uTexture;
uniform int uBlend;
layout(location = 0) out vec4 outColour;
layout(location = 1) out vec4 outDepth;  // GTA2 Pocket: Tiefe (rhw) für Schatten/AO
uniform int uSmooth;                      // GTA2 Pocket: HD-Glättung (weich statt Pixeltreppen)
vec4 smoothTex(vec2 uv) {
  ivec2 sz = textureSize(uTexture, 0);
  vec2 p = uv * vec2(sz) - 0.5;
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  ivec2 m = sz - 1;
  vec4 a = texelFetch(uTexture, clamp(i, ivec2(0), m), 0);
  vec4 b = texelFetch(uTexture, clamp(i + ivec2(1, 0), ivec2(0), m), 0);
  vec4 c = texelFetch(uTexture, clamp(i + ivec2(0, 1), ivec2(0), m), 0);
  vec4 d = texelFetch(uTexture, clamp(i + ivec2(1, 1), ivec2(0), m), 0);
  float wa = (1.0 - f.x) * (1.0 - f.y) * step(0.5, a.a), wb = f.x * (1.0 - f.y) * step(0.5, b.a);
  float wc = (1.0 - f.x) * f.y * step(0.5, c.a), wd = f.x * f.y * step(0.5, d.a);
  float al = wa + wb + wc + wd;
  vec3 col = (a.rgb * wa + b.rgb * wb + c.rgb * wc + d.rgb * wd) / max(al, 1e-4);
  return vec4(col, al);
}
void main() {
  vec4 t = uSmooth == 1 ? smoothTex(vUv) : texture(uTexture, vUv);
  if (t.a < 0.5) discard;                 // palette colour 0 is transparent
  if (uSmooth == 1) t.a = 1.0;
  vec3 rgb = t.rgb * vColour.rgb;         // texture * diffuse
  float a = uBlend == 1 ? t.a * vColour.a : 1.0;
  outColour = vec4(rgb, a);
  float dv = clamp(gl_FragCoord.w * 2.0, 0.0, 0.99998) * 255.0;
  // HUD (rhw ~ 0) löscht die Tiefe darunter, damit Anzeigen nie abgedunkelt werden
  outDepth = gl_FragCoord.w < 0.005 ? vec4(0.0, 0.0, 0.0, 1.0) : (uBlend == 0 ? vec4(floor(dv) / 255.0, fract(dv), 0.0, 1.0) : vec4(0.0));
}`;

const POST_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// GTA2 Pocket: realistischere Beleuchtung aus der Tiefe: Gebäudeschatten, Umgebungsverdeckung (AO), leichtes Leuchten
const POST_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uDepth;
uniform vec2 uPx;      // 1 / Canvas-Größe
uniform float uScale;  // Canvas-Pixel pro Referenzpixel
uniform float uLevel;  // 1 = Modern, 2 = Ultra
uniform int uHasDepth;
out vec4 outColour;
float dist(vec2 uv) { vec2 e = texture(uDepth, uv).rg; float r = (e.r * 255.0 + e.g) / 255.0 * 0.5; return r > 0.005 ? 1.0 / r : -1.0; }
void main() {
  vec3 c = texture(uScene, vUv).rgb;
  if (uHasDepth == 1) {
    float d = dist(vUv);
    if (d > 0.0) {
      // Sonne von oben links: Schatten fallen nach unten rechts
      vec2 dir = normalize(vec2(-1.0, 1.0)) * uPx * (3.5 * uScale);
      float sh = 0.0;
      for (int k = 1; k <= 18; k++) {
        float o = dist(vUv + dir * float(k));
        if (o > 0.0) sh = max(sh, smoothstep(0.0, 0.25, (d - o) - float(k) * 0.2));
      }
      // Umgebungsverdeckung: dunkler, wo es neben höheren Flächen liegt
      float occ = 0.0;
      float rad = 7.0 * uScale;
      for (int i = 0; i < 8; i++) {
        float ang = float(i) * 0.785398;
        vec2 off = vec2(cos(ang), sin(ang)) * uPx * rad;
        float o = dist(vUv + off), o2 = dist(vUv + off * 0.5);
        if (o > 0.0) occ += smoothstep(0.05, 0.8, d - o);
        if (o2 > 0.0) occ += smoothstep(0.05, 0.8, d - o2);
      }
      occ /= 16.0;
      float shade = (1.0 - sh * (0.42 + 0.12 * uLevel)) * (1.0 - occ * (0.55 + 0.2 * uLevel));
      c *= shade;
    }
  }
  // feine Schärfe und dezentes Leuchten nur sehr heller Stellen (Lichter, Neon, Feuer)
  vec3 n = texture(uScene, vUv + vec2(uPx.x, 0.0)).rgb + texture(uScene, vUv - vec2(uPx.x, 0.0)).rgb
         + texture(uScene, vUv + vec2(0.0, uPx.y)).rgb + texture(uScene, vUv - vec2(0.0, uPx.y)).rgb;
  c += (texture(uScene, vUv).rgb - n * 0.25) * 0.12 * uLevel;
  vec3 b = textureLod(uScene, vUv, 3.0).rgb * 0.5 + textureLod(uScene, vUv, 5.0).rgb * 0.5;
  c += max(b - 0.7, 0.0) * (0.35 + 0.35 * uLevel);
  outColour = vec4(c, 1.0);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(t('ui.render.shaderCompile', { log: gl.getShaderInfoLog(shader) }));
  }
  return shader;
}

export class Gta2Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error(t('ui.render.noWebgl2'));
    this.gl = gl;
    this.module = null;
    this.textures = new Map();
    this.stats = { frames: 0, drawCalls: 0, vertices: 0, textures: 0 };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(t('ui.render.shaderLink', { log: gl.getProgramInfoLog(program) }));
    }
    this.program = program;
    this.uView = gl.getUniformLocation(program, 'uView');
    this.uBlend = gl.getUniformLocation(program, 'uBlend');
    this.uSmooth = gl.getUniformLocation(program, 'uSmooth');
    try { this.smooth = localStorage.getItem('gta2-smooth') === '1'; } catch { this.smooth = false; }
    window.GTA2_setSmooth = (on) => { this.smooth = !!on; try { localStorage.setItem('gta2-smooth', on ? '1' : '0'); } catch {} };
    window.GTA2_smooth = () => this.smooth;
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, VERTEX_BYTES, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, VERTEX_BYTES, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, VERTEX_BYTES, 12);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, VERTEX_BYTES, 20);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    // Nachbearbeitung
    this.post = 0;
    try { this.post = +(localStorage.getItem('gta2-gfx') || 1); } catch { this.post = 1; }
    try {
      const pp = gl.createProgram();
      gl.attachShader(pp, compile(gl, gl.VERTEX_SHADER, POST_VS));
      gl.attachShader(pp, compile(gl, gl.FRAGMENT_SHADER, POST_FS));
      gl.linkProgram(pp);
      if (!gl.getProgramParameter(pp, gl.LINK_STATUS)) throw new Error('post link');
      this.postProgram = pp;
      this.uPx = gl.getUniformLocation(pp, 'uPx');
      this.uLevel = gl.getUniformLocation(pp, 'uLevel');
      this.uScaleP = gl.getUniformLocation(pp, 'uScale');
      this.uHasDepth = gl.getUniformLocation(pp, 'uHasDepth');
      gl.useProgram(pp);
      gl.uniform1i(gl.getUniformLocation(pp, 'uScene'), 0);
      gl.uniform1i(gl.getUniformLocation(pp, 'uDepth'), 1);
      gl.useProgram(program);
      this.depthOk = true; // RGBA8-kodierte Tiefe: läuft auf allen Geräten
      this.depthTex = gl.createTexture();
      this.postVao = gl.createVertexArray();
      this.fbo = gl.createFramebuffer();
      this.fboTex = gl.createTexture();
      this.fboW = 0; this.fboH = 0;
    } catch { this.postProgram = null; }
    window.GTA2_setGraphics = (lvl) => { this.post = lvl; try { localStorage.setItem('gta2-gfx', String(lvl)); } catch {} };
    window.GTA2_graphics = () => this.post;
    window.GTA2_gfxInfo = () => ({ post: !!this.postProgram, shadows: !!(this.postProgram && this.depthOk) });
    this.resize();
  }

  /** Fits a refW x 480 reference view into the canvas (letter- or pillarboxed). */
  resize(refW = REF_W) {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const scale = Math.min(w / refW, h / REF_H);
    this.viewport = {
      w: Math.round(refW * scale),
      h: Math.round(REF_H * scale),
    };
    this.viewport.x = Math.floor((w - this.viewport.w) / 2);
    this.viewport.y = Math.floor((h - this.viewport.h) / 2);
    this.scale = scale;
  }

  uploadTexture(id, width, height, rgba) {
    const gl = this.gl;
    let tex = this.textures.get(id);
    if (!tex) {
      tex = gl.createTexture();
      this.textures.set(id, tex);
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.stats.textures = this.textures.size;
  }

  /** Quick load: the game uploads every texture it holds again. */
  freeAllTextures() {
    for (const tex of this.textures.values()) this.gl.deleteTexture(tex);
    this.textures.clear();
  }

  freeTexture(id) {
    const tex = this.textures.get(id);
    if (tex) {
      this.gl.deleteTexture(tex);
      this.textures.delete(id);
    }
  }

  setBlend(mode) {
    const gl = this.gl;
    if (mode === this.blend) return;
    this.blend = mode;
    gl.uniform1i(this.uBlend, mode);
    if (mode === BLEND_OPAQUE) {
      gl.disable(gl.BLEND);
    } else if (mode === BLEND_ALPHA) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
    }
  }

  /** Called from the core (render/frame.cpp) with pointers into wasm memory. */
  present(cmdPtr, cmdCount, vertPtr, vertCount, refW = REF_W) {
    const gl = this.gl;
    const heap = this.module.HEAPU8;
    this.resize(refW);
    this.refW = refW;
    const vp = this.viewport;
    const usePost = this.post > 0 && this.postProgram;
    if (usePost) {
      const W = this.canvas.width, H = this.canvas.height;
      if (W !== this.fboW || H !== this.fboH) {
        gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
        if (this.depthOk) {
          gl.bindTexture(gl.TEXTURE_2D, this.depthTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.depthTex, 0);
          gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
          if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { this.depthOk = false; gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, null, 0); gl.drawBuffers([gl.COLOR_ATTACHMENT0]); }
        }
        this.fboW = W; this.fboH = H;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // The bars outside the view keep whatever the last wider frame left there.
    gl.disable(gl.SCISSOR_TEST);
    const mrt = usePost && this.depthOk;
    if (mrt) { gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 1]); gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]); }
    else { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.viewport(vp.x, vp.y, vp.w, vp.h);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, heap.subarray(vertPtr, vertPtr + vertCount * VERTEX_BYTES), gl.STREAM_DRAW);
    gl.uniform4f(this.uView, 2 / refW, -2 / REF_H, -1, 1);
    gl.uniform1i(this.uSmooth, this.smooth ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    this.blend = -1;

    const cmds = new DataView(heap.buffer, cmdPtr, cmdCount * COMMAND_BYTES);
    let drawCalls = 0;
    for (let i = 0; i < cmdCount; i++) {
      const o = i * COMMAND_BYTES;
      const kind = cmds.getUint32(o, true);
      if (kind === 1) {
        const colour = cmds.getUint32(o + 20, true);
        const l = cmds.getInt32(o + 24, true);
        const t = cmds.getInt32(o + 28, true);
        const r = cmds.getInt32(o + 32, true);
        const b = cmds.getInt32(o + 36, true);
        gl.enable(gl.SCISSOR_TEST);
        if (r > l && b > t) {
          gl.scissor(vp.x + Math.floor(l * this.scale), vp.y + Math.floor((REF_H - b) * this.scale),
            Math.ceil((r - l) * this.scale), Math.ceil((b - t) * this.scale));
        } else {
          gl.scissor(0, 0, this.canvas.width, this.canvas.height);
        }
        const cc = [(colour & 255) / 255, ((colour >> 8) & 255) / 255, ((colour >> 16) & 255) / 255, 1];
        if (mrt) { gl.clearBufferfv(gl.COLOR, 0, cc); gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]); }
        else { gl.clearColor(cc[0], cc[1], cc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); }
        gl.disable(gl.SCISSOR_TEST);
        continue;
      }
      const tex = this.textures.get(cmds.getUint32(o + 4, true));
      if (!tex) continue;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      this.setBlend(cmds.getUint32(o + 8, true));
      gl.drawArrays(gl.TRIANGLES, cmds.getUint32(o + 12, true), cmds.getUint32(o + 16, true));
      drawCalls++;
    }
    if (usePost) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.BLEND);
      this.blend = -1;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.useProgram(this.postProgram);
      gl.uniform2f(this.uPx, 1 / this.canvas.width, 1 / this.canvas.height);
      gl.uniform1f(this.uLevel, this.post);
      gl.uniform1f(this.uScaleP, this.scale || 1);
      gl.uniform1i(this.uHasDepth, mrt ? 1 : 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mrt ? this.depthTex : null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindVertexArray(this.postVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(this.program);
    }
    this.stats.frames++;
    this.stats.drawCalls = drawCalls;
    this.stats.vertices = vertCount;
  }
}
