"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import {
  HUE_ORANGE,
  HUE_RED,
  STORAGE_KEY,
  SWEEP_DEG,
  degToT,
  snap,
  supportsThemeDial,
} from "@/lib/themeDial";

/** One arrow press. A whole sweep in 18 presses — coarse enough to cross the
 *  dial without holding the key down, fine enough to place it deliberately. */
const ARROW_STEP = SWEEP_DEG / 18;
const PAGE_STEP = SWEEP_DEG / 4;

export default function ThemeDial() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const degRef = useRef(0);
  /** Which ramp the current trip is on. See the latching note in `paint`. */
  const hueRef = useRef(HUE_ORANGE);
  const drag = useRef<{ pointerId: number; cx: number; cy: number; prevAngle: number } | null>(
    null
  );

  const paint = useCallback((deg: number) => {
    const clamped = Math.min(SWEEP_DEG, Math.max(0, deg));
    degRef.current = clamped;
    const t = degToT(clamped);

    // THE LATCH. Turning toward dark tints the text orange; turning back
    // toward light tints it red. That asymmetry cannot be read off the
    // pointer's instantaneous direction — a hand shaking by a pixel would
    // strobe the hue mid-turn. So the ramp is chosen when the dial reaches
    // an end and held for the whole trip out and back. Both ramps render
    // black at t=0 and white at t=1, which is exactly where this can fire,
    // so the swap happens at the one moment the two ramps already agree:
    // invisible by construction, with no crossfade to tune.
    if (t <= 0) hueRef.current = HUE_ORANGE;
    else if (t >= 1) hueRef.current = HUE_RED;

    const root = document.documentElement;
    root.style.setProperty("--theme-t", String(t));
    root.style.setProperty("--theme-hue", String(hueRef.current));
    root.setAttribute("data-theme", t < 0.5 ? "light" : "dark");

    const button = buttonRef.current;
    if (button) {
      const percent = Math.round(t * 100);
      button.setAttribute("aria-valuenow", String(percent));
      button.setAttribute(
        "aria-valuetext",
        percent === 0 ? "Light" : percent === 100 ? "Dark" : `${percent}% toward dark`
      );
    }
  }, []);

  const commit = useCallback(
    (deg: number) => {
      const settled = snap(Math.min(SWEEP_DEG, Math.max(0, deg)));
      paint(settled);
      try {
        if (settled === 0) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, String(Math.round(settled)));
      } catch {
        // Private mode / storage blocked: the dial still works, it just
        // won't be remembered next visit.
      }
    },
    [paint]
  );

  const angleFromCenter = (clientX: number, clientY: number, cx: number, cy: number) =>
    (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.setAttribute("data-theme-turning", "");
    drag.current = {
      pointerId: event.pointerId,
      cx,
      cy,
      prevAngle: angleFromCenter(event.clientX, event.clientY, cx, cy),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const angle = angleFromCenter(event.clientX, event.clientY, state.cx, state.cy);
    // Apply the DELTA from the previous sample, not the absolute angle — an
    // absolute mapping would teleport the dial to wherever the pointer first
    // landed. Unwrap atan2's +-180 seam so dragging across it keeps turning
    // smoothly instead of snapping.
    let step = angle - state.prevAngle;
    if (step > 180) step -= 360;
    else if (step < -180) step += 360;
    state.prevAngle = angle;
    // Clamping the stored angle rather than a derived one is what makes the
    // ends feel like real stops: over-travel past an end is discarded
    // outright, so coming back off the stop starts moving immediately
    // instead of after winding back the slack.
    paint(degRef.current + step);
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    drag.current = null;
    document.documentElement.removeAttribute("data-theme-turning");
    commit(degRef.current);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const deg = degRef.current;
    const jump = (next: number) => {
      event.preventDefault();
      commit(next);
    };
    if (event.key === "ArrowRight" || event.key === "ArrowUp") jump(deg + ARROW_STEP);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") jump(deg - ARROW_STEP);
    else if (event.key === "PageUp") jump(deg + PAGE_STEP);
    else if (event.key === "PageDown") jump(deg - PAGE_STEP);
    else if (event.key === "Home") jump(0);
    else if (event.key === "End") jump(SWEEP_DEG);
  };

  useLayoutEffect(() => {
    if (!supportsThemeDial()) return;
    // Re-applies the stored angle on mount, for two reasons rather than one.
    // React Strict Mode's dev-only remount resets <html> to just the
    // attributes React manages from JSX, wiping what the <head> boot script
    // set (a production no-op); and this is also what syncs the component's
    // own degRef with whatever that script already painted, since it runs
    // entirely outside React.
    let stored = 0;
    try {
      stored = Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      // ignore
    }
    // Seed the latch from where the dial is resting, so the first turn of
    // the session runs the ramp that matches the direction it can travel.
    hueRef.current = degToT(stored) < 0.5 ? HUE_ORANGE : HUE_RED;
    paint(stored);
  }, [paint]);

  return (
    <button
      ref={buttonRef}
      type="button"
      role="slider"
      aria-label="Light to dark"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext="Light"
      aria-orientation="horizontal"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className="flex h-14 w-14 cursor-grab touch-none items-center justify-center justify-self-center rounded-full select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:cursor-grabbing"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="h-10 w-10"
      >
        {/* The body of the knob. Solid currentColor, so it is black on the
            light page and white on the dark one without a second rule. */}
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2" />

        {/* The rotating indicator. It reads --theme-t directly rather than an
            angle the component writes per frame, so the pointer eases in
            lockstep with the colors on release instead of jumping ahead of
            them. Travel is centered: -135deg at full light, +135deg at full
            dark, straight up at the midpoint.

            transformBox must be explicit — SVG's default origin behavior is
            inconsistent across engines. `view-box` pins rotation to the
            viewBox center; `fill-box` would pivot the notch around itself. */}
        <g
          style={{
            rotate: "calc((var(--theme-t, 0) - 0.5) * 270deg)",
            transformOrigin: "20px 20px",
            transformBox: "view-box",
          }}
        >
          <path
            d="M20 6.5V13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </button>
  );
}
