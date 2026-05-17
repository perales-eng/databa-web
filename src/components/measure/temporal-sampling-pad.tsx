"use client";

import * as React from "react";
import { CheckCircle, XCircle, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTemporalSamplingResult } from "@/server/measurements";
import { buildIntervals } from "@/lib/measurements/calc";
import { toast } from "sonner";

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  studentId: string;
  behaviorName: string;
  samplingType: "PARTIAL" | "WHOLE" | "MOMENTARY";
  intervalDurationSec: number;
  totalDurationSec: number;
  onSaved: () => void;
};

type IntervalState = { index: number; startSec: number; marked: boolean | null };

const SAMPLING_LABELS: Record<string, string> = {
  PARTIAL: "Partial interval",
  WHOLE: "Whole interval",
  MOMENTARY: "Momentary",
};

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TemporalSamplingPad({
  sessionId,
  behaviorMethodId,
  studentId,
  behaviorName,
  samplingType,
  intervalDurationSec,
  totalDurationSec,
  onSaved,
}: Props) {
  const schedule = buildIntervals(totalDurationSec, intervalDurationSec);
  const [intervals, setIntervals] = React.useState<IntervalState[]>(
    schedule.map((s) => ({ ...s, marked: null })),
  );
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = Math.min(Math.floor(elapsed / intervalDurationSec), schedule.length - 1);
  const isFinished = elapsed >= totalDurationSec;

  function start() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= totalDurationSec) {
          clearInterval(intervalRef.current!);
          setRunning(false);
        }
        return next;
      });
    }, 1000);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setIntervals(schedule.map((s) => ({ ...s, marked: null })));
  }

  function mark(index: number, value: boolean) {
    setIntervals((prev) =>
      prev.map((iv) => (iv.index === index ? { ...iv, marked: value } : iv)),
    );
  }

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    const completedIntervals = intervals.map((iv) => ({
      index: iv.index,
      startSec: iv.startSec,
      marked: iv.marked ?? false,
    }));
    const result = await saveTemporalSamplingResult({
      sessionId,
      behaviorMethodId,
      studentId,
      samplingType,
      intervalDurationSec,
      totalDurationSec,
      intervals: completedIntervals,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const marked = completedIntervals.filter((i) => i.marked).length;
    const pct = ((marked / completedIntervals.length) * 100).toFixed(0);
    toast.success(`"${behaviorName}" guardado — ${marked}/${completedIntervals.length} intervalos (${pct}%)`);
    reset();
    onSaved();
  }

  const markedCount = intervals.filter((i) => i.marked === true).length;
  const pct =
    intervals.filter((i) => i.marked !== null).length > 0
      ? ((markedCount / intervals.filter((i) => i.marked !== null).length) * 100).toFixed(0)
      : "—";

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{SAMPLING_LABELS[samplingType]}</span>
        <span className="font-mono text-muted-foreground">
          {formatSec(elapsed)} / {formatSec(totalDurationSec)}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(elapsed / totalDurationSec) * 100}%` }}
        />
      </div>

      <div className="text-center">
        <p className="text-4xl font-bold tabular-nums">{pct}%</p>
        <p className="text-xs text-muted-foreground">
          {markedCount} marcados · intervalo {currentIndex + 1}/{schedule.length}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
        {intervals.map((iv, i) => {
          const isCurrent = running && i === currentIndex;
          const isActive = running ? i <= currentIndex : true;
          return (
            <button
              key={iv.index}
              type="button"
              onClick={() => {
                if (!isActive && !isFinished) return;
                mark(iv.index, iv.marked !== true);
              }}
              className={`flex h-10 w-full items-center justify-center rounded text-xs font-bold transition-colors ${
                iv.marked === true
                  ? "bg-primary text-primary-foreground"
                  : iv.marked === false
                  ? "bg-rose-500/20 text-rose-700"
                  : isCurrent
                  ? "bg-amber-400/40 animate-pulse"
                  : isActive || isFinished
                  ? "bg-muted hover:bg-muted/80"
                  : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {iv.index + 1}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {!running && !isFinished && (
          <Button onClick={start} className="flex-1">
            <Play className="h-4 w-4" /> Iniciar
          </Button>
        )}
        {isFinished && (
          <p className="flex-1 text-center text-sm font-medium text-emerald-600">
            Sesión completada — marcá los intervalos y guardá
          </p>
        )}
        <Button variant="outline" size="sm" onClick={reset} disabled={running}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3 text-sm">
        <button
          type="button"
          onClick={() => intervals.forEach((_, i) => mark(i, true))}
          disabled={running && !isFinished}
          className="flex items-center gap-1 text-emerald-600 hover:underline disabled:opacity-40"
        >
          <CheckCircle className="h-4 w-4" /> Todos sí
        </button>
        <button
          type="button"
          onClick={() => intervals.forEach((_, i) => mark(i, false))}
          disabled={running && !isFinished}
          className="flex items-center gap-1 text-rose-500 hover:underline disabled:opacity-40"
        >
          <XCircle className="h-4 w-4" /> Todos no
        </button>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || intervals.every((i) => i.marked === null) || running}
        className="w-full"
      >
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
