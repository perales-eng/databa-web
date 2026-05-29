import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/marketing/auth-shell";
import { ArrowRight, Kicker } from "@/components/marketing/brand";
import { AcceptInvitationButton } from "./accept-button";

const linkBtn =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-cream transition hover:bg-teal-bright hover:text-ink";
const outlineBtn =
  "group inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-white/70 px-6 py-3.5 text-[14px] font-medium text-ink transition hover:border-teal-deep hover:bg-white";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation) {
    return (
      <AuthShell
        kicker="Invitación · Error"
        title={
          <>
            Este link <span className="italic text-teal-deep">ya no sirve.</span>
          </>
        }
        subtitle="No encontramos la invitación. Puede que haya sido revocada o que el link esté mal copiado."
      >
        <Link href="/" className={outlineBtn}>← Volver al inicio</Link>
      </AuthShell>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <AuthShell
        kicker="Invitación · Usada"
        title={
          <>
            Esta invitación <span className="italic text-teal-deep">ya fue aceptada.</span>
          </>
        }
        subtitle="Iniciá sesión con tu cuenta para acceder a la organización."
      >
        <Link href="/login" className={linkBtn}>Iniciar sesión <ArrowRight /></Link>
      </AuthShell>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <AuthShell
        kicker="Invitación · Vencida"
        title={
          <>
            El link <span className="italic text-teal-deep">expiró.</span>
          </>
        }
        subtitle="Pedile al administrador de la organización que te envíe una nueva invitación."
      >
        <Link href="/" className={outlineBtn}>← Volver al inicio</Link>
      </AuthShell>
    );
  }

  if (!session?.user) {
    const callback = `/invite/${token}`;
    return (
      <AuthShell
        kicker={`Invitación · ${invitation.role.toLowerCase()}`}
        title={
          <>
            Te invitaron a <span className="italic text-teal-deep">{invitation.organization.name}</span>.
          </>
        }
        subtitle={
          <>
            Iniciá sesión o creá una cuenta con{" "}
            <span className="font-mono text-[14px] text-ink">{invitation.email}</span> para aceptar.
          </>
        }
        aside={
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 backdrop-blur lg:mt-24">
            <Kicker>Próximo paso</Kicker>
            <p className="mt-3 font-display text-[20px] font-light leading-tight tracking-[-0.015em] text-ink">
              Una vez dentro, vas a poder cargar estudiantes, registrar sesiones y compartir reportes.
            </p>
          </div>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/login?from=${encodeURIComponent(callback)}`} className={`${linkBtn} flex-1`}>
            Iniciar sesión <ArrowRight />
          </Link>
          <Link href="/signup" className={`${outlineBtn} flex-1`}>Crear cuenta</Link>
        </div>
      </AuthShell>
    );
  }

  const sessionEmail = session.user.email?.toLowerCase() ?? "";
  const matches = sessionEmail === invitation.email.toLowerCase();

  if (matches) {
    const existing = await db.membership.findFirst({
      where: { userId: session.user.id, organizationId: invitation.organizationId },
    });
    if (existing) {
      await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      redirect("/dashboard");
    }
    return (
      <AuthShell
        kicker={`Rol asignado · ${invitation.role.toLowerCase()}`}
        title={
          <>
            Sumate a <span className="italic text-teal-deep">{invitation.organization.name}.</span>
          </>
        }
        subtitle="Vas a poder ver y gestionar los datos compartidos por la organización."
      >
        <AcceptInvitationButton token={token} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Invitación · Otro email"
      title={
        <>
          Esta invitación es para{" "}
          <span className="italic text-teal-deep">{invitation.email}</span>.
        </>
      }
      subtitle={
        <>
          Estás conectado como <span className="font-mono text-[14px] text-ink">{sessionEmail}</span>.
          Podés aceptarla igual o cambiar de cuenta.
        </>
      }
    >
      <div className="space-y-3">
        <AcceptInvitationButton token={token} />
        <Link href={`/login?from=${encodeURIComponent(`/invite/${token}`)}`} className={`${outlineBtn} w-full`}>
          Iniciar sesión con otra cuenta
        </Link>
      </div>
    </AuthShell>
  );
}
