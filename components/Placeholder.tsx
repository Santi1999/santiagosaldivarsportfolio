type PlaceholderProps = {
  /** What belongs here, e.g. "Desktop UI — dashboard". */
  label: string;
  /** Optional second line with guidance on the asset itself. */
  hint?: string;
  /** Aspect ratio / sizing utilities, e.g. "aspect-3/4". */
  className?: string;
};

/**
 * A labeled stand-in for artwork that has not been produced yet. Deliberately
 * dashed and low-contrast so it never reads as finished design, and always
 * labeled so it is obvious what asset the slot is waiting for.
 */
export default function Placeholder({ label, hint, className = "" }: PlaceholderProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/3 p-4 text-center dark:border-white/25 dark:bg-white/4 ${className}`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="opacity-30"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L3 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="min-w-0 text-xs font-medium tracking-wide uppercase opacity-60">
        {label}
      </span>
      {hint ? <span className="min-w-0 max-w-xs text-xs opacity-40">{hint}</span> : null}
    </div>
  );
}
