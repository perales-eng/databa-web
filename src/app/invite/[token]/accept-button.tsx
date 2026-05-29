"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditorialButton, EditorialError } from "@/components/marketing/auth-shell";
import { ArrowRight } from "@/components/marketing/brand";
import { acceptInvitation } from "@/server/organizations";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setError(null);
    setPending(true);
    const result = await acceptInvitation(token);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Invitación aceptada");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <EditorialButton onClick={onClick} disabled={pending}>
        {pending ? "Aceptando…" : "Aceptar invitación"}
        {!pending && <ArrowRight />}
      </EditorialButton>
      {error && <EditorialError>{error}</EditorialError>}
    </div>
  );
}
