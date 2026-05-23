"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveIntensityResult } from "@/server/measurements";
import { toast } from "sonner";
import { useMeasurementProgress } from "@/components/measure/_hooks/use-measurement-progress";

type Snapshot = { values: number[] };

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  behaviorName: string;
  sessionStartMs: number;
  scaleMin: number;
  scaleMax: number;
  onSaved: () => void;
};

export function IntensityPad({
  sessionId,
  behaviorMethodId,
  behaviorName,
  sessionStartMs,
  scaleMin,
  scaleMax,
  onSaved,
}: Props) {
  const [values, setValues] = React.useState<number[]>([]);
  const [saving, setSaving] = React.useState(false);

  const { clear } = useMeasurementProgress<Snapshot>({
    sessionId,
    behaviorMethodId,
    state: { values },
    isDirty: values.length > 0,
    onHydrate: (snap) => {
      if (Array.isArray(snap.values)) setValues(snap.values);
    },
  });

  const steps = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);

  function record(val: number) {
    setValues((prev) => [...prev, val]);
  }

  async function handleSave() {
    setSaving(true);
    const sessionDurationSec = Math.round((Date.now() - sessionStartMs) / 1000);
    const result = await saveIntensityResult({
      sessionId,
      behaviorMethodId,
      values,
      sessionDurationSec,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
    toast.success(`"${behaviorName}" guardado — ${values.length} registros, promedio ${avg}`);
    await clear();
    setValues([]);
    onSaved();
  }

  const last = values.at(-1);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-7xl font-bold tabular-nums">{last ?? "—"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          último valor · {values.length} registros
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => record(s)}
            className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold shadow transition-transform active:scale-95 select-none ${
              last === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {values.map((v, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
              {v}
            </span>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setValues([])} disabled={values.length === 0}>
        <RotateCcw className="h-4 w-4" /> Reiniciar
      </Button>

      <Button onClick={handleSave} disabled={saving || values.length === 0} className="w-full max-w-xs">
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
