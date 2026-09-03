import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/marketing/auth-shell";
import { SignupForm } from "./signup-form";

const outlineBtn =
  "group inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-white/70 px-6 py-3.5 text-[14px] font-medium text-ink transition hover:border-teal-deep hover:bg-white";

export default async function InviteSignupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  // Si ya está logueado, redirigir a la página de aceptación
  if (session?.user) {
    redirect(`/invite/${token}`);
  }

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { 
      organization: { 
        select: { 
          name: true,
          memberships: {
            where: { role: "DEV" },
            select: { role: true }
          }
        } 
      } 
    },
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
        subtitle="Iniciá sesión con tu cuenta para acceder."
      >
        <Link href="/login" className={outlineBtn}>Iniciar sesión</Link>
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
        subtitle="Pedile al administrador que te envíe una nueva invitación."
      >
        <Link href="/" className={outlineBtn}>← Volver al inicio</Link>
      </AuthShell>
    );
  }

  // Detectar si es invitación de DEV a OWNER
  const isDevInvitingOwner = invitation.organization.memberships.some(m => m.role === "DEV") && invitation.role === "OWNER";

  const title = isDevInvitingOwner 
    ? <>Creá tu cuenta en <span className="italic text-teal-deep">datABA.</span></>
    : <>Unite a <span className="italic text-teal-deep">{invitation.organization.name}.</span></>;

  const subtitle = isDevInvitingOwner
    ? `Vas a crear tu propia organización y convertirte en propietario. Creá tu cuenta con ${invitation.email}`
    : `Vas a unirte a la organización como ${invitation.role.toLowerCase()}. Creá tu cuenta con ${invitation.email}`;

  return (
    <AuthShell
      kicker={`Crear cuenta · ${invitation.role.toLowerCase()}`}
      title={title}
      subtitle={subtitle}
    >
      <SignupForm 
        token={token} 
        email={invitation.email}
        isDevInvitingOwner={isDevInvitingOwner}
        organizationName={invitation.organization.name}
      />
      <div className="mt-4 text-center">
        <Link 
          href={`/login?from=${encodeURIComponent(`/invite/${token}`)}`}
          className="text-sm text-ink/60 hover:text-ink underline"
        >
          ¿Ya tenés cuenta? Iniciá sesión
        </Link>
      </div>
    </AuthShell>
  );
}
