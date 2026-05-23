import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInvitationButton } from "./accept-button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  const card = (title: string, description: string, body?: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {body ? <CardContent>{body}</CardContent> : null}
      </Card>
    </div>
  );

  if (!invitation) {
    return card("Invitación no válida", "El link de invitación no existe o fue revocado.", (
      <Link href="/"><Button variant="outline">Volver al inicio</Button></Link>
    ));
  }
  if (invitation.acceptedAt) {
    return card("Ya fue aceptada", "Esta invitación ya fue usada. Iniciá sesión para acceder a la organización.", (
      <Link href="/login"><Button>Iniciar sesión</Button></Link>
    ));
  }
  if (invitation.expiresAt < new Date()) {
    return card("Invitación vencida", "Pedile al administrador que te envíe una nueva.", (
      <Link href="/"><Button variant="outline">Volver al inicio</Button></Link>
    ));
  }

  if (!session?.user) {
    const callback = `/invite/${token}`;
    return card(
      `Te invitaron a ${invitation.organization.name}`,
      `Iniciá sesión o creá una cuenta con el email ${invitation.email} para aceptar.`,
      (
        <div className="flex gap-2">
          <Link href={`/login?from=${encodeURIComponent(callback)}`} className="flex-1">
            <Button className="w-full">Iniciar sesión</Button>
          </Link>
          <Link href="/signup" className="flex-1">
            <Button variant="outline" className="w-full">Crear cuenta</Button>
          </Link>
        </div>
      ),
    );
  }

  // Sesión activa — si el email coincide, aceptar directamente. Si no, ofrecer aceptar igual.
  const sessionEmail = session.user.email?.toLowerCase() ?? "";
  const matches = sessionEmail === invitation.email.toLowerCase();

  if (matches) {
    // Auto-aceptar y redirigir.
    const existing = await db.membership.findFirst({
      where: { userId: session.user.id, organizationId: invitation.organizationId },
    });
    if (existing) {
      await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      redirect("/dashboard");
    }
    return card(
      `Aceptar invitación a ${invitation.organization.name}`,
      `Vas a unirte como ${invitation.role.toLowerCase()}.`,
      <AcceptInvitationButton token={token} />,
    );
  }

  return card(
    `Invitación para ${invitation.email}`,
    `Estás conectado como ${sessionEmail}, pero la invitación está dirigida a otra dirección. Podés aceptar igual o iniciar sesión con la cuenta correcta.`,
    (
      <div className="space-y-3">
        <AcceptInvitationButton token={token} />
        <Link href={`/login?from=${encodeURIComponent(`/invite/${token}`)}`}>
          <Button variant="outline" className="w-full">Iniciar sesión con otra cuenta</Button>
        </Link>
      </div>
    ),
  );
}
