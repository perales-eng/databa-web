"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStudent, updateStudent } from "@/server/students";
import { createStudentOffline, mutate } from "@/lib/offline-client";

type Props = {
  initial?: {
    id: string;
    name: string;
    color: string | null;
    birthDate: Date | null;
    notes: string | null;
  };
};

const DEFAULT_COLORS = [
  "#0F766E", // teal
  "#7C3AED", // violet
  "#DC2626", // red
  "#EA580C", // orange
  "#65A30D", // lime
  "#0284C7", // sky
  "#DB2777", // pink
  "#475569", // slate
];

export function StudentForm({ initial }: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [color, setColor] = React.useState(initial?.color ?? DEFAULT_COLORS[0]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.set("color", color);
    let result: { ok: true; id: string; deferred?: boolean } | { ok: false; error: string };
    if (initial) {
      result = await mutate(() => updateStudent(initial.id, formData));
    } else {
      // Offline-aware: si no hay red, crea con ID temporal y encola.
      result = await createStudentOffline(formData, (fd) => createStudent(fd));
    }
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const deferred = "deferred" in result && result.deferred;
    if (deferred) {
      // No navegamos al perfil del temp — la URL /students/temp-xxx no existiría
      // en el server. Volvemos a la lista donde aparece con badge "pendiente".
      toast.success("Estudiante creado (pendiente de sincronizar)");
      router.push("/students");
      router.refresh();
      return;
    }
    toast.success(initial ? "Estudiante actualizado" : "Estudiante creado");
    router.push(`/students/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo *</Label>
        <Input id="name" name="name" defaultValue={initial?.name} required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label>Color identificador</Label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-full ring-offset-background transition-all ${
                color === c ? "ring-2 ring-ring ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Fecha de nacimiento</Label>
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={initial?.birthDate ? initial.birthDate.toISOString().slice(0, 10) : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initial?.notes ?? ""}
          rows={4}
          maxLength={2000}
          placeholder="Diagnóstico, intereses, contexto familiar, etc."
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : initial ? "Guardar cambios" : "Crear estudiante"}
        </Button>
      </div>
    </form>
  );
}
