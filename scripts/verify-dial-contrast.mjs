/**
 * Sweeps the theme dial end to end and reports the worst-case contrast
 * between the text color and the background it sits on.
 *
 * Run by hand during development (`node scripts/verify-dial-contrast.mjs`),
 * not part of the build. Its job is to keep lib/themeDial.ts honest: those
 * curve constants are the only thing standing between "turn the knob" and
 * "the site becomes unreadable at some angle nobody tested".
 */

import { readFileSync } from "node:fs";

import {
  BG_HUE,
  bgChroma,
  FG_SATURATION,
  FLIP_BAND,
  HUE_ORANGE,
  HUE_RED,
  bgLightness,
  fgChroma,
  fgLightness,
  gamutCeiling,
  flipMix,
} from "../lib/themeDial.ts";

/** Minimum the dial promises outside the flip band. The constants are tuned
 *  to clear WCAG AAA (7:1), not merely AA — matching what the dial this
 *  replaced guaranteed, so turning the knob can never cost legibility. */
const CONTRAST_FLOOR = 7;

/** OKLCH -> linear sRGB, via the published OKLab matrices. */
function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** WCAG relative luminance is defined on linear-light sRGB, which is exactly
 *  what the matrices above produce — so no gamma round-trip is needed. */
const relativeLuminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const contrast = (y1, y2) =>
  (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);

const inGamut = ([r, g, b]) =>
  [r, g, b].every((v) => v >= -0.0005 && v <= 1.0005);

const toHex = ([r, g, b]) =>
  "#" +
  [r, g, b]
    .map((v) => {
      const clamped = Math.min(1, Math.max(0, v));
      const srgb =
        clamped <= 0.0031308
          ? clamped * 12.92
          : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      return Math.round(srgb * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");

/** True sRGB chroma ceiling at this lightness and hue, by binary search — the
 *  ground truth the analytic envelope in themeDial.ts has to stay under. */
function trueCeiling(L, hue) {
  let lo = 0;
  let hi = 0.45;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearSrgb(L, mid, hue))) lo = mid;
    else hi = mid;
  }
  return lo;
}

const SAMPLES = 4000;
const bandLo = 0.5 - FLIP_BAND / 2;
const bandHi = 0.5 + FLIP_BAND / 2;
let failed = false;

for (const [rampName, hue] of [
  ["orange (light -> dark)", HUE_ORANGE],
  ["red (dark -> light)", HUE_RED],
]) {
  let worstOutside = { ratio: Infinity };
  let clipped = 0;
  let envelopeOver = 0;
  let tightestHeadroom = { slack: Infinity };

  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const L = fgLightness(t);

    const bg = oklchToLinearSrgb(bgLightness(t), bgChroma(t), BG_HUE);
    const fg = oklchToLinearSrgb(L, fgChroma(t), hue);

    if (!inGamut(bg) || !inGamut(fg)) clipped++;

    // The envelope is a straight-line under-approximation of a curved
    // ceiling; confirm it never pokes through for this hue.
    const slack = trueCeiling(L, hue) - gamutCeiling(L);
    if (slack < 0) envelopeOver++;
    if (slack < tightestHeadroom.slack) tightestHeadroom = { t, L, slack };

    if (t > bandLo && t < bandHi) continue;
    const ratio = contrast(relativeLuminance(bg), relativeLuminance(fg));
    if (ratio < worstOutside.ratio)
      worstOutside = { t, ratio, bg: toHex(bg), fg: toHex(fg) };
  }

  const pass =
    clipped === 0 && envelopeOver === 0 && worstOutside.ratio >= CONTRAST_FLOOR;
  if (!pass) failed = true;

  console.log(`\n${pass ? "PASS" : "FAIL"}  ${rampName}  hue ${hue}`);
  console.log(`  out-of-gamut samples    : ${clipped}`);
  console.log(
    `  envelope over ceiling   : ${envelopeOver}` +
      `  (tightest slack ${tightestHeadroom.slack.toFixed(4)} at L=${tightestHeadroom.L.toFixed(2)})`
  );
  console.log(
    `  worst contrast outside  : ${worstOutside.ratio.toFixed(2)}:1` +
      `  at t=${worstOutside.t.toFixed(3)}  ${worstOutside.fg} on ${worstOutside.bg}` +
      `  (floor ${CONTRAST_FLOOR}:1)`
  );

  console.log("  the trip:");
  for (const t of [0, 0.12, 0.25, 0.37, bandLo, 0.5, bandHi, 0.62, 0.75, 0.88, 1]) {
    const L = fgLightness(t);
    const bg = oklchToLinearSrgb(bgLightness(t), bgChroma(t), BG_HUE);
    const fg = oklchToLinearSrgb(L, fgChroma(t), hue);
    const ratio = contrast(relativeLuminance(bg), relativeLuminance(fg));
    const mark = t > bandLo && t < bandHi ? " <- flip band" : "";
    console.log(
      `    t=${t.toFixed(2)}  text ${toHex(fg)} (L ${L.toFixed(2)} C ${fgChroma(t).toFixed(3)})` +
        `  on ${toHex(bg)}  ${ratio.toFixed(2)}:1${mark}`
    );
  }
}

