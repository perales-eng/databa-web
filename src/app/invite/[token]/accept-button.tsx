"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending} className="w-full">
        {pending ? "Aceptando…" : "Aceptar invitación"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
