import Link from "next/link";
import { Wordmark, Kicker } from "./brand";

export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream text-ink font-sans">
      {/* atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(16,20,24,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,20,24,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 55% at 50% -10%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[720px] w-[1100px] -translate-x-1/2 rounded-full opacity-55 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,166,154,0.32), rgba(20,166,154,0.04) 60%, transparent 80%)",
        }}
      />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6">
          <Wordmark />
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 transition hover:text-ink"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <section className={aside ? "lg:col-span-7" : "lg:col-span-12 lg:mx-auto lg:max-w-2xl"}>
            {kicker && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-bright" />
                <Kicker className="text-ink/70">{kicker}</Kicker>
              </div>
            )}
            <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-light leading-[1] tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-xl text-[16px] leading-[1.55] text-ink/70">
                {subtitle}
              </p>
            )}

            <div className="mt-10">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-ink/10 pt-6 text-[14px] text-ink/65">
                {footer}
              </div>
            )}
          </section>

          {aside && <aside className="lg:col-span-5">{aside}</aside>}
        </div>
      </main>

      <footer className="relative z-10 border-t border-ink/10">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-3 px-6 py-6 md:flex-row md:items-center">
          <span className="text-[13px] text-ink/55">
            © {new Date().getFullYear()} datABA
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
            Buenos Aires · Argentina
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Editorial form primitives ---------- */

export function EditorialField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.22em] text-ink/65">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-ink/55">{hint}</p>}
    </div>
  );
}

export const editorialInputClass =
  "block w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/35 outline-none transition focus:border-teal-deep focus:bg-white focus:ring-4 focus:ring-teal-bright/15";

export function EditorialButton({
  children,
  type = "button",
  disabled,
  tone = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "outline";
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-ink text-cream hover:bg-teal-bright hover:text-ink disabled:opacity-50 disabled:hover:bg-ink disabled:hover:text-cream",
    outline:
      "border border-ink/15 bg-white/70 text-ink hover:border-teal-deep hover:bg-white",
    ghost: "text-ink/80 hover:text-ink",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium transition ${styles[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EditorialError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
      {children}
    </div>
  );
}
