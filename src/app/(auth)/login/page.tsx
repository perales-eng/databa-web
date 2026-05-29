import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Kicker } from "@/components/marketing/brand";
import { signupsEnabled } from "@/lib/feature-flags";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const open = signupsEnabled();

  return (
    <AuthShell
      kicker="Acceso · Clínica"
      title={
        <>
          Bienvenido <span className="italic text-teal-deep">de vuelta.</span>
        </>
      }
      subtitle="Entrá a tu organización para seguir registrando sesiones y revisar el progreso de tus estudiantes."
      footer={
        open ? (
          <p>
            ¿No tenés cuenta?{" "}
            <Link
              href="/signup"
              className="font-medium text-teal-deep underline decoration-teal-deep/30 decoration-2 underline-offset-[5px] transition hover:decoration-teal-deep"
            >
              Crear cuenta
            </Link>
          </p>
        ) : (
          <p>
            El registro público está cerrado.{" "}
            <a
              href="mailto:hola@databa.app?subject=Pido%20invitaci%C3%B3n%20a%20datABA"
              className="font-medium text-teal-deep underline decoration-teal-deep/30 decoration-2 underline-offset-[5px] transition hover:decoration-teal-deep"
            >
              Pedir invitación
            </a>
          </p>
        )
      }
      aside={
        <div className="space-y-4 lg:pt-24">
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 backdrop-blur">
            <Kicker>Sesión en curso</Kicker>
            <p className="mt-3 font-display text-[22px] font-light leading-tight tracking-[-0.015em] text-ink">
              “Volvé al punto exacto donde dejaste el cronómetro.”
            </p>
            <p className="mt-4 text-[13px] text-ink/60">
              datABA mantiene tus mediciones paralelas activas hasta que vuelvas — incluso si se
              corta la conexión.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Métodos" value="9" />
            <Stat label="Paralelos" value="∞" />
            <Stat label="Offline" value="✓" />
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="h-72" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 px-3 py-4 text-center backdrop-blur">
      <div className="font-display text-[28px] font-light leading-none tracking-[-0.02em] text-teal-deep">
        {value}
      </div>
      <Kicker className="mt-2 block">{label}</Kicker>
    </div>
  );
}
