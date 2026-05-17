"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveAnecdotalRecord } from "@/server/measurements";

type Props = {
  sessionId: string;
  studentId: string;
  onSaved: () => void;
};

export function AnecdotalForm({ sessionId, studentId, onSaved }: Props) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveAnecdotalRecord(studentId, sessionId, formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Registro anecdótico guardado");
    formRef.current?.reset();
    onSaved();
  }

  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recordDate">Fecha *</Label>
          <Input id="recordDate" name="recordDate" type="date" defaultValue={defaultDate} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recordTime">Hora</Label>
          <Input id="recordTime" name="recordTime" type="time" defaultValue={defaultTime} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" name="title" required maxLength={200} placeholder="Resumen breve del evento" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea id="description" name="description" rows={4} required maxLength={2000} placeholder="Describí el evento observado con detalle" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Contexto</Label>
        <Textarea id="context" name="context" rows={2} maxLength={1000} placeholder="Entorno, actividad, personas presentes…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input id="category" name="category" maxLength={100} placeholder="Ej: Social, académico, conductual" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones</Label>
          <Input id="observations" name="observations" maxLength={1000} placeholder="Notas adicionales" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando…" : "Guardar registro anecdótico"}
      </Button>
    </form>
  );
}
