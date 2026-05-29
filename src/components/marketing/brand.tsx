import Link from "next/link";

export function Logomark({ size = 36 }: { size?: number }) {
  const inner = Math.round(size * 0.5);
  return (
    <span
      aria-hidden
      className="relative grid place-items-center rounded-xl bg-ink text-cream"
      style={{ height: size, width: size }}
    >
      <svg width={inner} height={inner} viewBox="0 0 18 18" fill="none">
        <path
          d="M2 14L6 4L9 11L12 7L16 14"
          stroke="var(--color-teal-bright)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="4" r="1.4" fill="var(--color-amber)" />
        <circle cx="12" cy="7" r="1.4" fill="var(--color-amber)" />
      </svg>
    </span>
  );
}

export function Wordmark({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <Logomark size={size} />
      <span className="text-[18px] font-medium tracking-tight text-ink">
        dat<span className="font-display font-semibold italic">ABA</span>
      </span>
    </Link>
  );
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`transition-transform group-hover:translate-x-0.5 ${className}`}
      aria-hidden
    >
      <path
        d="M1 7H13M13 7L7.5 1.5M13 7L7.5 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.22em] text-ink/60 ${className}`}
    >
      {children}
    </span>
  );
}
