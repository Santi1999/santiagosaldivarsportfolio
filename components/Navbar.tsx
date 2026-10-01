"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeDial from "@/components/ThemeDial";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuRendered, setIsMenuRendered] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuRendered(true);
      let showFrame = 0;
      // Two rAFs ensure the browser paints the initial opacity-0 frame
      // before flipping to opacity-100, so the transition actually runs.
      const openFrame = requestAnimationFrame(() => {
        showFrame = requestAnimationFrame(() => setIsMenuVisible(true));
      });
      return () => {
        cancelAnimationFrame(openFrame);
        cancelAnimationFrame(showFrame);
      };
    }

    setIsMenuVisible(false);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuRendered) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuRendered]);

  return (
    // z-40 keeps the bar above page content but below the menu overlay (z-50).
    // The top padding is the iOS safe-area inset, so on a notched phone the
    // bar's content clears the status area instead of sitting under it.
    <header className="sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)]">
      {/* The frosted panel is its own layer, drawn behind the nav and hanging
          past its bottom edge so it can dissolve instead of stopping at a
          line. It is masked rather than merely gradient-tinted: backdrop-blur
          applies uniformly across an element, so fading only the tint would
          still leave the blur itself cutting off hard. Masking fades the blur
          and the tint together. The nav sits above it, unmasked, so the
          labels stay fully opaque. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -bottom-12 bg-background/70 backdrop-blur-xl backdrop-saturate-150 mask-b-from-65% mask-b-to-100%"
      />
      <nav
        aria-label="Primary"
        className="relative grid h-(--nav-h) w-full grid-cols-4 items-center gap-4 px-(--gutter)"
      >
        {/* No `truncate`: its white-space:nowrap is exactly what blocks a
            two-line wrap on narrow screens. `wrap-break-word` replaces the
            clipping it used to provide, so an extreme width overflows into
            the next column instead of spilling past the page edge.
            `min-w-0` still has to stay — as a grid item this is blockified
            with min-width:auto, which would otherwise floor it at
            min-content and fight the wrap anyway. */}
        <Link
          href="/"
          className="flex min-h-11 min-w-0 items-center font-display text-xs leading-tight font-medium tracking-tight wrap-break-word sm:text-sm"
        >
          Santiago Saldivar
        </Link>

        {/* Placed here — inside <nav>, after the glass panel div above in
            DOM order — deliberately: the glass creates its own masked
            stacking context, so anything nested inside it would fade out
            along with the blur at the bottom of the bar. Sitting in <nav>
            instead paints the dial above the glass by plain source order. */}
        <ThemeDial />

        <Link
          href="#contact"
          className="flex min-h-11 w-fit items-center justify-self-center text-xs font-medium sm:text-sm"
        >
          Contact
        </Link>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={() => setIsMenuOpen(true)}
          className="flex min-h-11 w-fit items-center justify-self-end text-xs font-medium sm:text-sm"
        >
          Menu
        </button>
      </nav>

      {isMenuRendered && (
        <div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onTransitionEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.propertyName === "opacity" &&
              !isMenuVisible
            ) {
              setIsMenuRendered(false);
            }
          }}
          className={`fixed inset-0 z-50 flex flex-col bg-black text-white transition-opacity duration-300 ${
            isMenuVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Same height and gutter as the bar itself, so the close control
              lands exactly where the Menu label it replaced was. */}
          <div className="flex h-(--nav-h) w-full items-center justify-end px-(--gutter) pt-[env(safe-area-inset-top,0px)]">
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
                <path
                  d="M4 4L20 20M20 4L4 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <Link
              href="/archive"
              onClick={closeMenu}
              className="font-display text-2xl font-medium tracking-tight sm:text-4xl"
            >
              Archive
            </Link>
            <Link
              href="/about"
              onClick={closeMenu}
              className="font-display text-2xl font-medium tracking-tight sm:text-4xl"
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
