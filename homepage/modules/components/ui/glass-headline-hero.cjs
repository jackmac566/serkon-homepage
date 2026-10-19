
"use strict";
/** Adapted from the user-supplied Glass Headline Hero. WebGL text mask, refraction and real semantic text are retained. */
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COLORS = void 0;
exports.hexToRgb = hexToRgb;
exports.paletteOf = paletteOf;
exports.splitWords = splitWords;
exports.bevelPx = bevelPx;
exports.formed = formed;
exports.fallbackBackground = fallbackBackground;
exports.follow = follow;
exports.orbit = orbit;
exports.default = GlassHeadlineHero;
const React = __importStar(require("react"));
// #region glass
exports.DEFAULT_COLORS = ["#0D0A14", "#FF5A1F", "#FF9EC1", "#2F4CFF", "#FFE6B8"];
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m)
        return null;
    const v = parseInt(m[1], 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}
/** Five colours as flat RGB triples; anything missing or malformed falls back to the default in that slot. */
function paletteOf(colors) {
    return exports.DEFAULT_COLORS.map((fallback, i) => hexToRgb(colors?.[i] ?? "") ?? hexToRgb(fallback));
}
function splitWords(title) {
    return title.trim().split(/\s+/).filter(Boolean);
}
/** Width of the glass bevel, in mask pixels: a share of the type size, never under 2px. */
function bevelPx(fontPx, scale) {
    return Math.max(2, fontPx * 0.075 * scale);
}
/** How far the glass has formed, t ms after it is ready: an ease-out from clear to full glass. */
function formed(t, ms) {
    const x = Math.min(Math.max(t / ms, 0), 1);
    return 1 - Math.pow(1 - x, 3);
}
/**
 * The same palette as a plain CSS background: what shows before the glass
 * fades in, and instead of it without WebGL2. rgba() throughout, because
 * one malformed colour drops the whole declaration and leaves white behind
 * white type.
 */
