"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBehavior, updateBehavior, deleteBehavior } from "@/server/behavior-catalog";

type Behavior = { id: string; name: string; description: string | null; usageCount: number };

export function CreateBehaviorForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createBehavior(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Conducta agregada");
    (e.currentTarget as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
      <div className="space-y-1">
        <Label htmlFor="new-name" className="text-xs">Nombre *</Label>
        <Input id="new-name" name="name" required maxLength={100} placeholder="Ej: Golpes a pares" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-description" className="text-xs">Descripción</Label>
        <Input id="new-description" name="description" maxLength={500} placeholder="Opcional" />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        <Plus className="h-4 w-4" /> {loading ? "Agregando…" : "Agregar"}
      </Button>
      {error ? <p className="sm:col-span-3 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

export function BehaviorRow({ behavior }: { behavior: Behavior }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateBehavior(behavior.id, new FormData(e.currentTarget));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Conducta actualizada");
    setEditing(false);
    router.refresh();
  }

  async function onDelete() {
    if (behavior.usageCount > 0) {
      if (!confirm(`Esta conducta está usada por ${behavior.usageCount} métodos. ¿Eliminar igual? Los métodos existentes conservan el nombre como snapshot.`)) return;
    } else {
      if (!confirm(`¿Eliminar "${behavior.name}"?`)) return;
    }
    setPending(true);
    const result = await deleteBehavior(behavior.id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Error");
      return;
    }
    toast.success("Conducta eliminada");
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={onSubmit} className="grid gap-2 px-3 py-2 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
        <Input name="name" defaultValue={behavior.name} required maxLength={100} />
        <Input name="description" defaultValue={behavior.description ?? ""} maxLength={500} />
        <div className="flex gap-1">
          <Button type="submit" size="icon" disabled={pending}>
            <Save className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error ? <p className="sm:col-span-3 text-sm text-destructive">{error}</p> : null}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{behavior.name}</p>
        {behavior.description ? (
          <p className="truncate text-xs text-muted-foreground">{behavior.description}</p>
        ) : null}
      </div>
      <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {behavior.usageCount} en uso
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={pending}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} disabled={pending}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}
