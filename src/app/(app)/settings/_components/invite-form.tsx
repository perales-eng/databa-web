"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMember } from "@/server/organizations";

export function InviteForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setGeneratedLink(null);
    const result = await inviteMember(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const link = `${window.location.origin}/invite/${result.token}`;
    setGeneratedLink(link);
    if (result.emailSent) {
      toast.success(`Invitación enviada por email a ${result.email}`);
    } else {
      toast.success(`Invitación creada — compartí el link manualmente con ${result.email}`);
    }
    router.refresh();
    (e.currentTarget as HTMLFormElement).reset();
  }

  async function copy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    toast.success("Link copiado");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="invite-email" className="text-xs">Email</Label>
          <Input id="invite-email" name="email" type="email" required placeholder="persona@ejemplo.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-role" className="text-xs">Rol</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="THERAPIST"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="THERAPIST">Terapeuta</option>
            <option value="ADMIN">Administrador</option>
            <option value="OWNER">Propietario</option>
          </select>
        </div>
        <Button type="submit" disabled={loading} size="sm">
          <Send className="h-4 w-4" />
          {loading ? "Generando…" : "Generar invitación"}
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {generatedLink ? (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Compartí este link con la persona invitada:</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">{generatedLink}</code>
            <Button type="button" size="sm" variant="outline" onClick={copy}>
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
