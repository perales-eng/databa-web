"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changeMemberRole, removeMember, revokeInvitation } from "@/server/organizations";

export function MemberRoleSelect({
  membershipId,
  currentRole,
  disabled,
}: {
  membershipId: string;
  currentRole: "OWNER" | "ADMIN" | "THERAPIST";
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (newRole === currentRole) return;
    setPending(true);
    const result = await changeMemberRole(membershipId, newRole);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Rol actualizado");
    router.refresh();
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={onChange}
      disabled={disabled || pending}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
    >
      <option value="OWNER">Propietario</option>
      <option value="ADMIN">Administrador</option>
      <option value="THERAPIST">Terapeuta</option>
    </select>
  );
}

export function RemoveMemberButton({
  membershipId,
  name,
  disabled,
}: {
  membershipId: string;
  name: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (!confirm(`¿Remover a ${name} de la organización?`)) return;
    setPending(true);
    const result = await removeMember(membershipId);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Miembro removido");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" onClick={onClick} disabled={disabled || pending} title="Remover">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (!confirm("¿Revocar esta invitación?")) return;
    setPending(true);
    const result = await revokeInvitation(invitationId);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitación revocada");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      Revocar
    </Button>
  );
}
