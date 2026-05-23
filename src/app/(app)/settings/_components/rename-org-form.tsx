"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameOrganization } from "@/server/organizations";

export function RenameOrgForm({ initialName, disabled }: { initialName: string; disabled: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await renameOrganization(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Organización actualizada");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nombre</Label>
        <Input
          id="org-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          disabled={disabled}
        />
        {disabled ? (
          <p className="text-xs text-muted-foreground">Solo el propietario puede renombrar.</p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading || disabled || name.trim() === initialName} size="sm">
        {loading ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
