import Link from "next/link";
import { signupsEnabled } from "@/lib/feature-flags";

export default function LandingPage() {
  const open = signupsEnabled();
  const primaryCta = open
    ? { href: "/signup", label: "Empezar gratis" }
    : { href: "/login", label: "Entrar a datABA" };
  const secondaryCta = open
    ? { href: "/login", label: "Ya tengo cuenta" }
    : { href: "mailto:team.databa@gmail.com?subject=Pido%20acceso%20a%20datABA", label: "Pedir invitación" };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FBF8F2] text-[#101418] [font-family:var(--font-geist-sans)]">
      {/* atmosphere: subtle grid + radial wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(16,20,24,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,20,24,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[720px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,166,154,0.35), rgba(20,166,154,0.05) 60%, transparent 80%)",
        }}
      />

      {/* NAV */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6">
          <Link href="/" className="group flex items-center gap-3">
            <Logomark />
            <span className="text-[18px] font-medium tracking-tight">
              dat<span className="[font-family:var(--font-fraunces)] font-semibold italic">ABA</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] [font-family:var(--font-jetbrains-mono)] uppercase tracking-[0.14em] text-[#101418]/70 md:flex">
            <a href="#producto" className="transition hover:text-[#101418]">Producto</a>
            <a href="#flujo" className="transition hover:text-[#101418]">Cómo funciona</a>
            <a href="#manifiesto" className="transition hover:text-[#101418]">Manifiesto</a>
            <a href="#precio" className="transition hover:text-[#101418]">Precio</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-[14px] text-[#101418]/80 transition hover:text-[#101418] sm:inline-block"
            >
              Iniciar sesión
            </Link>
            <Link
              href={primaryCta.href}
              className="group inline-flex items-center gap-2 rounded-full bg-[#101418] px-5 py-2.5 text-[14px] font-medium text-[#FBF8F2] transition hover:bg-[#14A69A] hover:text-[#101418]"
            >
              {primaryCta.label}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 pb-24 pt-12 lg:grid-cols-12 lg:gap-8 lg:pt-20">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#101418]/15 bg-white/60 px-3 py-1.5 [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.18em] text-[#101418]/70 backdrop-blur animate-[rise_0.7s_ease-out_both]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14A69A] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14A69A]" />
              </span>
              Hecho por terapeutas ABA · Argentina
            </div>

            <h1 className="mt-7 [font-family:var(--font-fraunces)] text-[clamp(2.6rem,6.2vw,5.4rem)] font-light leading-[0.98] tracking-[-0.025em] [font-variation-settings:'opsz'_144,'SOFT'_30]">
              <span className="block animate-[rise_0.7s_ease-out_0.05s_both]">La conducta</span>
              <span className="block animate-[rise_0.7s_ease-out_0.15s_both]">
                no espera.{" "}
                <span className="italic text-[#0F766E]">Tus datos</span>
              </span>
              <span className="block animate-[rise_0.7s_ease-out_0.25s_both]">
                <span className="italic text-[#0F766E]">tampoco.</span>
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-balance text-[17px] leading-[1.55] text-[#101418]/75 animate-[rise_0.7s_ease-out_0.35s_both]">
              datABA es el cuaderno de campo digital para profesionales de Análisis de Conducta Aplicada.
              Cronómetros que no se rinden, gráficos que se arman solos, y una sesión entera
              <span className="text-[#101418]"> sin una sola planilla en limpio.</span>
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4 animate-[rise_0.7s_ease-out_0.45s_both]">
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center gap-3 rounded-full bg-[#101418] px-6 py-4 text-[15px] font-medium text-[#FBF8F2] shadow-[0_10px_30px_-10px_rgba(16,20,24,0.4)] transition hover:bg-[#14A69A] hover:text-[#101418]"
              >
                {primaryCta.label}
                <ArrowRight />
              </Link>
              <Link
                href={secondaryCta.href}
                className="group inline-flex items-center gap-2 text-[15px] text-[#101418]/80 underline decoration-[#101418]/20 decoration-2 underline-offset-[6px] transition hover:text-[#0F766E] hover:decoration-[#0F766E]"
              >
                {secondaryCta.label}
              </Link>
            </div>

            {!open && (
              <p className="mt-5 max-w-md [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.16em] text-[#101418]/55 animate-[rise_0.7s_ease-out_0.55s_both]">
                · Acceso por invitación durante el período beta ·
              </p>
            )}
          </div>

          {/* App preview — live measurement card */}
          <div className="relative lg:col-span-5">
            <div className="relative animate-[rise_0.9s_ease-out_0.3s_both]">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-[#14A69A]/30 via-transparent to-[#F5C26B]/30 blur-2xl"
              />
              <SessionCardPreview />
            </div>
          </div>
        </div>

        {/* stats ticker */}
        <div className="relative border-y border-[#101418]/10 bg-[#101418] text-[#FBF8F2]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-y-4 px-6 py-5 [font-family:var(--font-jetbrains-mono)] text-[12px] uppercase tracking-[0.22em]">
            <Stat n="9" label="Métodos de medición" />
            <Divider />
            <Stat n="∞" label="Cronómetros paralelos" />
            <Divider />
            <Stat n="0ms" label="Latencia · Offline-first" />
            <Divider />
            <Stat n="CSV · PDF" label="Exportación clínica" />
          </div>
        </div>
      </section>

      {/* MANIFIESTO */}
      <section id="manifiesto" className="relative">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-28 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="sticky top-10 [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#101418]/60">
              01 / Manifiesto
            </p>
          </div>
          <div className="lg:col-span-9">
            <p className="[font-family:var(--font-fraunces)] text-[clamp(1.7rem,3vw,2.6rem)] font-light leading-[1.18] tracking-[-0.015em] text-[#101418]/90">
              Pasaste años estudiando análisis funcional, registro de eventos discretos y diseño de
              intervenciones. <span className="italic text-[#0F766E]">No deberías</span> pasar las
              noches transcribiendo planillas a Excel, recortando gráficos en Word y persiguiendo
              papelitos perdidos.
            </p>
            <p className="mt-8 max-w-2xl text-[16px] leading-[1.6] text-[#101418]/65">
              Construimos datABA con BCBAs que trabajan en clínicas, escuelas y hogares: una sola
              herramienta para registrar, analizar y compartir evidencia. Lo que hacés en sesión
              queda graficado antes de que termines de guardar.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES — asymmetric grid */}
      <section id="producto" className="relative">
        <div className="mx-auto max-w-[1240px] px-6 pb-16">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="[font-family:var(--font-fraunces)] text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-[-0.02em]">
              Una herramienta. <br />
              <span className="italic text-[#0F766E]">Todo el flujo clínico.</span>
            </h2>
            <span className="hidden [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#101418]/55 md:block">
              02 / Producto
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* big feature */}
            <FeatureCard
              size="lg"
              kicker="Registro en vivo"
              title="Cronómetros que no se rinden."
              body="Frecuencia, duración, latencia, intensidad, muestreo temporal, oportunidades, ABC, registro de eventos, anecdóticos. Nueve métodos científicos, una sola interfaz limpia. Corren en paralelo y sobreviven a la conexión."
              decoration={<FeatureClockDecoration />}
            />

            <FeatureCard
              kicker="Offline-first"
              title="Funciona aunque se caiga el wifi."
              body="La sesión sigue. Los datos se sincronizan cuando vuelve la red."
            />
            <FeatureCard
              kicker="Multi-clínica"
              title="Tu equipo, tu organización."
              body="Invitá colegas, asigná estudiantes. Cada clínica con sus datos aislados."
            />

            <FeatureCard
              kicker="Gráficos"
              title="Listos para reunión con familia."
              body="Líneas, barras, dispersión y combinados por método. Sin abrir Excel."
            />
            <FeatureCard
              kicker="Exportación"
              title="CSV y PDF en un click."
              body="Para análisis estadístico, supervisión o informe clínico mensual."
            />
            <FeatureCard
              kicker="Calendario"
              title="Tu agenda como punto de partida."
              body="Tocá un día y armás la sesión con el estudiante pre-cargado."
            />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="flujo" className="relative bg-[#101418] text-[#FBF8F2]">
        <div className="mx-auto max-w-[1240px] px-6 py-28">
          <div className="mb-16 flex items-end justify-between">
            <h2 className="[font-family:var(--font-fraunces)] text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.05] tracking-[-0.02em]">
              Tres pasos. <br />
              <span className="italic text-[#14A69A]">Cero fricción.</span>
            </h2>
            <span className="hidden [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#FBF8F2]/55 md:block">
              03 / Flujo
            </span>
          </div>

          <ol className="grid gap-x-8 gap-y-12 md:grid-cols-3">
            <Step
              n="01"
              title="Cargá tus estudiantes"
              body="Importás o creás el legajo en minutos. Definís objetivos conductuales y métodos por estudiante."
            />
            <Step
              n="02"
              title="Registrá en sesión"
              body="Abrís el cronómetro y trabajás. El sistema graba marcas exactas con timestamp. Olvidate del papel."
            />
            <Step
              n="03"
              title="Compartí evidencia"
              body="Generás reportes con gráficos por método y exportás CSV o PDF para la familia o supervisión."
            />
          </ol>
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="relative">
        <div className="mx-auto max-w-[1100px] px-6 py-28 text-center">
          <p className="[font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#101418]/55">
            04 / Por qué importa
          </p>
          <blockquote className="mt-8 [font-family:var(--font-fraunces)] text-[clamp(1.9rem,3.4vw,3rem)] font-light leading-[1.18] tracking-[-0.015em]">
            “Cada minuto que no estás tomando datos
            <span className="italic text-[#0F766E]"> es un minuto perdido </span>
            de la conducta que querés cambiar.”
          </blockquote>
          <p className="mt-6 [font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#101418]/60">
            — Principio rector de datABA
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="precio" className="relative">
        <div className="mx-auto max-w-[1240px] px-6 pb-28">
          <div className="relative overflow-hidden rounded-[28px] border border-[#101418]/10 bg-gradient-to-br from-[#0F766E] via-[#14A69A] to-[#0F766E] p-10 text-[#FBF8F2] sm:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), transparent 35%), radial-gradient(circle at 80% 70%, rgba(245,194,107,0.4), transparent 40%)",
              }}
            />
            <div className="relative grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="[font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#FBF8F2]/70">
                  Beta · Acceso temprano
                </p>
                <h2 className="mt-4 [font-family:var(--font-fraunces)] text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[0.98] tracking-[-0.025em]">
                  La próxima sesión <br />
                  <span className="italic">empieza sin papel.</span>
                </h2>
                <p className="mt-6 max-w-xl text-[16px] leading-[1.55] text-[#FBF8F2]/85">
                  Sumate a las clínicas que ya migraron sus mediciones. Tu primer estudiante cargado
                  en menos de cinco minutos.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
                <Link
                  href={primaryCta.href}
                  className="group inline-flex items-center justify-between gap-4 rounded-full bg-[#FBF8F2] px-7 py-5 text-[15px] font-medium text-[#101418] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)] transition hover:bg-[#101418] hover:text-[#FBF8F2]"
                >
                  {primaryCta.label}
                  <ArrowRight />
                </Link>
                <Link
                  href={secondaryCta.href}
                  className="text-[13px] text-[#FBF8F2]/80 underline decoration-[#FBF8F2]/30 decoration-2 underline-offset-[6px] transition hover:text-[#FBF8F2] hover:decoration-[#FBF8F2]"
                >
                  {secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#101418]/10">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Logomark />
            <span className="text-[14px] text-[#101418]/70">
              © {new Date().getFullYear()} datABA — Hecho para profesionales ABA.
            </span>
          </div>
          <div className="[font-family:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-[#101418]/55">
            Buenos Aires · Argentina
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tickUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="transition-transform group-hover:translate-x-0.5"
      aria-hidden
    >
      <path d="M1 7H13M13 7L7.5 1.5M13 7L7.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logomark() {
  return (
    <span
      aria-hidden
      className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#101418] text-[#FBF8F2]"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14L6 4L9 11L12 7L16 14" stroke="#14A69A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="4" r="1.4" fill="#F5C26B" />
        <circle cx="12" cy="7" r="1.4" fill="#F5C26B" />
      </svg>
    </span>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="[font-family:var(--font-fraunces)] text-[28px] font-light leading-none tracking-[-0.02em] text-[#14A69A]">
        {n}
      </span>
      <span className="text-[#FBF8F2]/70">{label}</span>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-4 w-px bg-[#FBF8F2]/20 md:block" />;
}

function FeatureCard({
  size = "sm",
  kicker,
  title,
  body,
  decoration,
}: {
  size?: "sm" | "lg";
  kicker: string;
  title: string;
  body: string;
  decoration?: React.ReactNode;
}) {
  const span =
    size === "lg" ? "md:col-span-4 md:row-span-2" : "md:col-span-2";
  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#101418]/10 bg-white/70 p-7 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#0F766E]/40 hover:bg-white ${span}`}
    >
      <div>
        <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.22em] text-[#0F766E]">
          {kicker}
        </p>
        <h3
          className={`mt-3 [font-family:var(--font-fraunces)] font-light leading-[1.1] tracking-[-0.015em] text-[#101418] ${
            size === "lg" ? "text-[clamp(1.6rem,2.6vw,2.2rem)]" : "text-[22px]"
          }`}
        >
          {title}
        </h3>
        <p className="mt-3 max-w-md text-[14.5px] leading-[1.55] text-[#101418]/65">
          {body}
        </p>
      </div>
      {decoration && <div className="mt-8">{decoration}</div>}
    </article>
  );
}

function FeatureClockDecoration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-[#101418]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(20,166,154,0.6), transparent 50%)",
        }}
      />
      <div className="relative flex h-full items-center gap-6 px-6 text-[#FBF8F2]">
        <div className="flex flex-col">
          <span className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.22em] text-[#FBF8F2]/60">
            Frecuencia
          </span>
          <span className="[font-family:var(--font-fraunces)] text-[44px] font-light leading-none tracking-[-0.02em]">
            14
          </span>
        </div>
        <div className="h-12 w-px bg-[#FBF8F2]/20" />
        <div className="flex flex-col">
          <span className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.22em] text-[#FBF8F2]/60">
            Duración
          </span>
          <span className="[font-family:var(--font-jetbrains-mono)] text-[26px] tracking-tight">
            03:42<span className="text-[#14A69A]">.18</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full border border-[#14A69A]/40 bg-[#14A69A]/10 px-3 py-1.5 [font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.18em] text-[#14A69A]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14A69A]" />
          Grabando
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="relative">
      <div className="[font-family:var(--font-fraunces)] text-[72px] font-extralight leading-none tracking-[-0.04em] text-[#14A69A]/70">
        {n}
      </div>
      <h3 className="mt-4 [font-family:var(--font-fraunces)] text-[26px] font-light leading-tight tracking-[-0.015em]">
        {title}
      </h3>
      <p className="mt-3 max-w-sm text-[14.5px] leading-[1.6] text-[#FBF8F2]/70">
        {body}
      </p>
    </li>
  );
}

function SessionCardPreview() {
  return (
    <div className="relative rotate-[1.2deg] rounded-[28px] border border-[#101418]/10 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(16,20,24,0.35)]">
      {/* header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.22em] text-[#101418]/55">
            Sesión · 14:32
          </p>
          <h4 className="mt-1 [font-family:var(--font-fraunces)] text-[22px] font-light tracking-[-0.015em] text-[#101418]">
            M. Álvarez · 7 años
          </h4>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#14A69A]/12 px-3 py-1.5 [font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.18em] text-[#0F766E]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14A69A]" />
          En vivo
        </span>
      </div>

      {/* parallel measurements */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniMeasure label="Petición" value="07" delta="+2" tone="teal" />
        <MiniMeasure label="Latencia" value="04.8s" delta="-1.1" tone="amber" />
        <MiniMeasure label="Duración" value="02:14" delta="·" tone="teal" />
        <MiniMeasure label="Oport." value="9/12" delta="75%" tone="amber" />
      </div>

      {/* sparkline */}
      <div className="mt-6 rounded-2xl border border-[#101418]/8 bg-[#FBF8F2] p-4">
        <div className="flex items-center justify-between">
          <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.22em] text-[#101418]/55">
            Tendencia · 7 sesiones
          </p>
          <p className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.18em] text-[#0F766E]">
            ↑ 38%
          </p>
        </div>
        <svg viewBox="0 0 240 70" className="mt-3 h-16 w-full">
          <defs>
            <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14A69A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14A69A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,55 L34,48 L68,52 L102,38 L136,42 L170,24 L204,28 L240,12 L240,70 L0,70 Z"
            fill="url(#spark)"
          />
          <path
            d="M0,55 L34,48 L68,52 L102,38 L136,42 L170,24 L204,28 L240,12"
            stroke="#0F766E"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {[0, 34, 68, 102, 136, 170, 204, 240].map((x, i) => (
            <circle key={i} cx={x} cy={[55, 48, 52, 38, 42, 24, 28, 12][i]} r="2.2" fill="#0F766E" />
          ))}
        </svg>
      </div>

      {/* footer */}
      <div className="mt-5 flex items-center justify-between [font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.18em] text-[#101418]/55">
        <span>4 métodos paralelos</span>
        <span className="text-[#0F766E]">guardado · offline ✓</span>
      </div>
    </div>
  );
}

function MiniMeasure({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "teal" | "amber";
}) {
  const accent = tone === "teal" ? "text-[#0F766E]" : "text-[#B4791F]";
  return (
    <div className="rounded-2xl border border-[#101418]/8 bg-[#FBF8F2] p-3.5">
      <div className="flex items-center justify-between">
        <span className="[font-family:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.18em] text-[#101418]/55">
          {label}
        </span>
        <span className={`[font-family:var(--font-jetbrains-mono)] text-[10px] ${accent}`}>{delta}</span>
      </div>
      <div className="mt-1.5 [font-family:var(--font-fraunces)] text-[26px] font-light leading-none tracking-[-0.015em] text-[#101418]">
        {value}
      </div>
    </div>
  );
}
