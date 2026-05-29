import { redirect } from "next/navigation";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Kicker } from "@/components/marketing/brand";
import { requireUser } from "@/lib/auth-helpers";
import { OrganizationForm } from "./organization-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      kicker="Onboarding · Paso 1"
      title={
        <>
          Tu clínica, <span className="italic text-teal-deep">en datos.</span>
        </>
      }
      subtitle="Dale un nombre a tu organización y empezás a registrar estudiantes y sesiones. Quedarás como propietario (OWNER) y podrás invitar a tu equipo cuando quieras."
      aside={
        <div className="space-y-3 lg:pt-24">
          {milestones.map((m) => (
            <div
              key={m.label}
              className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-white/70 p-5 backdrop-blur"
            >
              <span className="font-display text-[28px] font-light leading-none tracking-[-0.02em] text-teal-bright">
                {m.icon}
              </span>
              <div>
                <Kicker>{m.label}</Kicker>
                <p className="mt-1 text-[14px] text-ink/70">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <OrganizationForm />
    </AuthShell>
  );
}

const milestones = [
  { icon: "01", label: "Organización", body: "El contenedor de todos tus datos clínicos." },
  { icon: "02", label: "Estudiantes", body: "Cargá legajos con objetivos y métodos por estudiante." },
  { icon: "03", label: "Equipo", body: "Invitá colegas con roles (terapeuta, supervisor, admin)." },
];
