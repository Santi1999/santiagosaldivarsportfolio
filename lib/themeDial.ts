/**
 * The theme dial: one knob that turns the site from light to dark.
 *
 * THE MODEL — everything below follows from these three ideas.
 *
 * 1. ONE NUMBER. The knob's whole state is `t`, travel from 0 (light) to 1
 *    (dark). Background and text color are both pure functions of `t`, so
 *    they can never disagree about where the dial is. CSS recomputes every
 *    color from `--theme-t` alone; nothing else is written per frame.
 *
 * 2. TWO RAMPS, LATCHED AT THE ENDS. Turning toward dark tints the text
 *    orange; turning back toward light tints it red. That asymmetry is the
 *    point, but it cannot be read off the pointer's instantaneous direction
 *    — every jitter would flip the hue mid-turn. Instead the ramp is latched
 *    when the dial LEAVES an end and held for the whole trip. Because both
 *    ramps are black at t=0 and white at t=1, the only moments the hue can
 *    change are the two where the ramps already agree, so the swap is
 *    invisible by construction rather than by crossfade.
 *
 * 3. THE FLIP BAND. Text has to cross from darker-than-background to
 *    lighter-than-background somewhere, and at that crossing they are the
 *    same lightness — unreadable, unavoidable, true of every light/dark
 *    transition ever built. So it is confined to a narrow band around t=0.5
 *    and the dial SNAPS OUT of that band on release (see `snap`). You can
 *    turn through it; you cannot come to rest in it. Outside the band the
 *    contrast floor is verified by scripts/verify-dial-contrast.mjs.
 */

/** Degrees of knob travel from full light to full dark. A real potentiometer
 *  sweep rather than a free spinner: light/dark is an axis with two ends, so
 *  the knob clamps at both. */
export const SWEEP_DEG = 270;

/** Width of the flip band in `t`, centered on 0.5. Wide enough that the
 *  lightness swap eases rather than jump-cuts, narrow enough that turning
 *  past it feels like a detent. */
export const FLIP_BAND = 0.1;

/** The background's hue, held constant across the whole sweep. 67.8 is where
 *  the shipped paper white rgb(252, 250, 248) already sits, so t=0 reproduces
 *  today's background exactly rather than landing near it. */
export const BG_HUE = 67.8;

/* Background chroma, opened up slightly as the page darkens. The paper white
   is almost neutral (C 0.0034), but carrying that to the dark end would give
   a flat charcoal; a little more warmth down there keeps dark mode feeling
   like the same room with the lights off. Both ends are far inside gamut. */
export const BG_CHROMA_LIGHT = 0.0034;
export const BG_CHROMA_DARK = 0.012;

/* Background lightness, as two lines the flip band mixes between. The light
   line drifts down a little as you turn (paper -> pale gray) and the dark
   line keeps darkening, so the ends feel like arrivals rather than plateaus.
   0.986 is the shipped paper white's exact lightness. */
export const BG_LIGHT_BASE = 0.986;
export const BG_LIGHT_DRIFT = 0.12;
export const BG_DARK_BASE = 0.333;
export const BG_DARK_DRIFT = 0.178;

/* Text lightness, same two-line structure mirrored. Near t=0 the text is
   near-black; near t=1 it is near-white; the flip band is where it changes
   sides. The dark line stops at 0.42 and the light line starts at 0.75 —
   those two numbers are set by contrast, not taste: any lighter on the dark
   side and the text stops clearing 4.5:1 against the near-white background
   it sits on. */
export const FG_DARK_BASE = 0.205;
export const FG_DARK_DRIFT = 0.478;
export const FG_LIGHT_BASE = 0.493;
export const FG_LIGHT_DRIFT = 0.467;

/**
 * THE GAMUT ENVELOPE. How much chroma a hue can actually hold depends almost
 * entirely on its lightness, and sRGB's ceiling is a triangle: chroma rises
 * roughly linearly off black, peaks around L 0.6-0.75, then falls to nothing
 * at white. Ask for more than the ceiling and the browser silently clips —
 * which pins the color to the gamut wall, so the rendered lightness stops
 * matching the requested one and the contrast floor quietly stops holding.
 *
 * These two slopes are a conservative fit that sits under the true ceiling
 * for BOTH ramp hues at every lightness (measured, not assumed — see the
 * envelope check in scripts/verify-dial-contrast.mjs). The chroma the dial
 * actually asks for is this ceiling times FG_SATURATION.
 */
