"use client";

import * as React from "react";
import { RotateCcw, StopCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDurationResult } from "@/server/measurements";
import { toast } from "sonner";
import { useMeasurementProgress } from "@/components/measure/_hooks/use-measurement-progress";

type Snapshot = { durations: number[] };

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  behaviorName: string;
  sessionStartMs: number;
  onSaved: () => void;
};

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DurationPad({ sessionId, behaviorMethodId, behaviorName, sessionStartMs, onSaved }: Props) {
  const [durations, setDurations] = React.useState<number[]>([]);
  const [episodeStart, setEpisodeStart] = React.useState<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const { clear } = useMeasurementProgress<Snapshot>({
    sessionId,
    behaviorMethodId,
    state: { durations },
    isDirty: durations.length > 0,
    onHydrate: (snap) => {
      if (Array.isArray(snap.durations)) setDurations(snap.durations);
    },
  });

  function startEpisode() {
    setEpisodeStart(Date.now());
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }

  function stopEpisode() {
    if (episodeStart === null) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const durSec = Math.round((Date.now() - episodeStart) / 1000);
    setDurations((prev) => [...prev, durSec]);
    setEpisodeStart(null);
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
    const result = await saveDurationResult({
      sessionId,
      behaviorMethodId,
      durationsSec: durations,
      sessionDurationSec,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const avg = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : 0;
    toast.success(`"${behaviorName}" guardado — ${durations.length} episodios, promedio ${avg}s`);
    await clear();
    setDurations([]);
    onSaved();
  }

  const isRunning = episodeStart !== null;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        {isRunning ? (
          <>
            <p className="text-6xl font-bold tabular-nums text-primary">{formatSec(elapsed)}</p>
            <p className="mt-1 text-sm text-muted-foreground">episodio en curso</p>
          </>
        ) : (
          <>
            <p className="text-6xl font-bold tabular-nums">{durations.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">episodios registrados</p>
          </>
        )}
      </div>

      {durations.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {durations.map((d, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
              {formatSec(d)}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {!isRunning ? (
          <button
            type="button"
            onClick={startEpisode}
            className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 text-sm font-bold select-none"
          >
            <Timer className="mr-1 h-5 w-5" /> INICIO
          </button>
        ) : (
          <button
            type="button"
            onClick={stopEpisode}
            className="flex h-28 w-28 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-95 text-sm font-bold select-none"
          >
            <StopCircle className="mr-1 h-5 w-5" /> FIN
          </button>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => setDurations([])} disabled={durations.length === 0 || isRunning}>
        <RotateCcw className="h-4 w-4" /> Reiniciar
      </Button>

      <Button onClick={handleSave} disabled={saving || durations.length === 0 || isRunning} className="w-full max-w-xs">
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
