import type { Metadata } from "next";
import Placeholder from "@/components/Placeholder";

export const metadata: Metadata = {
  title: "About — Santiago Saldivar",
  description:
    "Born in Sag Harbor, raised by the East End. Washed tomatoes at 12, wrote code at night, and never stopped building.",
};

const RESUME_HREF = "/Santiago-Saldivar-Resume.pdf";

type Chapter = {
  title: string;
  body: string[];
  image?: { label: string; hint: string; className: string };
};

// Each chapter is one beat of the story. Photos are placeholders until real
// ones are dropped in — swap <Placeholder> for <Image> and keep the aspect.
const CHAPTERS: Chapter[] = [
  {
    title: "Tomato Twelves",
    body: [
      "First ever job was working with an older lady at her tomato stand as a 12 year old. That's where I learned that work doesn't care how old you are.",
    ],
    image: {
      label: "Photo — the farm / East End fields",
      hint: "Wide, golden-hour if you have it.",
      className: "aspect-4/3",
    },
  },
  {
    title: "A local artist, and a front-row seat.",
    body: [
      "Soon after, I started helping a local artist around her house. Small tasks, mostly, but I got to watch someone make a life out of making things. It stuck with me longer than I realized.",
      "Then came restaurants. A lot of them, for a lot of years. Plates, pace, pressure, people. If you can stay calm and kind on Memorial Day or Labor Day weekend in the Hamptons, you can handle just about anything.",
    ],
  },
  {
    title: "Jet Fuel & Vines",
    body: [
      "I worked at a vineyard, then at an airport, fueling planes, marshaling aircraft, carrying bags for people who flew in for the weekend. Different worlds with the same opportunity. The sky is the limit.",
    ],
    image: {
      label: "Photo — vineyard or airfield",
      hint: "Whichever feels more like you.",
      className: "aspect-3/2",
    },
  },
  {
    title: "School by day. Code by night.",
    body: [
      "I put myself through school at Suffolk County Community College, then Fordham, and served as an RA while I was at it. Whatever time was left, I spent teaching myself to code or going back home on the weekend to sump a fuel truck.",
    ],
  },
  {
    title: "Work by day.\nBuild by night.",
    body: [
      "Today I work as an IT Senior Audit Analyst on Fidelity's Innovation Team, building secure risk and fraud detection tools while leveraging AI. After hours I run and build Varsa Studio, and I make things for the place that made me.",
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col px-(--gutter) pb-24 sm:pb-40">
      {/* Resume — pinned to the top-right of the page content. Opens the PDF
          in a new tab; the browser's own viewer offers download from there. */}
      <div className="mt-10 flex justify-end sm:mt-12">
        <a
          href={RESUME_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 text-xs font-medium transition-colors hover:border-current sm:text-sm"
        >
          Resume
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            <path
              d="M7 17L17 7m0 0H8m9 0v9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <header className="mt-12 max-w-5xl sm:mt-20">
        <h1 className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
          I was raised by the East End, and I&rsquo;ve been working ever since.
        </h1>
      </header>

      <div className="mt-20 grid gap-16 sm:mt-32 sm:gap-28 lg:grid-cols-2 lg:gap-x-16">
        <Placeholder
          label="Portrait — Santiago"
          hint="Candid, unposed. Somewhere on the East End."
          className="aspect-4/5 lg:sticky lg:top-28 lg:self-start"
        />

        <div className="flex flex-col gap-16 sm:gap-24">
          <p className="max-w-xl text-lg leading-relaxed sm:text-xl">
            I&rsquo;m Mexican American, born and raised in Sag Harbor. My family,
            my neighbors, and the people who gave me my first jobs taught me
            what the work is worth.
          </p>

          {CHAPTERS.map((chapter) => (
            <section key={chapter.title} className="flex flex-col gap-5">
              <h2 className="font-display text-2xl leading-tight font-medium tracking-tight whitespace-pre-line text-balance sm:text-4xl">
                {chapter.title}
              </h2>
              <div className="flex max-w-xl flex-col gap-4 text-base leading-relaxed opacity-80 sm:text-lg">
                {chapter.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {chapter.image ? (
                <Placeholder
                  label={chapter.image.label}
                  hint={chapter.image.hint}
                  className={`mt-3 ${chapter.image.className}`}
                />
              ) : null}
            </section>
          ))}
        </div>
      </div>

      <footer className="mt-24 flex flex-col items-start gap-8 border-t border-current/15 pt-10 sm:mt-40">
        <p className="max-w-2xl font-display text-2xl leading-tight font-medium tracking-tight text-balance sm:text-4xl">
          If you need someone who gets it done&hellip; right.
        </p>
        <a
          href="https://varsastudio.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-6 text-sm font-medium transition-colors hover:border-current"
        >
          Let&rsquo;s talk
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            &rarr;
          </span>
        </a>
      </footer>
    </main>
  );
}
