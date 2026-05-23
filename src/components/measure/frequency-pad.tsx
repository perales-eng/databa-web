"use client";

import * as React from "react";
import { Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveFrequencyResult } from "@/server/measurements";
import { toast } from "sonner";
import { useMeasurementProgress } from "@/components/measure/_hooks/use-measurement-progress";
import { frequency } from "@/lib/measurements/pad-state";

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  behaviorName: string;
  sessionStartMs: number;
  onSaved: () => void;
};

type Snapshot = { timestamps: number[] };

export function FrequencyPad({ sessionId, behaviorMethodId, behaviorName, sessionStartMs, onSaved }: Props) {
  const [timestamps, setTimestamps] = React.useState<number[]>([]);
  const [saving, setSaving] = React.useState(false);

  const { clear } = useMeasurementProgress<Snapshot>({
    sessionId,
    behaviorMethodId,
    state: { timestamps },
    isDirty: timestamps.length > 0,
    onHydrate: (snap) => {
      if (Array.isArray(snap.timestamps)) setTimestamps(snap.timestamps);
    },
  });

  function tap() {
    setTimestamps((prev) => frequency.tap(prev, Date.now()));
  }

  function undo() {
    setTimestamps((prev) => frequency.undo(prev));
  }

  async function handleSave() {
    setSaving(true);
    const sessionDurationSec = Math.round((Date.now() - sessionStartMs) / 1000);
    const result = await saveFrequencyResult({
      sessionId,
      behaviorMethodId,
      timestampsMs: timestamps,
      sessionDurationSec,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${behaviorName}" guardado — ${timestamps.length} ocurrencias`);
    await clear();
    setTimestamps([]);
    onSaved();
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-7xl font-bold tabular-nums">{timestamps.length}</p>
        <p className="mt-1 text-sm text-muted-foreground">ocurrencias</p>
      </div>

      <button
        type="button"
        onClick={tap}
        className="flex h-36 w-36 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 text-2xl font-bold select-none"
      >
        TAP
      </button>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={undo} disabled={timestamps.length === 0}>
          <Minus className="h-4 w-4" /> Deshacer
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTimestamps(frequency.reset())} disabled={timestamps.length === 0}>
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </Button>
      </div>

      <Button onClick={handleSave} disabled={saving || timestamps.length === 0} className="w-full max-w-xs">
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
