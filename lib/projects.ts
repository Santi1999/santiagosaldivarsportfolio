import type { StaticImageData } from "next/image";

// Static imports rather than string paths: Next resolves each file's true
// width/height (and a free blur placeholder) at build time, so no image
// slot below ever needs a hand-typed dimension, and a typo'd import path
// is a build error instead of a broken <img> at runtime.
import govGlanceHero from "@/public/projects/gov_glance.png";
import lucidLocationsHero from "@/public/projects/lucidlocations.png";
import superSiftHero from "@/public/projects/supersift.png";
import hamptonsHero from "@/public/projects/thingstodointhehamptons.png";
import topOffHero from "@/public/projects/topoff_ai.png";

/**
 * Up to four phone screens, left to right. A short array is fine — `[a, b]`
 * fills the first two frames and leaves the rest as Placeholders. A fifth
 * entry is a type error, not a silently ignored value.
 */
export type MobileSet = [
  first?: StaticImageData,
  second?: StaticImageData,
  third?: StaticImageData,
  fourth?: StaticImageData,
];

/**
 * Every image slot on a project page, in page order. A key here IS a slot —
 * omit it and that slot renders its labeled Placeholder instead of a broken
 * or zero-height image.
 */
export type ProjectMedia = {
  /** Hero — right two thirds of the split, top of the mobile stack. */
  hero?: StaticImageData;
  /** Carousel card + next-project card. Falls back to `hero` when absent. */
  thumb?: StaticImageData;
  /** Full-width image section. */
  fullWidth?: StaticImageData;
  /** Desktop interface, shown at 80% width. */
  desktopUI?: StaticImageData;
  /** The four mobile screens. */
  mobile?: MobileSet;
  /** Architecture diagram under the technical overview. */
  systemMap?: StaticImageData;
};

export type Project = {
  slug: string;
  title: string;
  /** Short line shown under the title in the carousel and hero. */
  tagline: string;
  /** Longer paragraph for the hero and overview sections. */
  description: string;
  year: string;
  role: string;
  stack: string[];
  /** All artwork for this project. See ProjectMedia for the slot list. */
  media: ProjectMedia;
  /** Short technical notes rendered in the system-overview section. */
  technical: { heading: string; body: string }[];
};

export const PROJECTS: Project[] = [
  {
    slug: "gov-glance",
    title: "Gov Glance",
    tagline: "Government activity, summarized and searchable.",
    description:
      "A civic transparency dashboard that pulls together government activity from multiple agencies and countries into a single readable feed.",
    year: "2024",
    role: "Design & Engineering",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Python"],
    media: { hero: govGlanceHero },
    technical: [
      {
        heading: "Ingestion",
        body: "Scheduled jobs normalize feeds from multiple government sources into a single schema.",
      },
      {
        heading: "Search",
        body: "Full-text indexing lets a reader filter activity by branch, agency, and country.",
      },
      {
        heading: "Delivery",
        body: "Statically generated pages with incremental updates keep the feed fast to load.",
      },
    ],
  },
  {
    slug: "lucid-locations",
    title: "Lucid Locations",
    tagline: "A location scouting and booking platform.",
    description:
      "A marketplace connecting productions with photogenic spaces, built around a visual-first browsing experience.",
    year: "2024",
    role: "Design & Engineering",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Stripe"],
    media: { hero: lucidLocationsHero },
    technical: [
      {
        heading: "Media pipeline",
        body: "Uploaded location photography is transcoded and served in modern formats at multiple sizes.",
      },
      {
        heading: "Booking",
        body: "Availability, holds, and payments are coordinated through a single reservation state machine.",
      },
      {
        heading: "Discovery",
        body: "Geospatial queries power map-based browsing and proximity search.",
      },
    ],
  },
  {
    slug: "supersift",
    title: "SuperSift",
    tagline: "A research engine that reads across sources.",
    description:
      "A research tool that queries multiple sources in parallel and lays the answers side by side so they can be compared directly.",
    year: "2025",
    role: "Design & Engineering",
    stack: ["Next.js", "TypeScript", "Claude API", "Vector search"],
    media: { hero: superSiftHero },
    technical: [
      {
        heading: "Parallel retrieval",
        body: "A single query fans out to several sources at once and streams results back as each returns.",
      },
      {
        heading: "Comparison view",
        body: "Responses render in aligned columns so differences between sources are visible at a glance.",
      },
      {
        heading: "Citations",
        body: "Every claim links back to the passage it came from.",
      },
    ],
  },
  {
    slug: "things-to-do-in-the-hamptons",
    title: "Things To Do In The Hamptons",
    tagline: "A local events guide for the East End.",
    description:
      "An editorial events guide surfacing what is happening locally, organized so a visitor can plan a weekend in a few minutes.",
    year: "2024",
    role: "Design & Engineering",
    stack: ["Next.js", "TypeScript", "MongoDB", "Contentful"],
    media: { hero: hamptonsHero },
    technical: [
      {
        heading: "Editorial workflow",
        body: "Events are curated through a CMS with scheduled publishing and featured placement.",
      },
      {
        heading: "Calendar model",
        body: "Recurring and multi-day events resolve into discrete dated entries for listing and filtering.",
      },
      {
        heading: "Performance",
        body: "Image-dense listings are served statically with lazy-loaded media below the fold.",
      },
    ],
  },
  {
    slug: "topoff-ai",
    title: "TopOff AI",
    tagline: "AI tooling for operational workflows.",
    description:
      "An applied-AI product that turns unstructured operational input into structured, reviewable output.",
    year: "2025",
    role: "Design & Engineering",
    stack: ["Next.js", "TypeScript", "Claude API", "Go"],
    media: { hero: topOffHero },
    technical: [
      {
        heading: "Extraction",
        body: "Model output is constrained to a typed schema so downstream systems can consume it directly.",
      },
      {
        heading: "Review loop",
        body: "Low-confidence extractions are routed to a human review queue before they are committed.",
      },
      {
        heading: "Evaluation",
        body: "A fixture suite scores prompt changes against labeled examples before they ship.",
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/** Wraps around, so the last project points back to the first. */
export function getNextProject(slug: string): Project {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  return PROJECTS[(index + 1) % PROJECTS.length];
}

/** The image the carousel card and the next-project card use. */
export function getThumb(project: Project): StaticImageData | undefined {
  return project.media.thumb ?? project.media.hero;
}
