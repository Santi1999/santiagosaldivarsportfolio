"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import Placeholder from "@/components/Placeholder";
import { PROJECTS, getThumb } from "@/lib/projects";

// Multiple copies of the set let the scroller be silently repositioned from a
// clone back into the real (middle) copy, so scrolling in either direction
// loops forever without a visible seam. Two clones on each side (rather than
// just one) give a fast fling enough buffer to be caught mid-scroll before it
// could ever reach the true, clamped end of the scrollable area. Only the
// first card of the "real" and "post" copies are tagged, as anchors for
// measuring the exact copy width instead of relying on scrollWidth math,
// which drifts from the true card positions by a few pixels.
const COPIES = ["pre2", "pre", "real", "post", "post2"] as const;
const LOOPED_PROJECTS = COPIES.flatMap((copy) =>
  PROJECTS.map((project, i) => ({
    key: `${copy}-${project.slug}`,
    project,
    isReal: copy === "real",
    copyStart: i === 0 ? copy : undefined,
  }))
);

export default function PosterCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<{ baseline: number; setWidth: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Measured once per layout rather than per scroll event: reading
    // offsetLeft forces a synchronous layout, which is too costly to do on
    // every tick of a fling.
    const measure = () => {
      const realStartEl = scroller.querySelector<HTMLElement>('[data-copy-start="real"]');
      const postStartEl = scroller.querySelector<HTMLElement>('[data-copy-start="post"]');
      if (!realStartEl || !postStartEl) return;
      const realStart = realStartEl.offsetLeft;
      // Scrolling to a child's offsetLeft parks it flush against the
      // container edge, swallowing the container's own left padding.
      // Backing off by that padding keeps the first card on the same
      // gutter as the rest of the page at every breakpoint.
      const paddingLeft = parseFloat(getComputedStyle(scroller).paddingLeft) || 0;
      metricsRef.current = {
        baseline: realStart - paddingLeft,
        setWidth: postStartEl.offsetLeft - realStart,
      };
    };

    const recenter = () => {
      measure();
      if (metricsRef.current) {
        // behavior "instant" overrides any ambient CSS scroll-behavior so
        // this lands in a single frame instead of animating.
        scroller.scrollTo({ left: metricsRef.current.baseline, behavior: "instant" });
      }
    };
    recenter();

    // Runs on every scroll tick, not debounced: a fling emits a continuous
    // stream of scroll events with no pause, so a deferred check would not
    // get a chance to run until the user had already hit the real end of
    // the track and felt it stop dead. Because every copy renders identical
    // content, shifting by exactly one copy-width mid-scroll is invisible,
    // and it preserves the user's momentum rather than interrupting it.
    const handleScroll = () => {
      const metrics = metricsRef.current;
      if (!metrics) return;
      const { baseline, setWidth } = metrics;

      let distance = scroller.scrollLeft - baseline;
      if (distance < -setWidth / 2) {
        scroller.scrollTo({ left: scroller.scrollLeft + setWidth, behavior: "instant" });
        distance += setWidth;
      } else if (distance > setWidth * 1.5) {
        scroller.scrollTo({ left: scroller.scrollLeft - setWidth, behavior: "instant" });
        distance -= setWidth;
      }

      const step = setWidth / PROJECTS.length;
      const raw = Math.round(distance / step) % PROJECTS.length;
      setActiveIndex((raw + PROJECTS.length) % PROJECTS.length);
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(recenter, 150);
    });
    resizeObserver.observe(scroller);

    // A trackpad's vertical swipe reports as wheel deltaY; redirect it into
    // horizontal scroll so both swipe directions drive the carousel.
    // Horizontal swipes (deltaX-dominant) are left alone -- the browser
    // already scrolls this x-auto container natively for those.
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
    };
    scroller.addEventListener("wheel", handleWheel, { passive: false });

    // Touch has no equivalent of a wheel event: a vertical finger drag over
    // an x-only overflow container is simply not scrollable by default, so
    // it falls through to scroll the page instead. To make a vertical swipe
    // move the carousel like a horizontal one would, this drags scrollLeft
    // manually once a gesture reveals itself as vertical (checked once,
    // right after the drag clears a small threshold, then held for the rest
    // of that gesture so it can't flip mid-swipe). A horizontal-dominant
    // gesture is left untouched so native scrolling -- and its momentum --
    // still applies exactly as it already does.
    let touchStartX = 0;
    let touchStartY = 0;
    let dragStartScrollLeft = 0;
    let verticalDrag = false;
    let axisLocked = false;
    let lastSampleT = 0;
    let lastSampleY = 0;
    let velocity = 0;
    let momentumFrame = 0;

    const stopMomentum = () => {
      if (momentumFrame) cancelAnimationFrame(momentumFrame);
      momentumFrame = 0;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      stopMomentum();
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      dragStartScrollLeft = scroller.scrollLeft;
      axisLocked = false;
      verticalDrag = false;
      lastSampleT = event.timeStamp;
      lastSampleY = touch.clientY;
      velocity = 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (!axisLocked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axisLocked = true;
        verticalDrag = Math.abs(dy) > Math.abs(dx);
      }

      if (!verticalDrag) return; // native horizontal scroll handles this gesture

      event.preventDefault();
      scroller.scrollLeft = dragStartScrollLeft - dy;

      const dt = event.timeStamp - lastSampleT;
      if (dt > 0) velocity = (touch.clientY - lastSampleY) / dt;
      lastSampleT = event.timeStamp;
      lastSampleY = touch.clientY;
    };

    const handleTouchEnd = () => {
      if (!verticalDrag || Math.abs(velocity) < 0.02) return;
      const friction = 0.95;
      const step = () => {
        velocity *= friction;
        scroller.scrollLeft -= velocity * 16;
        if (Math.abs(velocity) > 0.01) {
          momentumFrame = requestAnimationFrame(step);
        } else {
          momentumFrame = 0;
        }
      };
      momentumFrame = requestAnimationFrame(step);
    };

    scroller.addEventListener("touchstart", handleTouchStart, { passive: true });
    scroller.addEventListener("touchmove", handleTouchMove, { passive: false });
    scroller.addEventListener("touchend", handleTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      scroller.removeEventListener("wheel", handleWheel);
      scroller.removeEventListener("touchstart", handleTouchStart);
      scroller.removeEventListener("touchmove", handleTouchMove);
      scroller.removeEventListener("touchend", handleTouchEnd);
      scroller.removeEventListener("touchcancel", handleTouchEnd);
      stopMomentum();
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <section
      aria-label="Featured projects"
      className="w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full px-(--gutter) pb-3">
        <p className="font-display text-xs font-medium tabular-nums">
          {activeIndex + 1} / {PROJECTS.length}
        </p>
      </div>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Project carousel, scrollable"
        className="flex w-full gap-4 overflow-x-auto px-(--gutter) pb-2 scrollbar-none"
      >
        {LOOPED_PROJECTS.map(({ key, project, isReal, copyStart }) => {
          const thumb = getThumb(project);
          return (
            <article
              key={key}
              data-poster-card
              data-copy-start={copyStart}
              aria-hidden={isReal ? undefined : true}
              className="flex w-[92%] shrink-0 flex-col gap-3 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]"
            >
              <Link
                href={`/projects/${project.slug}`}
                tabIndex={isReal ? undefined : -1}
                className="flex min-w-0 flex-col gap-3"
              >
                <span className="text-xs font-medium sm:text-sm">{project.title}</span>
                {/* Phones get a deliberately taller 4:3 frame so a card has
                    real presence on a narrow screen — the surrounding space is
                    otherwise mostly empty. These screenshots are ~2:1, so the
                    taller frame does crop their left and right edges; that is
                    accepted here because this is a thumbnail, and the project
                    page shows the same image whole. From sm up the frame
                    matches the source ratio and barely crops at all. This
                    wrapper stays unconditionally sized regardless of whether
                    a thumb exists yet, so an empty slot can never collapse
                    the `fill` image inside it to zero height. */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-black/15 bg-black/3 sm:aspect-2/1 dark:border-white/20 dark:bg-white/4">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={project.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw"
                      className="object-cover"
                    />
                  ) : (
                    <Placeholder label={project.title} className="absolute inset-0" />
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
