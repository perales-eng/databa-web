"use client";

import * as React from "react";
import { RotateCcw, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveLatencyResult } from "@/server/measurements";
import { toast } from "sonner";
import { useMeasurementProgress } from "@/components/measure/_hooks/use-measurement-progress";

type Snapshot = { times: number[] };

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  behaviorName: string;
  sessionStartMs: number;
  onSaved: () => void;
};

function formatSec(ms: number) {
  const s = ms / 1000;
  return s.toFixed(2) + "s";
}

export function LatencyPad({ sessionId, behaviorMethodId, behaviorName, sessionStartMs, onSaved }: Props) {
  const [times, setTimes] = React.useState<number[]>([]);
  const [stimulusMs, setStimulusMs] = React.useState<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const { clear } = useMeasurementProgress<Snapshot>({
    sessionId,
    behaviorMethodId,
    state: { times },
    isDirty: times.length > 0,
    onHydrate: (snap) => {
      if (Array.isArray(snap.times)) setTimes(snap.times);
    },
  });

  function giveStimulus() {
    setStimulusMs(Date.now());
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 100);
    }, 100);
  }

  function recordResponse() {
    if (stimulusMs === null) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const latencyMs = Date.now() - stimulusMs;
    setTimes((prev) => [...prev, latencyMs / 1000]);
    setStimulusMs(null);
    setElapsed(0);
  }

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    const sessionDurationSec = Math.round((Date.now() - sessionStartMs) / 1000);
    const result = await saveLatencyResult({
      sessionId,
      behaviorMethodId,
      timesSec: times,
      sessionDurationSec,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${behaviorName}" guardado — ${times.length} mediciones`);
    await clear();
    setTimes([]);
    onSaved();
  }

  const isWaiting = stimulusMs !== null;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        {isWaiting ? (
          <>
            <p className="text-6xl font-bold tabular-nums text-amber-500">{formatSec(elapsed)}</p>
            <p className="mt-1 text-sm text-muted-foreground">esperando respuesta…</p>
          </>
        ) : (
          <>
            <p className="text-6xl font-bold tabular-nums">{times.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">mediciones registradas</p>
          </>
        )}
      </div>

      {times.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {times.map((t, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
              {t.toFixed(2)}s
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {!isWaiting ? (
          <button
            type="button"
            onClick={giveStimulus}
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-transform active:scale-95 text-xs font-bold select-none gap-1"
          >
            <Zap className="h-6 w-6" />
            ESTÍMULO
          </button>
        ) : (
          <button
            type="button"
            onClick={recordResponse}
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform active:scale-95 text-xs font-bold select-none gap-1"
          >
            <CheckCircle className="h-6 w-6" />
            RESPUESTA
          </button>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => setTimes([])} disabled={times.length === 0 || isWaiting}>
        <RotateCcw className="h-4 w-4" /> Reiniciar
      </Button>

      <Button onClick={handleSave} disabled={saving || times.length === 0 || isWaiting} className="w-full max-w-xs">
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