console.log(
  `\nflip band t ${bandLo.toFixed(2)}..${bandHi.toFixed(2)} — the dial snaps out of it on` +
    ` release, so it is a pass-through, never a resting place.`
);
console.log(`text rides ${FG_SATURATION * 100}% of the gamut ceiling.`);

/* ---------------------------------------------------------------------- *
   The contrast proof above runs against the TypeScript curves, but the
   colors a visitor actually sees come from the hand-written CSS twin of
   those curves in app/globals.css. A typo in either file would leave the
   proof passing while the page it describes drifts out from under it, so
   the last check reads the real stylesheet, evaluates its expressions, and
   confirms the two agree.
 * ---------------------------------------------------------------------- */

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
);

/** Pull `--name: <expr>;` out of the stylesheet. */
function cssExpr(name) {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`globals.css no longer declares --${name}`);
  return m[1];
}

/** CSS math -> JS. The grammars line up closely enough that swapping the
 *  function names and substituting the vars is the whole translation. */
function toJs(expr, vars) {
  let out = expr
    .replace(/\bcalc\(/g, "(")
    .replace(/\bmin\(/g, "Math.min(")
    .replace(/\bmax\(/g, "Math.max(")
    .replace(/\bpow\(/g, "Math.pow(")
    .replace(/\bclamp\(/g, "CLAMP(");
  for (const [name, js] of Object.entries(vars)) {
    out = out.replaceAll(`var(--${name})`, `(${js})`);
    out = out.replace(new RegExp(`var\\(--${name},[^)]*\\)`, "g"), `(${js})`);
  }
  if (out.includes("var(")) throw new Error(`unsubstituted var in: ${out}`);
  return out;
}

const CLAMP = (lo, v, hi) => Math.min(Math.max(v, lo), hi);

/** The declarations reference each other (--fg-c reads --fg-l, which reads
 *  --flip), so each compiled one is added to the substitution map for the
 *  ones after it — the same dependency order the cascade resolves them in. */
const compiled = {};
const vars = { "theme-t": "t" };
for (const name of ["flip", "bg-l", "fg-l", "fg-c"]) {
  compiled[name] = new Function(
    "t",
    "CLAMP",
    "D",
    `return ${toJs(cssExpr(name), vars)};`
  );
  vars[name] = `D["${name}"](t, CLAMP, D)`;
}

const evalCss = (name, t) => compiled[name](t, CLAMP, compiled);

let drift = 0;
let worstDrift = { delta: 0 };
for (let i = 0; i <= 2000; i++) {
  const t = i / 2000;
  const pairs = [
    ["flip", evalCss("flip", t), flipMix(t)],
    ["bg-l", evalCss("bg-l", t), bgLightness(t)],
    ["fg-l", evalCss("fg-l", t), fgLightness(t)],
    ["fg-c", evalCss("fg-c", t), fgChroma(t)],
  ];
  for (const [name, fromCss, fromTs] of pairs) {
    const delta = Math.abs(fromCss - fromTs);
    if (delta > 1e-9) drift++;
    if (delta > worstDrift.delta) worstDrift = { name, t, delta, fromCss, fromTs };
  }
}

const cssMatches = drift === 0;
if (!cssMatches) failed = true;
console.log(
  `\n${cssMatches ? "PASS" : "FAIL"}  app/globals.css matches lib/themeDial.ts`
);
if (!cssMatches) {
  console.log(
    `  worst drift: --${worstDrift.name} at t=${worstDrift.t.toFixed(3)}` +
      `  css ${worstDrift.fromCss} vs ts ${worstDrift.fromTs}`
  );
}

process.exit(failed ? 1 : 0);