export const GAMUT_RISE = 0.22;
export const GAMUT_FALL = 0.48;

/** How close to the gamut edge the text rides. Short of 1 so that rounding
 *  and any given browser's gamut-mapping quirks still land inside. */
export const FG_SATURATION = 0.85;

/** Exponent on the chroma bump. Below 1 it fattens a parabola into a plateau:
 *  color arrives quickly once you start turning, holds across the middle, and
 *  drains away only right at the ends — so t=0 is true black and t=1 is true
 *  white, with tinted text everywhere between. */
export const CHROMA_PLATEAU = 0.45;

/** Orange — the light-to-dark trip. */
export const HUE_ORANGE = 58;
/** Red — the dark-to-light trip back. */
export const HUE_RED = 27;

export const STORAGE_KEY = "theme-dial-deg";

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Knob angle -> travel. */
export const degToT = (deg: number) => clamp01(deg / SWEEP_DEG);

/** 0 below the flip band, 1 above it, linear across. */
export const flipMix = (t: number) => clamp01((t - (0.5 - FLIP_BAND / 2)) / FLIP_BAND);

const mix = (a: number, b: number, m: number) => a + (b - a) * m;

export const bgLightness = (t: number) =>
  mix(BG_LIGHT_BASE - BG_LIGHT_DRIFT * t, BG_DARK_BASE - BG_DARK_DRIFT * t, flipMix(t));

export const bgChroma = (t: number) => mix(BG_CHROMA_LIGHT, BG_CHROMA_DARK, t);

export const fgLightness = (t: number) =>
  mix(FG_DARK_BASE + FG_DARK_DRIFT * t, FG_LIGHT_BASE + FG_LIGHT_DRIFT * t, flipMix(t));

/** Largest chroma the given lightness can hold in sRGB, for either ramp hue. */
export const gamutCeiling = (L: number) => Math.min(GAMUT_RISE * L, GAMUT_FALL * (1 - L));

export const fgChroma = (t: number) =>
  FG_SATURATION * gamutCeiling(fgLightness(t)) * Math.pow(4 * t * (1 - t), CHROMA_PLATEAU);

/** Nearest edge of the flip band, so the dial can never come to rest inside
 *  it. Points outside the band are returned untouched. */
export function snap(deg: number): number {
  const t = degToT(deg);
  const lo = 0.5 - FLIP_BAND / 2;
  const hi = 0.5 + FLIP_BAND / 2;
  if (t <= lo || t >= hi) return deg;
  return (t < 0.5 ? lo : hi) * SWEEP_DEG;
}

/** Which ramp a trip departing from `t` should use. Only ever consulted at
 *  the ends, where both ramps render the same color. */
export const rampHueFor = (t: number) => (t < 0.5 ? HUE_ORANGE : HUE_RED);

/** The ramps need both oklch() and the `pow()` in the chroma envelope. They
 *  landed in the same browser generation (Chrome 111, Safari 15.4, Firefox
 *  113/118), but probe each on its own rather than relying on that: anything
 *  missing either keeps the static light theme and an inert knob, which is
 *  far better than a page rendered from expressions that silently dropped to
 *  their initial values. */
export const supportsThemeDial = (): boolean =>
  typeof CSS !== "undefined" &&
  CSS.supports("color", `oklch(0.5 0.1 ${BG_HUE})`) &&
  CSS.supports("width", "calc(pow(2, 1) * 1px)");

/**
 * Runs during HTML parsing, before first paint — the pattern documented at
 * node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 * A returning visitor who left the dial on dark must never see a frame of
 * white, so the stored angle is applied here rather than after hydration.
 */
export const THEME_DIAL_BOOT = `(function(){try{
if(!window.CSS||!CSS.supports("color","oklch(0.5 0.1 ${BG_HUE})")||!CSS.supports("width","calc(pow(2, 1) * 1px)"))return;
var d=+localStorage.getItem("${STORAGE_KEY}")||0;
var t=Math.min(1,Math.max(0,d/${SWEEP_DEG}));
var e=document.documentElement;
e.style.setProperty("--theme-t",String(t));
e.style.setProperty("--theme-hue",String(t<0.5?${HUE_ORANGE}:${HUE_RED}));
e.setAttribute("data-theme",t<0.5?"light":"dark");
}catch(e){}})()`.replace(/\s*\n\s*/g, "");
