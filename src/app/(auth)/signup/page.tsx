import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Kicker } from "@/components/marketing/brand";
import { signupsEnabled } from "@/lib/feature-flags";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  const open = signupsEnabled();

  if (!open) {
    return (
      <AuthShell
        kicker="Acceso · Beta cerrada"
        title={
          <>
            Registro <span className="italic text-teal-deep">por invitación.</span>
          </>
        }
        subtitle="Por ahora datABA opera en beta privada. Si necesitás acceso, escribinos y te mandamos un link."
        footer={
          <p>
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-teal-deep underline decoration-teal-deep/30 decoration-2 underline-offset-[5px] transition hover:decoration-teal-deep"
            >
              Iniciar sesión
            </Link>
          </p>
        }
      >
        <a
          href="mailto:team.databa@gmail.com?subject=Pido%20invitaci%C3%B3n%20a%20datABA"
          className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-4 text-[15px] font-medium text-cream transition hover:bg-teal-bright hover:text-ink"
        >
          Pedir invitación
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Tu primera sesión digital"
      title={
        <>
          Empezá <span className="italic text-teal-deep">sin papel.</span>
        </>
      }
      subtitle="Cinco minutos. Cargás tu primer estudiante y la próxima sesión queda registrada en datos limpios."
      footer={
        <p>
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-teal-deep underline decoration-teal-deep/30 decoration-2 underline-offset-[5px] transition hover:decoration-teal-deep"
          >
            Iniciar sesión
          </Link>
        </p>
      }
      aside={
        <div className="space-y-3 lg:pt-24">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-white/70 p-5 backdrop-blur"
            >
              <span className="font-display text-[40px] font-extralight leading-none tracking-[-0.04em] text-teal-bright/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <Kicker>{s.kicker}</Kicker>
                <h3 className="mt-1 font-display text-[18px] font-light leading-tight tracking-[-0.015em] text-ink">
                  {s.title}
                </h3>
                <p className="mt-1 text-[13px] text-ink/60">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}

const steps = [
  { kicker: "Cuenta", title: "Creás tu organización", body: "Quedás como propietario. Podés invitar al equipo después." },
  { kicker: "Estudiantes", title: "Cargás el primer legajo", body: "Color, objetivos y métodos. Listo en minutos." },
  { kicker: "Sesión", title: "Abrís cronómetros y trabajás", body: "Todo se graba con timestamp exacto. Sin planillas." },
];
