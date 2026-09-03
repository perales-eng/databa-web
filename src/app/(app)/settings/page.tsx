import Link from "next/link";
import { ListTree } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RenameOrgForm } from "./_components/rename-org-form";
import { InviteForm } from "./_components/invite-form";
import {
  MemberRoleSelect,
  RemoveMemberButton,
  RevokeInvitationButton,
} from "./_components/member-actions";

const ROLE_LABELS = {
  DEV: "Desarrollador",
  OWNER: "Propietario",
  ADMIN: "Administrador",
  THERAPIST: "Terapeuta",
} as const;

function formatDate(d: Date): string {
  return d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

export default async function SettingsPage() {
  const { user, organization, role } = await requireOrganization();
  const isDev = role === "DEV";
  const isOwner = role === "OWNER";
  const canInvite = isDev || isOwner || role === "ADMIN";
  const canManageMembers = isDev || isOwner;

  const [members, invitations, behaviorCount] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: organization.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    db.behavior.count({ where: { organizationId: organization.id, deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Preferencias · Equipo
        </span>
        <h1 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.05] tracking-[-0.02em]">
          Configuración.
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Tu información personal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {user.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Rol actual:</span>{" "}
              <Badge variant="outline">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organización</CardTitle>
            <CardDescription>Datos generales.</CardDescription>
          </CardHeader>
          <CardContent>
            <RenameOrgForm initialName={organization.name} disabled={!isDev && !isOwner} />
            <p className="mt-3 text-xs text-muted-foreground">
              Slug: <code className="rounded bg-muted px-1 py-0.5">{organization.slug}</code>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Catálogo de conductas</CardTitle>
              <CardDescription>
                {behaviorCount} {behaviorCount === 1 ? "conducta registrada" : "conductas registradas"}. Reusables al configurar métodos de medición.
              </CardDescription>
            </div>
            <Link href="/settings/behaviors">
              <Button variant="outline" size="sm">
                <ListTree className="h-4 w-4" /> Gestionar
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Miembros</CardTitle>
          <CardDescription>
            Personas con acceso a esta organización. {canInvite ? "Podés invitar a más." : "Solo el propietario o un administrador puede invitar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canInvite ? <InviteForm userRole={role} /> : null}

          {invitations.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Invitaciones pendientes
              </p>
              <ul className="divide-y rounded-md border">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[inv.role]} · vence el {formatDate(inv.expiresAt)}
                      </p>
                    </div>
                    {canInvite ? <RevokeInvitationButton invitationId={inv.id} /> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Miembros activos
            </p>
            <ul className="divide-y rounded-md border">
              {members.map((m) => {
                const isSelf = m.userId === user.id;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.user.name ?? m.user.email}
                        {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(vos)</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MemberRoleSelect
                        membershipId={m.id}
                        currentRole={m.role}
                        disabled={!canManageMembers || isSelf}
                      />
                      <RemoveMemberButton
                        membershipId={m.id}
                        name={m.user.name ?? m.user.email}
                        disabled={!canManageMembers || isSelf}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
