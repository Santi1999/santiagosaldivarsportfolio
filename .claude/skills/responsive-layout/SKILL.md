---
name: responsive-layout
description: Use when writing or reviewing Next.js/TypeScript UI code (components, pages, layouts) to make sure the layout itself is implemented correctly across mobile, tablet, and desktop — correct use of flex/grid, no fixed-width or fixed-height containers, no overflow bugs, proper breakpoint usage, safe-area handling, touch targets. This is about layout CORRECTNESS, not visual branding, color, or copy style.
---

# Responsive Layout Correctness (Next.js / TypeScript)

This skill is scoped narrowly: it is not about aesthetics, brand voice, or design taste. It is a
checklist for whether the HTML/CSS/TSX structure will actually lay out correctly on phone, tablet,
and desktop viewports. Apply it to every component or page that renders visible layout — navbars,
grids, cards, forms, modals — before considering the work done.

## 0. Detect the project's styling approach first

Before writing any CSS, check what's already in use — don't default to a guess:
- Tailwind: look for `tailwind.config.*` and `className="..."` utility strings in existing files.
- CSS Modules: look for `*.module.css` imports.
- CSS-in-JS: look for `styled-components`, `@emotion`, `vanilla-extract`, etc. in package.json.
- Plain global CSS: a single `globals.css` / `app/*.css` with plain selectors.

Match the existing pattern exactly. Every rule below is phrased so it applies regardless of which
one is in use — read "the equivalent in this project's styling system" wherever a CSS property is
named.

## 1. Mobile-first, not desktop-first

Write the base (no media query / no breakpoint prefix) styles for the *narrowest* viewport first,
then layer on wider-viewport overrides. Never write full desktop styles first and try to patch
mobile in afterward with overrides — that's the #1 cause of "looks good on desktop, breaks on
mobile."

- Tailwind: unprefixed classes are the mobile baseline; `sm:`/`md:`/`lg:`/`xl:` add wider-viewport
  overrides on top. Never put the desktop layout in unprefixed classes and try to override it down.
- Plain CSS: base rule with no media query = mobile. `@media (min-width: …)` blocks add complexity
  as viewport grows. Avoid `max-width` media queries as the primary structure.

## 2. Breakpoints

Use a standard, small set of breakpoints — don't invent arbitrary numbers per component:

| Breakpoint | Width      | Represents               |
|------------|-----------|---------------------------|
| (base)     | 0–639px   | phones                     |
| sm         | 640px     | large phones / small tablets (portrait) |
| md         | 768px     | tablets (iPad portrait)    |
| lg         | 1024px    | tablets landscape / small laptop (iPad landscape lands right here — always check this width explicitly) |
| xl         | 1280px+   | desktop                   |

iPad-class bugs specifically live at 768px and 1024px — if a layout was only checked at ~375px
(phone) and ~1440px (desktop), these two widths are the gap where breakage hides. Always check
both explicitly, not just phone and desktop.

## 3. Layout primitives: use flex/grid, not fixed dimensions

- Never set a fixed `width` (or Tailwind `w-[500px]`) on a container meant to hold responsive
  content — use `max-width` + `width: 100%`, or a grid/flex sizing rule (`flex: 1`, `minmax()`,
  `fr` units).
- Never set a fixed `height` on a container whose content can grow (nav bars, cards, modals) —
  use `min-height` if a floor is needed, and let content define the rest.
- Use `flex-wrap: wrap` (Tailwind `flex-wrap`) on any horizontal flex row that must survive
  narrow viewports — an unwrapped row is the classic "navbar looks fine until you shrink the
  window" bug.
- Grids: define column count with `repeat(auto-fit, minmax(…))` or explicit per-breakpoint column
  counts (e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), not a fixed column count that never
  changes.
- Prefer `gap` (flex/grid gap) over manual margins between siblings — margins compound
  unpredictably when wrapping occurs at different breakpoints.

## 4. Text and content that can overflow

- Any flex or grid child that contains text must have `min-width: 0` (Tailwind `min-w-0`) or text
  truncation/wrapping will silently fail and blow out the layout — this is the single most common
  invisible bug in flex-based navbars and cards.
- Long unbroken strings (URLs, emails, IDs) need `overflow-wrap: break-word` / `break-words`, or
  `truncate`/`line-clamp-*` if a fixed number of lines is wanted.
- Never assume content length — check the component with genuinely long input (long names, long
  nav labels) and empty input, not just placeholder lorem ipsum sized to fit.

## 5. Navigation bars specifically

Navbars are the highest-bug-rate component. Checklist:
- The nav row itself must wrap or collapse (hamburger/drawer) below whatever width its items no
  longer fit — measure this, don't guess a breakpoint.
- Logo/brand element: fixed intrinsic size (`width`+`height` on `<Image>`), never let it stretch.
- Nav links container: `flex-wrap` or swap to a collapsed menu; never let it force horizontal
  scroll on the page.
- Any icon-only button in the nav (menu toggle, search icon) needs an explicit tap target of at
  least 44×44px, even if the icon itself is smaller — pad the button, not just the icon.
- Sticky/fixed navbars: verify they don't cover content underneath on short mobile viewports
  (test at ~600px height, landscape phone), and account for safe-area insets on iOS (see §7).

## 6. Images (Next.js `<Image>`)

- Always provide explicit `width`/`height` (or `fill` with a sized, `position: relative` parent) —
  missing dimensions cause layout shift that is often only visible on mobile where the fold is
  closer.
- With `fill`, the parent element must have a defined size/aspect-ratio; a `fill` image inside an
  unconstrained flex child will collapse to zero height.
- Use `sizes` prop matching actual rendered width at each breakpoint when the image isn't the same
  width at all viewports — otherwise Next.js serves an oversized image to mobile.

## 7. Touch, viewport, and safe areas

- Never disable pinch-zoom: don't set `user-scalable=no` or `maximum-scale=1` in the viewport meta
  tag.
- All interactive elements (buttons, links, form controls) need a minimum 44×44px hit target on
  touch, even if the visual element is smaller.
- For any full-bleed fixed/sticky element (headers, bottom nav, drawers), account for
  `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` so content doesn't sit under the iOS
  notch or home indicator.
- Avoid layouts that rely on `100vh` for a full-screen section on mobile — mobile browser chrome
  changes viewport height dynamically; use `100dvh` (dynamic viewport height) instead, with a
  `100vh` fallback for older browsers.

## 8. Verifying the work

Before considering a component done, explicitly check it at:
1. ~375px width (small phone)
2. ~768px width (iPad portrait / tablet)
3. ~1024px width (iPad landscape — do not skip this one)
4. ~1440px+ width (desktop)

If screenshots or a browser preview are available in the environment, take one at each width
rather than reasoning about it abstractly — many of these bugs (wrap failure, overflow, zero-height
`fill` images) are only obvious visually.

## Anti-patterns (flag these on review)

- Fixed pixel `width`/`height` on a container meant to be responsive
- Flex row without `flex-wrap` that holds a variable number of items (nav, tag lists, toolbars)
- Flex/grid text child missing `min-w-0` / `min-width: 0`
- `<Image>` without dimensions or without a sized parent when using `fill`
- `100vh` used for a mobile full-screen section instead of `100dvh`
- Icon-only interactive element with a hit target smaller than 44×44px
- `user-scalable=no` / `maximum-scale=1` in viewport meta
- A layout only verified at one viewport width before calling it done
- Column count or breakpoint values invented ad hoc per-component instead of using a shared scale
