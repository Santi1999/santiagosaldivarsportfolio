"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeDial from "@/components/ThemeDial";

const MENU_LINKS = [
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Drives the menu links' enter transition only — the full-screen overlay
  // itself mounts and unmounts instantly with no transition. Animating that
  // overlay (even just fading it) is what left iOS Safari's status-bar strip
  // stuck black after close, so it stays untouched.
  const [areLinksVisible, setAreLinksVisible] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  // Mount the links in their hidden state first, then flip to visible a
  // couple of frames later so the browser has a "from" state to transition
  // out of — a single render with the final classes already applied never
  // animates. Double rAF so the first paint has definitely committed.
  useEffect(() => {
    if (!isMenuOpen) {
      setAreLinksVisible(false);
      return;
    }

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAreLinksVisible(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    // z-40 keeps the bar above page content but below the menu overlay (z-50).
    // The top padding is the iOS safe-area inset, which is 0 in a normal
    // browser tab and only becomes non-zero if the page ever runs edge-to-edge
    // under the notch (standalone mode, which needs a manifest).
    //
    // bg-background/2 is what lets iOS Safari's TOP status strip follow the
    // theme dial live — and it is deliberately invisible. Safari 26 tints that
    // strip from the first fixed/sticky element at the top edge, which is this
    // header. WebKit (LocalFrameView::fixedContainerEdges) reads that
    // element's own background-color fresh on every re-sample; but if the
    // color is transparent it instead reuses the colour from its last sample
    // for as long as the same element stays the container. This header was
    // fully transparent (the tint lives on the sibling div below), so the
    // strip kept the colour the page loaded with, and only a reload — which
    // clears that memory — refreshed it.
    //
    // A 2% tint of --background is enough to count as "visible". It also
    // costs nothing on screen: for any colour under 75% opacity WebKit blends
    // it over the live page background, and this tint IS the page background,
    // so the result is the page background. The bottom toolbar never had this
    // problem because the page's background colour reaches it on every commit
    // with no sampling in between.
    //
    // Don't put a *different* background on the nav inside: two differing
    // colours in the sampled chain make WebKit give up and sample nothing.
    // And this is the sticky <header> itself, not the glass div — the glass
    // is a sibling of nav, so it is never part of that chain.
    <header className="sticky top-0 z-40 w-full bg-background/2 pt-[env(safe-area-inset-top)]">
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

      {/* Mounts and unmounts instantly. No transition, no opacity fade, no
          display toggle left behind on this element — see the note on
          areLinksVisible above. Only the links inside animate.

          bg-background rather than a flat black: in a browser tab the
          status-bar strip is Safari's chrome showing the page background,
          and page CSS cannot colour it (see the header comment above). A
          black menu therefore always sits under a mismatched band. Taking
          the dial's own background instead blends the two with no hack,
          and keeps blending at every point of the dial's travel. */}
      {isMenuOpen && (
        <div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
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
            {MENU_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                style={{ transitionDelay: `${index * 75}ms` }}
                className={`font-display text-2xl font-medium tracking-tight transition-all duration-300 ease-out sm:text-4xl ${
                  areLinksVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
