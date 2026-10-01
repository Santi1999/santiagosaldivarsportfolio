import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectImage from "@/components/ProjectImage";
import { PROJECTS, getNextProject, getProject, getThumb } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: `${project.title} — Santiago Saldivar`, description: project.tagline };
}

const MOBILE_LABELS = ["Home", "Browse", "Detail", "Account"] as const;

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const nextProject = getNextProject(project.slug);

  return (
    <main className="flex w-full flex-col">
      {/* 1 — Hero: a split rather than an overlay. Copy occupies the left
          third, artwork the right two thirds, running to the screen edge.
          It fills the screen exactly — 100dvh less the sticky navbar above
          it — so the fold lands on this section's bottom edge.
          Phones invert this: column-reverse puts the artwork (last in the
          DOM) directly above the copy. Reversing visually rather than
          reordering the markup keeps the heading first in the document, so
          screen readers and search still meet the title before the image.
          Note the flexbox subtlety — column-reverse runs the main axis
          bottom-to-top, so justify-start is what packs the pair against the
          bottom of the screen; justify-end would throw them to the top.
          At lg, flex-row restores DOM order — copy left, artwork right —
          and bottom-aligns them. */}
      <section aria-label="Overview" className="w-full">
        <div className="flex min-h-[calc(100dvh-var(--nav-h)-env(safe-area-inset-top,0px))] w-full flex-col-reverse justify-start gap-6 px-(--gutter) pb-10 lg:flex-row lg:items-end lg:gap-0 lg:pb-14">
          {/* The row carries the gutter, so both columns inherit it and the
              artwork stops the same distance from the right edge that the
              copy sits from the left. Widths sum to exactly 100% and gap is
              zeroed at lg, so the two columns never overflow the row. */}
          <div className="flex w-full min-w-0 flex-col lg:w-1/3 lg:pr-10">
            <h1 className="font-display text-xl font-medium tracking-tight sm:text-2xl lg:text-3xl">
              {project.title}
            </h1>
            <p className="mt-3 max-w-prose text-xs opacity-70 sm:text-sm">
              {project.description}
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[11px] sm:text-xs">
              <div className="min-w-0">
                <dt className="opacity-50">Year</dt>
                <dd className="mt-0.5 font-medium">{project.year}</dd>
              </div>
              <div className="min-w-0">
                <dt className="opacity-50">Role</dt>
                <dd className="mt-0.5 font-medium">{project.role}</dd>
              </div>
              <div className="min-w-0">
                <dt className="opacity-50">Stack</dt>
                <dd className="mt-0.5 font-medium wrap-break-word">
                  {project.stack.join(", ")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Width lives on this wrapper, not on ProjectImage's
              frameClassName: that prop only reaches the filled branch, and
              Placeholder's own `w-full` needs a sized parent to fill in
              either state — otherwise an empty hero would lose the lg:w-2/3
              split the moment no image was supplied yet. */}
          <div className="w-full lg:w-2/3">
            <ProjectImage
              image={project.media.hero}
              label="Hero"
              hint="Wide product shot for the top of the page."
              alt={`${project.title} — product overview`}
              sizes="(min-width: 1024px) 67vw, 100vw"
              ratio="aspect-4/3 sm:aspect-2/1"
              preload
            />
          </div>
        </div>
      </section>

      {/* 2 — Full-width image view, held to the shared gutter like
          everything else rather than bleeding to the edge. */}
      <section aria-label="Full image view" className="w-full pt-16 sm:pt-24">
        <div className="w-full px-(--gutter)">
          <ProjectImage
            image={project.media.fullWidth}
            label="Full-width image"
            hint="Wide hero shot of the product."
            alt={`${project.title} — full-width view`}
            sizes="100vw"
            ratio="aspect-4/3 sm:aspect-2/1"
          />
        </div>
      </section>

      {/* 3 — Desktop UI, held at 80% of the viewport so it reads as a full
          interface view without touching the edges. */}
      <section aria-label="Interface view" className="w-full pt-16 sm:pt-24">
        <div className="mx-auto w-[90%] sm:w-4/5">
          <ProjectImage
            image={project.media.desktopUI}
            label="Full UI view"
            hint="Complete desktop interface, shown at 80% width."
            alt={`${project.title} — complete desktop interface`}
            sizes="(min-width: 640px) 80vw, 90vw"
            ratio="aspect-4/3 sm:aspect-16/10"
          />
        </div>
      </section>

      {/* 4 — Four mobile screens. Two-up on phones rather than one-up: at
          full width a 9:19 frame is taller than the viewport, which would
          turn this section into several screens of scrolling on its own.
          items-start: grid's default stretch would otherwise force a
          Placeholder to match a taller real screenshot sitting next to it
          in the same row, once a project has some slots filled and others
          empty. */}
      <section aria-label="Mobile views" className="w-full pt-16 sm:pt-24">
        <div className="w-full px-(--gutter)">
          <h2 className="font-display text-sm font-medium tracking-tight sm:text-base">
            Mobile
          </h2>
          <div className="mt-6 grid grid-cols-2 items-start gap-4 lg:grid-cols-4">
            {MOBILE_LABELS.map((label, i) => (
              <ProjectImage
                key={label}
                image={project.media.mobile?.[i]}
                label={label}
                alt={`${project.title} — ${label.toLowerCase()} screen`}
                sizes="(min-width: 1024px) 25vw, 50vw"
                ratio="aspect-9/19"
                frameClassName="rounded-2xl border border-black/15 dark:border-white/20"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Technical overview and system map. */}
      <section aria-label="Technical overview" className="w-full pt-16 sm:pt-24">
        <div className="w-full px-(--gutter)">
          <h2 className="font-display text-sm font-medium tracking-tight sm:text-base">
            Technical overview
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            {project.technical.map((item) => (
              <div key={item.heading} className="min-w-0">
                <h3 className="text-xs font-medium sm:text-sm">{item.heading}</h3>
                <p className="mt-2 text-xs opacity-70 sm:text-sm">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <ProjectImage
              image={project.media.systemMap}
              label="System map"
              hint="Architecture diagram: services, data stores, and request flow."
              alt={`${project.title} — system architecture`}
              sizes="100vw"
              ratio="aspect-4/3 sm:aspect-21/9"
            />
          </div>
        </div>
      </section>

      {/* 6 — Next project: label and name on the left, artwork on the right. */}
      <section aria-label="Next project" className="w-full pt-16 sm:pt-24">
        <Link
          href={`/projects/${nextProject.slug}`}
          className="group block w-full border-t border-black/10 py-10 dark:border-white/15"
        >
          <div className="flex w-full flex-col gap-6 px-(--gutter) md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] tracking-wide uppercase opacity-50">Next project</p>
              <p className="mt-2 font-display text-lg font-medium tracking-tight sm:text-2xl">
                {nextProject.title}
              </p>
              <p className="mt-2 max-w-prose text-xs opacity-70 sm:text-sm">{nextProject.tagline}</p>
            </div>

            {/* Same reasoning as the hero above: width and shrink go on the
                wrapper so they hold regardless of which branch renders. */}
            <div className="w-full shrink-0 md:w-2/5">
              <ProjectImage
                image={getThumb(nextProject)}
                label="Next project thumbnail"
                alt={nextProject.title}
                sizes="(min-width: 768px) 40vw, 100vw"
                ratio="aspect-2/1"
                frameClassName="rounded-2xl border border-black/15 dark:border-white/20"
              />
            </div>
          </div>
        </Link>
      </section>

      <div className="h-[max(3rem,env(safe-area-inset-bottom))]" />
    </main>
  );
}