function fallbackBackground(palette) {
    const rgba = (c, a) => "rgba(" + c.map((v) => Math.round(v * 255)).join(",") + "," + a + ")";
    return ("radial-gradient(60% 50% at 25% 30%," + rgba(palette[1], 0.4) + ",transparent 70%)," +
        "radial-gradient(50% 45% at 78% 35%," + rgba(palette[3], 0.4) + ",transparent 70%)," +
        "radial-gradient(45% 40% at 60% 80%," + rgba(palette[2], 0.27) + ",transparent 70%)," +
        rgba(palette[0], 1));
}
/** Frame-rate-independent approach of `from` toward `to`. */
function follow(from, to, dt, rate) {
    return to + (from - to) * Math.exp(-rate * dt);
}
/** Where the light drifts when nobody is pointing: a slow Lissajous over the headline. */
function orbit(t) {
    return [0.5 + 0.32 * Math.sin(t * 0.37), 0.56 + 0.16 * Math.sin(t * 0.53 + 1.1)];
}
// #endregion
/** How long the glass takes to form on first paint. */
const FORM_MS = 1100;
/** The face's gentle dome comes from a blur this many times wider than the bevel's. */
const DOME = 3;
/** Seconds without pointer movement before the light goes back to drifting. */
const IDLE_S = 2.5;
/** Frame-time watchdog: this many frames slower than SLOW_FRAME_S switch to the light path. */
const SLOW_FRAME_S = 0.05;
const SLOW_FRAMES = 8;
/** A frame this slow is a software renderer, not a busy moment: it counts three times over. */
const CRAWL_FRAME_S = 0.15;
const VERT = `#version 300 es
in vec2 a_position;
out vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
const HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
`;
// The field behind the glass: domain-warped noise in the palette, with soft
// flowing bands. Smooth colour alone barely shows refraction; bands are what
// visibly bend as they pass behind a letter.
const FIELD = HEAD +
    `uniform float u_time;
uniform float u_aspect;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform float u_octaves;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    if (float(i) >= u_octaves) break;
    v += a * noise(p);
    p = turn * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(vUv.x * u_aspect, vUv.y) * 1.2;
  float t = u_time * 0.06;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 1.1));
  float f = fbm(p + 3.0 * r);

  // fbm rarely leaves 0.25..0.8, so the thresholds sit inside that range:
  // set wider, the field is mostly ground and the glass has nothing to bend.
  vec3 col = u_c0;
  col = mix(col, u_c3, smoothstep(0.25, 0.72, q.x) * 0.9);
  col = mix(col, u_c1, smoothstep(0.34, 0.74, f));
  col = mix(col, u_c2, smoothstep(0.42, 0.8, r.y) * 0.8);
  col = mix(col, u_c4, smoothstep(0.55, 0.9, f * r.x * 1.8) * 0.7);

  float bands = 0.5 + 0.5 * sin((f * 7.0 + r.x * 3.0) * 3.14159);
  col *= mix(0.86, 1.1, smoothstep(0.2, 0.8, bands));

  // A faint glow behind the headline: one focal point, and more light for
  // the glass to bend.
  vec2 g = (vUv - vec2(0.5, 0.56)) / vec2(0.5, 0.2);
  col += u_c4 * 0.07 * exp(-dot(g, g));

  // Quieter toward the foot, and a soft scrim where the description and
  // buttons sit, so body copy never lands on a busy patch.
  col *= mix(0.42, 1.0, smoothstep(0.02, 0.62, vUv.y));
  vec2 s = (vUv - vec2(0.5, 0.33)) / vec2(0.32, 0.13);
  col *= 1.0 - 0.4 * exp(-dot(s, s));
  o = vec4(col, 1.0);
}`;
// Separable gaussian over the headline mask, one channel per pass. R is the
// bevel (steep at the edge), B the dome that gives each face a little
// curvature, G carries the sharp mask through untouched.
//
// The dome is blurred from the already-blurred bevel, never from the mask:
// its taps sit ~3px apart, and sampling a sharp edge that coarsely aliases
// into a fine grid across every letter. A smooth input cannot alias.
const BLUR = HEAD +
    `uniform sampler2D u_src;
uniform vec2 u_step;
uniform float u_radius;
uniform float u_read;
uniform float u_write;
float pick(vec4 t) {
  // 0: the raw mask, ignoring faint anti-alias debris; 1: the bevel; 2: the dome.
  return u_read < 0.5 ? smoothstep(0.06, 1.0, t.r) : u_read < 1.5 ? t.r : t.b;
}
void main() {
  float sigma = max(u_radius * 0.5, 0.5);
  float sum = 0.0;
  float weights = 0.0;
  for (int i = -24; i <= 24; i++) {
    float x = float(i) * u_radius / 24.0;
    float w = exp(-0.5 * x * x / (sigma * sigma));
    sum += pick(texture(u_src, vUv + u_step * x)) * w;
    weights += w;
  }
  vec4 here = texture(u_src, vUv);
  float blurred = sum / weights;
  o = vec4(u_write < 0.5 ? blurred : here.r, here.g, u_write < 0.5 ? here.b : blurred, 1.0);
}`;
const GLASS = HEAD +
    `uniform sampler2D u_field;
uniform sampler2D u_height;
uniform vec2 u_htexel;
uniform float u_bevel;
uniform float u_aspect;
uniform vec2 u_light;
uniform float u_glass;
uniform float u_form;
uniform vec2 u_res;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// A rounded bevel, steep at the letter's edge, plus a gentle dome across the
// face. Flat faces read as panes of one tint, and a stem is a rectangle, so
// every stem looked like a box; the dome makes each one a volume.
float bevel(vec2 p) {
  vec4 t = texture(u_height, p);
  float x = clamp((t.r - 0.5) * 2.0, 0.0, 1.0);
  float edge = sqrt(1.0 - (1.0 - x) * (1.0 - x));
  float dome = clamp((t.b - 0.5) * 2.0, 0.0, 1.0);
  return edge * 0.8 + dome * 0.45;
}

void main() {
  vec2 uv = vUv;
  vec2 hv = texture(u_height, uv).rg;
  // Tight tracking overlaps glyphs, and the canvas leaves faint seams (a few
  // /255) along their edges. Counted as glass, they tint every glyph's box.
  float inside = smoothstep(0.08, 0.92, hv.g) * u_glass * u_form;

  // Slope from a Sobel stencil two texels wide. A bilinear height map has a
  // constant slope inside each texel that jumps at the texel edge; a narrow
  // difference hands those steps to the highlight, which turns them into a
  // fine dot grid across every face that faces the light.
  vec2 dx = vec2(u_htexel.x * 2.0, 0.0);
  vec2 dy = vec2(0.0, u_htexel.y * 2.0);
  float tl = bevel(uv - dx + dy);
  float tc = bevel(uv + dy);
  float tr = bevel(uv + dx + dy);
  float ml = bevel(uv - dx);
  float mr = bevel(uv + dx);
  float bl = bevel(uv - dx - dy);
  float bc = bevel(uv - dy);
  float br = bevel(uv + dx - dy);
  vec2 grad = vec2((tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl), (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br)) / 16.0 * u_bevel;
  vec3 n = normalize(vec3(-grad * 0.9, 1.0));

  // Light sits above the stage at the pointer.
  vec2 toLight = (u_light - uv) * vec2(u_aspect, 1.0);
  vec3 L = normalize(vec3(toLight, 0.45));
  vec3 halfway = normalize(L + vec3(0.0, 0.0, 1.0));
  float facing = max(dot(n, halfway), 0.0);
  // Two highlights: a pin of light and a soft sheen around it. One broad lobe
  // reads as plastic.
  float pin = pow(facing, 160.0);
  float sheen = pow(facing, 24.0);
  float rim = pow(1.0 - n.z, 2.0);
  // A studio light from above: upper bevels catch it, lower ones fall away.
  float studio = smoothstep(-0.7, 0.7, n.y);

  // Refraction, each channel bent a different amount: the prism fringe.
  vec2 bend = -n.xy * 0.05 * u_form * vec2(1.0 / u_aspect, 1.0);
  vec3 through = vec3(
    texture(u_field, uv + bend * 0.84).r,
    texture(u_field, uv + bend).g,
    texture(u_field, uv + bend * 1.18).b);
  // Light enters on the lit side and gathers along the far inner edge.
  vec2 ld = normalize(toLight + 1e-5);
  float gather = rim * max(dot(normalize(n.xy + 1e-5), -ld), 0.0);
  // The rim does not depend on where the pointer is: glass keeps a bright
  // edge from every angle, which keeps letters far from it legible.
  vec3 glass = through * 0.86 + 0.06
    + rim * mix(0.28, 0.72, studio)
    + sheen * 0.16 + pin * 1.3
    + gather * vec3(1.0, 0.93, 0.82) * 0.55;
  // A thin dark line where the glass meets the air defines the edge.
  float lip = smoothstep(0.42, 0.5, hv.r) * (1.0 - smoothstep(0.5, 0.6, hv.r));
  glass *= 1.0 - 0.28 * lip;

  // Behind the glass: a short contact shadow, cast away from the light. Cast
  // any further (or with a caustic ring) it reads as a second headline.
  vec2 away = normalize(toLight + 1e-5) * vec2(1.0 / u_aspect, 1.0);
  float shade = texture(u_height, uv + away * 0.012).r;
  vec3 bg = texture(u_field, uv).rgb;
  bg *= 1.0 - 0.32 * smoothstep(0.1, 0.7, shade) * u_glass;

  vec3 col = mix(bg, glass, inside);
  col += (hash(floor(uv * u_res)) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;
const CSS = ".ghr-root{position:relative;width:100%;overflow:hidden;color:#FFFFFF;container-type:inline-size;touch-action:pan-y}" +
    ".ghr-canvas{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;opacity:0;" +
    "transition:opacity 700ms cubic-bezier(0.23,1,0.32,1)}" +
    ".ghr-root[data-glass='true'] .ghr-canvas{opacity:1}" +
    ".ghr-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "gap:28px;height:100%;padding:72px 24px;box-sizing:border-box;text-align:center}" +
    // The headline never moves: the glass is measured from where it sits, so
    // its entrance is the canvas fading in. The rest rises in behind it.
    ".ghr-eyebrow,.ghr-desc,.ghr-actions{animation:ghr-in 700ms cubic-bezier(0.23,1,0.32,1) both}" +
    ".ghr-desc{animation-delay:120ms}" +
    ".ghr-actions{animation-delay:200ms}" +
    ".ghr-eyebrow{display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:999px;font-size:13px;" +
    "font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.82);" +
    "border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}" +
    ".ghr-title{margin:0;max-width:12ch;font-size:clamp(3.75rem,calc(13cqw + 1.5rem),12.5rem);font-weight:800;line-height:.95;" +
    "letter-spacing:-0.025em;color:#FFFFFF;text-wrap:balance;" +
    // The solid type shown before the glass melts into it rather than
    // vanishing in one frame while the glass is still clear.
    "transition:color 900ms cubic-bezier(0.23,1,0.32,1)}" +
    ".ghr-root[data-glass='true'] .ghr-title{color:transparent}" +
    ".ghr-word::selection{background:rgba(255,255,255,.28)}" +
    ".ghr-desc{margin:0;max-width:38rem;font-size:clamp(1rem,1.7cqw,1.25rem);line-height:1.55;color:rgba(255,255,255,.8)}" +
    ".ghr-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}" +
    ".ghr-eyebrow{margin-bottom:-8px}" +
    ".ghr-arrow{margin-left:8px;transition:transform 200ms cubic-bezier(0.23,1,0.32,1)}" +
    ".ghr-btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;border-radius:999px;" +
    "font:inherit;font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;" +
    "transition:transform 160ms ease-out,background-color 200ms ease,border-color 200ms ease}" +
    ".ghr-btn:active{transform:scale(0.97)}" +
    ".ghr-btn:focus-visible{outline:2px solid #FFFFFF;outline-offset:3px}" +
    ".ghr-primary{border:0;background:#FFFFFF;color:#0D0A14}" +
    ".ghr-secondary{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.07);color:#FFFFFF;" +
    "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}" +
    "@media (hover:hover) and (pointer:fine){.ghr-primary:hover{background:#EFEAE2}.ghr-primary:hover .ghr-arrow{transform:translateX(3px)}" +
    ".ghr-secondary:hover{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.4)}}" +
    "@keyframes ghr-in{from{opacity:0;transform:translateY(12px)}}" +
    "@keyframes ghr-fade{from{opacity:0}}" +
    "@media (prefers-reduced-motion:reduce){.ghr-eyebrow,.ghr-desc,.ghr-actions{animation-name:ghr-fade}}";
function Action({ action, kind }) {
    const cls = "ghr-btn ghr-" + kind;
    const content = (React.createElement(React.Fragment, null,
        action.label,
        kind === "primary" ? (React.createElement("svg", { className: "ghr-arrow", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
            React.createElement("path", { d: "M5 12h14M13 6l6 6-6 6" }))) : null));
    return action.href ? (React.createElement("a", { className: cls, href: action.href, onClick: action.onClick }, content)) : (React.createElement("button", { type: "button", className: cls, onClick: action.onClick }, content));
}
function GlassHeadlineHero({ title, eyebrow, description, primaryAction, secondaryAction, colors, height = "100svh", className = "", reducedMotion = false, }) {
    const rootRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const titleRef = React.useRef(null);
    const [glass, setGlass] = React.useState(false);
    const [generation, setGeneration] = React.useState(0);
    const palette = paletteOf(colors);
    const words = splitWords(title);
    // The engine reads these live, so a new palette or title never rebuilds the GL context.
    const live = React.useRef({ palette, title });
    live.current = { palette, title };
    const pointer = React.useRef({ x: 0.5, y: 0.56, at: -1e9, rebuild: () => { }, kick: () => { } });
    React.useEffect(() => {
        const root = rootRef.current;
        const canvas = canvasRef.current;
        if (!root || !canvas)
            return;
        setGlass(false);
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (reducedMotion || preference.matches) {
            root.dataset.quality = "static";
            const changed = () => setGeneration(g => g + 1);
            preference.addEventListener("change", changed);
            return () => preference.removeEventListener("change", changed);
        }
        const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
        if (!gl) {
            root.dataset.quality = "fallback";
            return;
        }
        const floatTargets = !!gl.getExtension("EXT_color_buffer_float");
        let disposed = false;
        let contextLost = false;
        let raf = 0;
        let last = 0;
        let time = 0;
        let inView = true;
        let lite = window.matchMedia("(pointer: coarse)").matches;
        root.dataset.quality = lite ? "lite" : "full";
        let judged = 0;
        let slow = 0;
        const light = { x: 0.5, y: 0.56 };
        let readyAt = -1;
        const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const shader = (type, src) => {
            const s = gl.createShader(type);
            if (!s)
                throw new Error("could not create shader");
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                const info = gl.getShaderInfoLog(s);
                gl.deleteShader(s);
                throw new Error("shader: " + info);
            }
            return s;
        };
        const program = (frag) => {
            const prog = gl.createProgram();
            if (!prog)
                throw new Error("could not create program");
            let v = null;
            let f = null;
            try {
                v = shader(gl.VERTEX_SHADER, VERT);
                f = shader(gl.FRAGMENT_SHADER, frag);
                gl.attachShader(prog, v);
                gl.attachShader(prog, f);
                gl.bindAttribLocation(prog, 0, "a_position");
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    throw new Error("link: " + gl.getProgramInfoLog(prog));
                }
            }
            catch (error) {
                gl.deleteProgram(prog);
                throw error;
            }
            finally {
                if (v)
                    gl.deleteShader(v);
                if (f)
                    gl.deleteShader(f);
            }
            const u = {};
            const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < count; i++) {
                const info = gl.getActiveUniform(prog, i);
                if (info)
                    u[info.name.replace(/^u_/, "")] = gl.getUniformLocation(prog, info.name);
            }
            programs.push(prog);
            return { prog, u };
        };
        const owned = { tex: new Set(), fbo: new Set() };
        let vao = null;
        let buffer = null;
        const programs = [];
        const dropTarget = (t) => {
            if (!t)
                return;
            gl.deleteTexture(t.tex);
            gl.deleteFramebuffer(t.fbo);
            owned.tex.delete(t.tex);
            owned.fbo.delete(t.fbo);
        };
        const makeTarget = (w, h, precise) => {
            const tex = gl.createTexture();
            const fbo = gl.createFramebuffer();
            if (!tex || !fbo)
                throw new Error("could not allocate a render target");
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // The bevel's height is differentiated for normals; at 8 bits the steps
            // show as terraces in the highlights, so it gets half floats when it can.
            if (precise && floatTargets)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
            else
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                gl.deleteTexture(tex);
                gl.deleteFramebuffer(fbo);
                throw new Error("incomplete render target");
            }
            owned.tex.add(tex);
            owned.fbo.add(fbo);
            return { tex, fbo, w, h };
        };
        const releaseTargets = () => {
            for (const t of owned.tex)
                gl.deleteTexture(t);
            for (const f of owned.fbo)
                gl.deleteFramebuffer(f);
            owned.tex.clear();
            owned.fbo.clear();
        };
        let P;
        let field = null;
        let blurA = null;
        let blurB = null;
        let maskTex = null;
        let bevel = 4;
        const run = (p, dst, u) => {
            gl.useProgram(p.prog);
            let unit = 0;
            for (const k in u) {
                const loc = p.u[k];
                if (!loc)
                    continue;
                const v = u[k];
                if (typeof v === "number")
                    gl.uniform1f(loc, v);
                else if (Array.isArray(v)) {
                    if (v.length === 2)
                        gl.uniform2f(loc, v[0], v[1]);
                    else
                        gl.uniform3f(loc, v[0], v[1], v[2]);
                }
                else {
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(gl.TEXTURE_2D, v);
                    gl.uniform1i(loc, unit++);
                }
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null);
            gl.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        // The headline, drawn white on black exactly where the browser put each
        // word, then blurred on the GPU into the bevel's height field.
        // What the mask was last built from. First paint asks for it three or
        // four times over (initial size, the ResizeObserver's first call, fonts
        // ready, the title effect) with nothing changed, and each build is four
        // blur passes: on a software renderer that alone froze the page for
        // seconds. Now a build only happens when this changes.
        let built = "";
        const buildMask = () => {
            const heading = titleRef.current;
            if (!heading || !field)
                return;
            const box = root.getBoundingClientRect();
            const desiredScale = lite ? 0.8 : Math.min(window.devicePixelRatio || 1, 1.2);
            const limit = Math.min(4096, Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)));
            const scale = Math.min(desiredScale, limit / Math.max(1, box.width, box.height), Math.sqrt(2500000 / Math.max(1, box.width * box.height)));
            const w = Math.max(1, Math.round(box.width * scale));
            const h = Math.max(1, Math.round(box.height * scale));
            const spans = Array.from(heading.querySelectorAll(".ghr-word"));
            const rects = spans.map((span) => span.getBoundingClientRect());
            const cs = getComputedStyle(heading);
            const layout = [w, h, scale, cs.font, cs.letterSpacing]
                .concat(spans.map((span, i) => (span.textContent ?? "") + "@" + Math.round(rects[i].left - box.left) + "," + Math.round(rects[i].top - box.top)))
                .join("|");
            if (layout === built)
                return;
            built = layout;
            const cnv = document.createElement("canvas");
            cnv.width = w;
            cnv.height = h;
            const c = cnv.getContext("2d");
            if (!c)
                return;
            c.fillStyle = "#000";
            c.fillRect(0, 0, w, h);
            const fontPx = parseFloat(cs.fontSize) || 64;
            c.setTransform(scale, 0, 0, scale, 0, 0);
            c.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
            const spaced = c;
            if ("letterSpacing" in c)
                spaced.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
            c.fillStyle = "#fff";
            c.textBaseline = "alphabetic";
            spans.forEach((span, i) => {
                const text = span.textContent ?? "";
                const ascent = c.measureText(text).fontBoundingBoxAscent || fontPx * 0.8;
                c.fillText(text, rects[i].left - box.left, rects[i].top - box.top + ascent);
            });
            if (!maskTex)
                maskTex = gl.createTexture();
            if (!maskTex)
                throw new Error("could not allocate headline mask");
            gl.bindTexture(gl.TEXTURE_2D, maskTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cnv);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (!blurA || blurA.w !== w || blurA.h !== h) {
                for (const t of [blurA, blurB]) {
                    if (!t)
                        continue;
                    dropTarget(t);
                }
                blurA = makeTarget(w, h, true);
                blurB = makeTarget(w, h, true);
            }
            bevel = bevelPx(fontPx, scale);
            if (!blurA || !blurB)
                return;
            // Bevel across then down, then the dome across then down from the bevel.
            run(P.blur, blurA, { src: maskTex, step: [1 / w, 0], radius: bevel, read: 0, write: 0 });
            run(P.blur, blurB, { src: blurA.tex, step: [0, 1 / h], radius: bevel, read: 1, write: 0 });
            run(P.blur, blurA, { src: blurB.tex, step: [1 / w, 0], radius: bevel * DOME, read: 1, write: 1 });
            run(P.blur, blurB, { src: blurA.tex, step: [0, 1 / h], radius: bevel * DOME, read: 2, write: 1 });
        };
        const size = () => {
            if (disposed || contextLost || gl.isContextLost())
                return;
            // Lite draws the glass below CSS resolution and lets the browser scale
            // it up: softer edges, on a device that was dropping frames anyway.
            const requestedDpr = lite ? 0.65 : Math.min(window.devicePixelRatio || 1, 1.25);
            const dpr = Math.min(requestedDpr, Math.sqrt(2200000 / Math.max(1, canvas.clientWidth * canvas.clientHeight)));
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            // The field is smooth, so it is drawn small and stretched: it costs a
            // fifth of the pixels and looks the same through the glass.
            const fs = lite ? 0.25 : 0.4;
            const fw = Math.max(1, Math.round(w * fs));
            const fh = Math.max(1, Math.round(h * fs));
            if (!field || field.w !== fw || field.h !== fh) {
                if (field) {
                    dropTarget(field);
                }
                field = makeTarget(fw, fh, false);
            }
            buildMask();
        };
        const draw = () => {
            if (!field || !blurB)
                return;
            const pal = live.current.palette;
            const aspect = canvas.width / canvas.height;
            run(P.field, field, { time, aspect, octaves: lite ? 3 : 5, c0: pal[0], c1: pal[1], c2: pal[2], c3: pal[3], c4: pal[4] });
            run(P.glass, null, {
                field: field.tex,
                height: blurB.tex,
                htexel: [1 / blurB.w, 1 / blurB.h],
                bevel,
                aspect,
                light: [light.x, light.y],
                glass: 1,
                form: reduceMq.matches || readyAt < 0 ? 1 : formed(performance.now() - readyAt, FORM_MS),
                res: [canvas.width, canvas.height],
            });
        };
        const animating = () => inView && !document.hidden && !reduceMq.matches;
        const frame = (now) => {
            raf = 0;
            if (disposed || contextLost || gl.isContextLost() || document.hidden || !inView)
                return;
            const raw = (now - last) / 1000;
            last = now;
            const dt = Math.min(raw, 0.1);
            if (!lite && judged < 40 && animating()) {
                judged += 1;
                if (judged > 3 && raw > SLOW_FRAME_S)
                    slow += raw > CRAWL_FRAME_S ? 3 : 1;
                if (slow >= SLOW_FRAMES) {
                    lite = true;
                    root.dataset.quality = "lite";
                    size();
                }
            }
            if (animating())
                time += dt;
            const pt = pointer.current;
            const idle = (now - pt.at) / 1000 > IDLE_S;
            const [tx, ty] = idle && animating() ? orbit(time) : [pt.x, pt.y];
            light.x = follow(light.x, tx, dt, idle ? 1.2 : 7);
            light.y = follow(light.y, ty, dt, idle ? 1.2 : 7);
            draw();
            // A hero is on screen a lot: it only keeps drawing while it is visible,
            // the tab is showing and motion is welcome, or while the light is still
            // catching up with the pointer.
            // Catching the light up only matters on screen (reduced motion, say,
            // where the pointer is the only thing that moves it). Off screen or in a
            // hidden tab nothing is drawn at all, glide or no glide.
            const catching = Math.abs(light.x - tx) + Math.abs(light.y - ty) > 0.0015;
            const visible = inView && !document.hidden;
            const forming = readyAt >= 0 && performance.now() - readyAt < FORM_MS;
            if (visible && (animating() || catching || forming))
                raf = requestAnimationFrame(frame);
        };
        const kick = () => {
            if (raf || disposed || contextLost || gl.isContextLost() || document.hidden || !inView)
                return;
            last = performance.now();
            raf = requestAnimationFrame(frame);
        };
        pointer.current.kick = kick;
        pointer.current.rebuild = () => {
            if (disposed || contextLost || gl.isContextLost())
                return;
            buildMask();
            kick();
        };
        const onLost = (e) => {
            e.preventDefault();
            contextLost = true;
            setGlass(false);
            root.dataset.quality = "context-lost";
            cancelAnimationFrame(raf);
            raf = 0;
        };
        const onRestored = () => setGeneration((g) => g + 1);
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);
        try {
            P = { field: program(FIELD), blur: program(BLUR), glass: program(GLASS) };
            vao = gl.createVertexArray();
            if (!vao)
                throw new Error("could not allocate vertex array");
            gl.bindVertexArray(vao);
            buffer = gl.createBuffer();
            if (!buffer)
                throw new Error("could not allocate vertex buffer");
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            size();
            if (!field || !blurB || !maskTex)
                throw new Error("headline mask unavailable");
        }
        catch (error) {
            root.dataset.glError = String(error);
            releaseTargets();
            if (maskTex)
                gl.deleteTexture(maskTex);
            for (const prog of programs)
                gl.deleteProgram(prog);
            if (buffer)
                gl.deleteBuffer(buffer);
            if (vao)
                gl.deleteVertexArray(vao);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestored);
            pointer.current.kick = () => { };
            pointer.current.rebuild = () => { };
            root.dataset.quality = "fallback";
            return;
        }
        setGlass(true);
        readyAt = performance.now();
        kick();
        // Layout moves the words: resizing the hero, or the host's web font
        // arriving after first paint, both re-run the mask.
        let pending = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(pending);
            pending = requestAnimationFrame(() => {
                if (disposed)
                    return;
                size();
                kick();
            });
        });
        observer.observe(root);
        document.fonts?.ready.then(() => { if (!disposed)
            pointer.current.rebuild(); });
        const io = new IntersectionObserver(([e]) => {
            inView = e.isIntersecting;
            if (inView)
                kick();
            else {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        });
        io.observe(root);
        const onVisibility = () => { if (document.hidden) {
            cancelAnimationFrame(raf);
            raf = 0;
        }
        else
            kick(); };
        document.addEventListener("visibilitychange", onVisibility);
        const onPreference = () => setGeneration(g => g + 1);
        reduceMq.addEventListener("change", onPreference);
        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            cancelAnimationFrame(pending);
            observer.disconnect();
            io.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            reduceMq.removeEventListener("change", onPreference);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestored);
            releaseTargets();
            if (maskTex)
                gl.deleteTexture(maskTex);
            for (const prog of programs)
                gl.deleteProgram(prog);
            if (buffer)
                gl.deleteBuffer(buffer);
            if (vao)
                gl.deleteVertexArray(vao);
            pointer.current.kick = () => { };
            pointer.current.rebuild = () => { };
        };
    }, [generation, reducedMotion]);
    // A new headline is a new mask.
    React.useEffect(() => pointer.current.rebuild(), [title]);
    const onPointerMove = (e) => {
        if (reducedMotion || e.pointerType !== "mouse")
            return;
        const r = e.currentTarget.getBoundingClientRect();
        const pt = pointer.current;
        pt.x = (e.clientX - r.left) / r.width;
        pt.y = 1 - (e.clientY - r.top) / r.height;
        pt.at = performance.now();
        e.currentTarget.style.setProperty("--se-light-x", `${Math.round(pt.x * 100)}%`);
        e.currentTarget.style.setProperty("--se-light-y", `${Math.round((1 - pt.y) * 100)}%`);
        pt.kick();
    };
    return (React.createElement("section", { ref: rootRef, className: "ghr-root " + className, style: { height, background: fallbackBackground(palette) }, "data-glass": glass, onPointerMove: onPointerMove },
        React.createElement("style", null, CSS),
        React.createElement("canvas", { ref: canvasRef, className: "ghr-canvas", "aria-hidden": "true" }),
        React.createElement("div", { className: "ghr-content" },
            eyebrow ? React.createElement("span", { className: "ghr-eyebrow" }, eyebrow) : null,
            React.createElement("h1", { ref: titleRef, className: "ghr-title", "aria-label": "Serkon \u4FAF\u4E16\u5EB7" }, words.map((w, i) => (React.createElement(React.Fragment, { key: i },
                React.createElement("span", { className: "ghr-word" }, w),
                i < words.length - 1 ? " " : null)))),
            description ? React.createElement("p", { className: "ghr-desc" }, description) : null,
            primaryAction || secondaryAction ? (React.createElement("div", { className: "ghr-actions" },
                primaryAction ? React.createElement(Action, { action: primaryAction, kind: "primary" }) : null,
                secondaryAction ? React.createElement(Action, { action: secondaryAction, kind: "secondary" }) : null)) : null)));
}

