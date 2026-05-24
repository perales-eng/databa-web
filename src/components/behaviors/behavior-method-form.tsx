"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBehaviorMethod, updateBehaviorMethod } from "@/server/behaviors";
import type { MeasurementMethodType } from "@prisma/client";

const METHOD_OPTIONS: { value: MeasurementMethodType; label: string }[] = [
  { value: "FREQUENCY", label: "Frecuencia" },
  { value: "DURATION", label: "Duración" },
  { value: "LATENCY", label: "Latencia" },
  { value: "INTENSITY", label: "Intensidad" },
  { value: "PERCENTAGE_OPPORTUNITY", label: "Oportunidades (%)" },
  { value: "TEMPORAL_SAMPLING", label: "Muestreo temporal" },
  { value: "EVENT_SAMPLING", label: "Registro de eventos" },
  { value: "ANECDOTAL", label: "Anecdótico" },
  { value: "ABC", label: "ABC" },
];

type Initial = {
  id: string;
  behaviorName: string;
  methodType: MeasurementMethodType;
  description: string | null;
  functionTypes: unknown;
  config: unknown;
};

type Props = {
  studentId: string;
  initial?: Initial;
  catalog?: string[];
};

function Checkbox({
  name,
  label,
  defaultChecked = true,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  );
}

function FrequencyConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opciones de guardado</p>
      <Checkbox name="saveFrequency" label="Guardar tasa (por minuto)" defaultChecked={(config?.saveFrequency ?? true) as boolean} />
      <Checkbox name="saveTotalOccurrences" label="Guardar total de ocurrencias" defaultChecked={(config?.saveTotalOccurrences ?? true) as boolean} />
      <Checkbox name="saveIRT" label="Guardar tiempo entre respuestas (IRT)" defaultChecked={(config?.saveIRT ?? false) as boolean} />
    </div>
  );
}

function DurationConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opciones de guardado</p>
      <Checkbox name="saveIndividualDurations" label="Guardar duraciones individuales" defaultChecked={(config?.saveIndividualDurations ?? true) as boolean} />
      <Checkbox name="saveAverageDuration" label="Guardar duración promedio" defaultChecked={(config?.saveAverageDuration ?? true) as boolean} />
    </div>
  );
}

function LatencyConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración</p>
      <div className="space-y-2">
        <Label htmlFor="maxTimeSeconds">Tiempo máximo (seg, opcional)</Label>
        <Input
          id="maxTimeSeconds"
          name="maxTimeSeconds"
          type="number"
          min={1}
          defaultValue={(config?.maxTimeSeconds as number) ?? ""}
          placeholder="Sin límite"
        />
      </div>
      <Checkbox name="saveIndividualTimes" label="Guardar tiempos individuales" defaultChecked={(config?.saveIndividualTimes ?? true) as boolean} />
      <Checkbox name="saveAverageTime" label="Guardar tiempo promedio" defaultChecked={(config?.saveAverageTime ?? true) as boolean} />
    </div>
  );
}

function IntensityConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración de escala</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scaleMin">Mínimo de escala</Label>
          <Input id="scaleMin" name="scaleMin" type="number" defaultValue={(config?.scaleMin as number) ?? 1} min={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scaleMax">Máximo de escala</Label>
          <Input id="scaleMax" name="scaleMax" type="number" defaultValue={(config?.scaleMax as number) ?? 10} min={1} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxMeasurements">Máx. mediciones por sesión (opcional)</Label>
        <Input
          id="maxMeasurements"
          name="maxMeasurements"
          type="number"
          min={1}
          defaultValue={(config?.maxMeasurements as number) ?? ""}
          placeholder="Sin límite"
        />
      </div>
      <Checkbox name="saveIndividualValues" label="Guardar valores individuales" defaultChecked={(config?.saveIndividualValues ?? true) as boolean} />
      <Checkbox name="saveAverage" label="Guardar promedio" defaultChecked={(config?.saveAverage ?? true) as boolean} />
    </div>
  );
}

function OpportunityConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración de oportunidades</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxOpportunities">Máx. oportunidades (opcional)</Label>
          <Input
            id="maxOpportunities"
            name="maxOpportunities"
            type="number"
            min={1}
            defaultValue={(config?.maxOpportunities as number) ?? ""}
            placeholder="Sin límite"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxTimeMinutes">Tiempo máximo (min, opcional)</Label>
          <Input
            id="maxTimeMinutes"
            name="maxTimeMinutes"
            type="number"
            min={1}
            defaultValue={(config?.maxTimeMinutes as number) ?? ""}
            placeholder="Sin límite"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="opportunityDescription">Descripción de la oportunidad</Label>
        <Input
          id="opportunityDescription"
          name="opportunityDescription"
          defaultValue={(config?.opportunityDescription as string) ?? ""}
          placeholder="Ej: Se le presenta el objeto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctResponseDescription">Descripción de respuesta correcta</Label>
        <Input
          id="correctResponseDescription"
          name="correctResponseDescription"
          defaultValue={(config?.correctResponseDescription as string) ?? ""}
          placeholder="Ej: Señala el objeto correcto"
        />
      </div>
      <Checkbox name="saveOpportunityDetails" label="Guardar detalle de cada oportunidad" defaultChecked={(config?.saveOpportunityDetails ?? true) as boolean} />
    </div>
  );
}

function TemporalSamplingConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración de muestreo</p>
      <div className="space-y-2">
        <Label htmlFor="samplingType">Tipo de muestreo</Label>
        <Select id="samplingType" name="samplingType" defaultValue={(config?.samplingType as string) ?? "PARTIAL"}>
          <option value="PARTIAL">Parcial (partial interval)</option>
          <option value="WHOLE">Completo (whole interval)</option>
          <option value="MOMENTARY">Momentáneo (momentary)</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="intervalDurationSeconds">Duración del intervalo (seg)</Label>
          <Input
            id="intervalDurationSeconds"
            name="intervalDurationSeconds"
            type="number"
            min={1}
            defaultValue={(config?.intervalDurationSeconds as number) ?? 10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalDurationSeconds">Duración total (seg)</Label>
          <Input
            id="totalDurationSeconds"
            name="totalDurationSeconds"
            type="number"
            min={1}
            defaultValue={(config?.totalDurationSeconds as number) ?? 300}
            required
          />
        </div>
      </div>
      <Checkbox name="saveIntervalDetails" label="Guardar detalle por intervalo" defaultChecked={(config?.saveIntervalDetails ?? true) as boolean} />
      <Checkbox name="saveSummary" label="Guardar resumen" defaultChecked={(config?.saveSummary ?? true) as boolean} />
    </div>
  );
}

function EventSamplingConfig({ config }: { config?: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración</p>
      <div className="space-y-2">
        <Label htmlFor="sessionDurationMinutes">Duración de sesión (min)</Label>
        <Input
          id="sessionDurationMinutes"
          name="sessionDurationMinutes"
          type="number"
          min={1}
          defaultValue={(config?.sessionDurationMinutes as number) ?? 30}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="intensityScale">Escala de intensidad (opcional, 1–10)</Label>
        <Input
          id="intensityScale"
          name="intensityScale"
          type="number"
          min={1}
          max={10}
          defaultValue={(config?.intensityScale as number) ?? ""}
          placeholder="Sin escala"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dataSaveType">Tipo de guardado</Label>
        <Select id="dataSaveType" name="dataSaveType" defaultValue={(config?.dataSaveType as string) ?? "BOTH"}>
          <option value="INDIVIDUAL">Individual</option>
          <option value="AVERAGE">Promedio</option>
          <option value="BOTH">Ambos</option>
        </Select>
      </div>
    </div>
  );
}

function MethodConfigFields({
  methodType,
  config,
}: {
  methodType: MeasurementMethodType;
  config?: Record<string, unknown>;
}) {
  switch (methodType) {
    case "FREQUENCY":
      return <FrequencyConfig config={config} />;
    case "DURATION":
      return <DurationConfig config={config} />;
    case "LATENCY":
      return <LatencyConfig config={config} />;
    case "INTENSITY":
      return <IntensityConfig config={config} />;
    case "PERCENTAGE_OPPORTUNITY":
      return <OpportunityConfig config={config} />;
    case "TEMPORAL_SAMPLING":
      return <TemporalSamplingConfig config={config} />;
    case "EVENT_SAMPLING":
      return <EventSamplingConfig config={config} />;
    case "ANECDOTAL":
    case "ABC":
      return (
        <p className="text-sm text-muted-foreground">
          Este método no requiere configuración adicional. Los campos se registran directamente en cada sesión.
        </p>
      );
  }
}

export function BehaviorMethodForm({ studentId, initial, catalog = [] }: Props) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [methodType, setMethodType] = React.useState<MeasurementMethodType>(
    initial?.methodType ?? "FREQUENCY",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const action = initial
      ? updateBehaviorMethod.bind(null, initial.id, studentId)
      : createBehaviorMethod.bind(null, studentId);
    const result = await action(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(initial ? "Método actualizado" : "Método creado");
    router.push(`/students/${studentId}`);
    router.refresh();
  }

  const config = initial?.config as Record<string, unknown> | undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="behaviorName">Nombre de la conducta *</Label>
        <Input
          id="behaviorName"
          name="behaviorName"
          defaultValue={initial?.behaviorName}
          required
          maxLength={100}
          placeholder="Ej: Golpes a pares, Contacto visual, etc."
          list="behavior-catalog"
          autoComplete="off"
        />
        {catalog.length > 0 ? (
          <datalist id="behavior-catalog">
            {catalog.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {catalog.length > 0
            ? "Sugerencias del catálogo de la organización; podés tipear una conducta nueva."
            : "Las conductas nuevas quedan agregadas al catálogo automáticamente."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="methodType">Método de medición *</Label>
        <Select
          id="methodType"
          name="methodType"
          value={methodType}
          onChange={(e) => setMethodType(e.target.value as MeasurementMethodType)}
          disabled={!!initial}
        >
          {METHOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {initial && (
          <p className="text-xs text-muted-foreground">
            El tipo de método no se puede cambiar después de creado.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <MethodConfigFields methodType={methodType} config={initial ? config : undefined} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción / notas del método</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={2}
          maxLength={500}
          placeholder="Topografía, criterios de observación, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="functionTypes">Función(es) operante (separadas por coma)</Label>
        <Input
          id="functionTypes"
          name="functionTypes"
          defaultValue={
            Array.isArray(initial?.functionTypes)
              ? (initial.functionTypes as string[]).join(", ")
              : ""
          }
          placeholder="Ej: Atención, Escape, Automática"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : initial ? "Guardar cambios" : "Crear método"}
        </Button>
      </div>
    </form>
  );
}
