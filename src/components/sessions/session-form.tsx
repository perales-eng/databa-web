"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createSession, updateSession } from "@/server/sessions";
import type { SessionStatus, SessionType } from "@prisma/client";

type Props = {
  studentId: string;
  initial?: {
    id: string;
    title: string;
    description: string | null;
    sessionDate: Date;
    durationMin: number | null;
    sessionType: SessionType;
    status: SessionStatus;
  };
};

function localDateTime(date: Date): string {
  // Format Date for <input type="datetime-local"> (yyyy-MM-ddTHH:mm in local TZ)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function SessionForm({ studentId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.set("studentId", studentId);
    const action = initial ? updateSession.bind(null, initial.id) : createSession;
    const result = await action(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(initial ? "Sesión actualizada" : "Sesión creada");

    // Si la sesión es futura y es nueva (no estamos editando), volver al
    // perfil del estudiante — no tiene sentido mostrar "Empezar a medir"
    // para una sesión programada para más tarde.
    const sessionDateStr = String(formData.get("sessionDate") ?? "");
    const sessionDate = sessionDateStr ? new Date(sessionDateStr) : null;
    const isFuture = sessionDate && sessionDate.getTime() > Date.now() + 60_000;

    if (!initial && isFuture) {
      router.push(`/students/${studentId}`);
    } else {
      router.push(`/sessions/${result.id}`);
    }
    router.refresh();
  }

  const [defaultDate] = React.useState<string>(() =>
    initial?.sessionDate
      ? localDateTime(initial.sessionDate)
      : localDateTime(new Date(Date.now() + 60 * 60 * 1000)),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial?.title}
          placeholder="Sesión semanal, ABC inicial, etc."
          required
          maxLength={120}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sessionDate">Fecha y hora *</Label>
          <Input
            id="sessionDate"
            name="sessionDate"
            type="datetime-local"
            defaultValue={defaultDate}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            defaultValue={initial?.durationMin ?? 60}
            min={1}
            max={600}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sessionType">Tipo</Label>
          <Select id="sessionType" name="sessionType" defaultValue={initial?.sessionType ?? "SCHEDULED"}>
            <option value="SCHEDULED">Programada</option>
            <option value="IMMEDIATE">Inmediata</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select id="status" name="status" defaultValue={initial?.status ?? "PENDING"}>
            <option value="PENDING">Pendiente</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          maxLength={1000}
          placeholder="Objetivos, contexto, notas previas…"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : initial ? "Guardar cambios" : "Crear sesión"}
        </Button>
      </div>
    </form>
  );
}
