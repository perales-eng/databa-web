"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrequencyPad } from "@/components/measure/frequency-pad";
import { DurationPad } from "@/components/measure/duration-pad";
import { LatencyPad } from "@/components/measure/latency-pad";
import { IntensityPad } from "@/components/measure/intensity-pad";
import { OpportunityPad } from "@/components/measure/opportunity-pad";
import { TemporalSamplingPad } from "@/components/measure/temporal-sampling-pad";
import { ABCForm } from "@/components/measure/abc-form";
import { AnecdotalForm } from "@/components/measure/anecdotal-form";
import { EventSamplingPad } from "@/components/measure/event-sampling-pad";
import { completeSession } from "@/server/measurements";
import type { MeasurementMethodType } from "@prisma/client";

type BehaviorMethod = {
  id: string;
  behaviorName: string;
  methodType: MeasurementMethodType;
  description: string | null;
  config: Record<string, unknown>;
};

type Props = {
  sessionId: string;
  studentId: string;
  studentName: string;
  behaviorMethods: BehaviorMethod[];
};

const METHOD_LABELS: Record<MeasurementMethodType, string> = {
  FREQUENCY: "Frecuencia",
  DURATION: "Duración",
  LATENCY: "Latencia",
  INTENSITY: "Intensidad",
  PERCENTAGE_OPPORTUNITY: "Oportunidades",
  TEMPORAL_SAMPLING: "Muestreo temporal",
  EVENT_SAMPLING: "Event sampling",
  ANECDOTAL: "Anecdótico",
  ABC: "ABC",
};

const METHOD_COLORS: Record<MeasurementMethodType, string> = {
  FREQUENCY: "bg-blue-500/15 text-blue-700",
  DURATION: "bg-violet-500/15 text-violet-700",
  LATENCY: "bg-amber-500/15 text-amber-700",
  INTENSITY: "bg-orange-500/15 text-orange-700",
  PERCENTAGE_OPPORTUNITY: "bg-emerald-500/15 text-emerald-700",
  TEMPORAL_SAMPLING: "bg-teal-500/15 text-teal-700",
  EVENT_SAMPLING: "bg-pink-500/15 text-pink-700",
  ANECDOTAL: "bg-slate-500/15 text-slate-700",
  ABC: "bg-red-500/15 text-red-700",
};

function MeasurePad({
  bm,
  sessionId,
  studentId,
  sessionStartMs,
  onSaved,
}: {
  bm: BehaviorMethod;
  sessionId: string;
  studentId: string;
  sessionStartMs: number;
  onSaved: () => void;
}) {
  const cfg = bm.config;

  switch (bm.methodType) {
    case "FREQUENCY":
      return (
        <FrequencyPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          behaviorName={bm.behaviorName}
          sessionStartMs={sessionStartMs}
          onSaved={onSaved}
        />
      );
    case "DURATION":
      return (
        <DurationPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          behaviorName={bm.behaviorName}
          sessionStartMs={sessionStartMs}
          onSaved={onSaved}
        />
      );
    case "LATENCY":
      return (
        <LatencyPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          behaviorName={bm.behaviorName}
          sessionStartMs={sessionStartMs}
          onSaved={onSaved}
        />
      );
    case "INTENSITY":
      return (
        <IntensityPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          behaviorName={bm.behaviorName}
          sessionStartMs={sessionStartMs}
          scaleMin={(cfg.scaleMin as number) ?? 1}
          scaleMax={(cfg.scaleMax as number) ?? 10}
          onSaved={onSaved}
        />
      );
    case "PERCENTAGE_OPPORTUNITY":
      return (
        <OpportunityPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          studentId={studentId}
          behaviorName={bm.behaviorName}
          maxOpportunities={(cfg.maxOpportunities as number | null) ?? null}
          opportunityDescription={(cfg.opportunityDescription as string) ?? ""}
          correctResponseDescription={(cfg.correctResponseDescription as string) ?? ""}
          onSaved={onSaved}
        />
      );
    case "TEMPORAL_SAMPLING":
      return (
        <TemporalSamplingPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          studentId={studentId}
          behaviorName={bm.behaviorName}
          samplingType={(cfg.samplingType as "PARTIAL" | "WHOLE" | "MOMENTARY") ?? "PARTIAL"}
          intervalDurationSec={(cfg.intervalDurationSeconds as number) ?? 10}
          totalDurationSec={(cfg.totalDurationSeconds as number) ?? 300}
          onSaved={onSaved}
        />
      );
    case "EVENT_SAMPLING":
      return (
        <EventSamplingPad
          sessionId={sessionId}
          behaviorMethodId={bm.id}
          studentId={studentId}
          behaviorName={bm.behaviorName}
          sessionDurationMin={(cfg.sessionDurationMinutes as number) ?? 30}
          intensityScale={(cfg.intensityScale as number | null) ?? null}
          dataSaveType={(cfg.dataSaveType as string) ?? "BOTH"}
          onSaved={onSaved}
        />
      );
    case "ABC":
      return <ABCForm sessionId={sessionId} studentId={studentId} behaviorName={bm.behaviorName} onSaved={onSaved} />;
    case "ANECDOTAL":
      return <AnecdotalForm sessionId={sessionId} studentId={studentId} behaviorName={bm.behaviorName} onSaved={onSaved} />;
  }
}

export function MeasureShell({ sessionId, studentId, studentName, behaviorMethods }: Props) {
  const [savedCounts, setSavedCounts] = React.useState<Record<string, number>>({});
  const [completing, setCompleting] = React.useState(false);
  const [sessionStartMs] = React.useState<number>(() => Date.now());

  function handleSaved(bmId: string) {
    setSavedCounts((prev) => ({ ...prev, [bmId]: (prev[bmId] ?? 0) + 1 }));
  }

  async function handleComplete() {
    setCompleting(true);
    const result = await completeSession(sessionId);
    setCompleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Sesión completada");
    window.location.href = `/sessions/${sessionId}`;
  }

  if (behaviorMethods.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">
          Este estudiante no tiene métodos de medición configurados.
        </p>
        <a href={`/students/${studentId}/behaviors/new`} className="text-sm text-primary underline">
          Agregar método de medición
        </a>
      </div>
    );
  }

  const totalSaved = Object.values(savedCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{studentName}</p>
          <p className="text-xs text-muted-foreground">
            {behaviorMethods.length} conductas · {totalSaved} registros guardados
          </p>
        </div>
        <Button onClick={handleComplete} disabled={completing} variant="outline" size="sm">
          <CheckCircle2 className="h-4 w-4" />
          {completing ? "Completando…" : "Finalizar sesión"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {behaviorMethods.map((bm) => {
          const count = savedCounts[bm.id] ?? 0;
          return (
            <Card key={bm.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="truncate text-base">{bm.behaviorName}</CardTitle>
                    <Badge className={METHOD_COLORS[bm.methodType]}>
                      {METHOD_LABELS[bm.methodType]}
                    </Badge>
                  </div>
                  {count > 0 && (
                    <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </div>
                {bm.description && (
                  <p className="text-xs text-muted-foreground">{bm.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <MeasurePad
                  bm={bm}
                  sessionId={sessionId}
                  studentId={studentId}
                  sessionStartMs={sessionStartMs}
                  onSaved={() => handleSaved(bm.id)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
