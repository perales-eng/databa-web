"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { saveABCRecord } from "@/server/measurements";

type Props = {
  sessionId: string;
  studentId: string;
  behaviorName: string;
  onSaved: () => void;
};

const ANTECEDENT_TYPES = ["Instrucción verbal", "Instrucción física", "Transición", "Espera", "Negación", "Otro"];
const CONSEQUENCE_TYPES = ["Atención positiva", "Escape de tarea", "Acceso a objeto", "Atención negativa", "Sin consecuencia", "Otro"];

export function ABCForm({ sessionId, studentId, behaviorName, onSaved }: Props) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveABCRecord(studentId, sessionId, behaviorName, formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Registro ABC guardado");
    formRef.current?.reset();
    onSaved();
  }

  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="occurredAt">Fecha y hora *</Label>
        <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={defaultDate} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Lugar</Label>
          <Input id="location" name="location" placeholder="Ej: Aula, patio, comedor" maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peoplePresent">Personas presentes</Label>
          <Input id="peoplePresent" name="peoplePresent" placeholder="Ej: Terapeuta, par, maestro" maxLength={200} />
        </div>
      </div>

      <fieldset className="rounded-lg border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Antecedente</legend>
        <div className="space-y-2">
          <Label htmlFor="antecedentType">Tipo</Label>
          <Select id="antecedentType" name="antecedentType">
            <option value="">— Seleccionar —</option>
            {ANTECEDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="antecedentDescription">Descripción</Label>
          <Textarea id="antecedentDescription" name="antecedentDescription" rows={2} maxLength={1000} placeholder="Describí el antecedente con detalle" />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conducta *</legend>
        <div className="space-y-2">
          <Label htmlFor="behaviorDescription">Descripción *</Label>
          <Textarea id="behaviorDescription" name="behaviorDescription" rows={2} maxLength={1000} required placeholder="Describí la conducta observada" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="behaviorDurationSec">Duración (seg)</Label>
            <Input id="behaviorDurationSec" name="behaviorDurationSec" type="number" min={1} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="behaviorIntensity">Intensidad (1–10)</Label>
            <Input id="behaviorIntensity" name="behaviorIntensity" type="number" min={1} max={10} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="behaviorTopography">Topografía</Label>
            <Input id="behaviorTopography" name="behaviorTopography" maxLength={200} placeholder="Ej: Golpe abierto" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consecuencia</legend>
        <div className="space-y-2">
          <Label htmlFor="consequenceType">Tipo</Label>
          <Select id="consequenceType" name="consequenceType">
            <option value="">— Seleccionar —</option>
            {CONSEQUENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="consequenceDescription">Descripción</Label>
          <Textarea id="consequenceDescription" name="consequenceDescription" rows={2} maxLength={1000} placeholder="Describí la consecuencia" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatObtained">¿Qué obtuvo?</Label>
            <Input id="whatObtained" name="whatObtained" maxLength={500} placeholder="Ej: Atención del terapeuta" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatAvoided">¿Qué evitó?</Label>
            <Input id="whatAvoided" name="whatAvoided" maxLength={500} placeholder="Ej: Tarea académica" />
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="functionAnalysis">Análisis funcional</Label>
        <Textarea id="functionAnalysis" name="functionAnalysis" rows={2} maxLength={1000} placeholder="Hipótesis sobre la función de la conducta" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={1000} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando…" : "Guardar registro ABC"}
      </Button>
    </form>
  );
}
