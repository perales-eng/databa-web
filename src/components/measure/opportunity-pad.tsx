"use client";

import * as React from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveOpportunityResult } from "@/server/measurements";
import { toast } from "sonner";
import { useMeasurementProgress } from "@/components/measure/_hooks/use-measurement-progress";

type Snapshot = { opportunities: Opportunity[] };

type Props = {
  sessionId: string;
  behaviorMethodId: string;
  studentId: string;
  behaviorName: string;
  maxOpportunities: number | null;
  opportunityDescription: string;
  correctResponseDescription: string;
  onSaved: () => void;
};

type Opportunity = { timestamp: number; success: boolean };

export function OpportunityPad({
  sessionId,
  behaviorMethodId,
  studentId,
  behaviorName,
  maxOpportunities,
  opportunityDescription,
  correctResponseDescription,
  onSaved,
}: Props) {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [saving, setSaving] = React.useState(false);

  const { clear } = useMeasurementProgress<Snapshot>({
    sessionId,
    behaviorMethodId,
    state: { opportunities },
    isDirty: opportunities.length > 0,
    onHydrate: (snap) => {
      if (Array.isArray(snap.opportunities)) setOpportunities(snap.opportunities);
    },
  });

  const isComplete = maxOpportunities !== null && opportunities.length >= maxOpportunities;

  function record(success: boolean) {
    if (isComplete) return;
    setOpportunities((prev) => [...prev, { timestamp: Date.now(), success }]);
  }

  const correct = opportunities.filter((o) => o.success).length;
  const incorrect = opportunities.length - correct;
  const pct = opportunities.length > 0 ? ((correct / opportunities.length) * 100).toFixed(0) : "—";

  async function handleSave() {
    setSaving(true);
    const result = await saveOpportunityResult({
      sessionId,
      behaviorMethodId,
      studentId,
      opportunities,
      endCondition: isComplete ? "OPPORTUNITY_LIMIT" : "MANUAL",
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${behaviorName}" guardado — ${correct}/${opportunities.length} (${pct}%)`);
    await clear();
    setOpportunities([]);
    onSaved();
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <p className="text-6xl font-bold tabular-nums">{pct}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {correct} correctas · {incorrect} incorrectas · {opportunities.length}
          {maxOpportunities ? `/${maxOpportunities}` : ""} total
        </p>
      </div>

      {opportunityDescription && (
        <p className="text-center text-sm text-muted-foreground max-w-xs">
          <span className="font-medium">Oportunidad:</span> {opportunityDescription}
        </p>
      )}
      {correctResponseDescription && (
        <p className="text-center text-sm text-muted-foreground max-w-xs">
          <span className="font-medium">Respuesta correcta:</span> {correctResponseDescription}
        </p>
      )}

      <div className="flex gap-6">
        <button
          type="button"
          onClick={() => record(true)}
          disabled={isComplete}
          className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform active:scale-95 text-sm font-bold select-none gap-1 disabled:opacity-40"
        >
          <CheckCircle className="h-7 w-7" />
          CORRECTO
        </button>
        <button
          type="button"
          onClick={() => record(false)}
          disabled={isComplete}
          className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition-transform active:scale-95 text-sm font-bold select-none gap-1 disabled:opacity-40"
        >
          <XCircle className="h-7 w-7" />
          INCORRECTO
        </button>
      </div>

      {opportunities.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {opportunities.map((o, i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${
                o.success ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}
            >
              {o.success ? "C" : "I"}
            </span>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setOpportunities([])} disabled={opportunities.length === 0}>
        <RotateCcw className="h-4 w-4" /> Reiniciar
      </Button>

      <Button onClick={handleSave} disabled={saving || opportunities.length === 0} className="w-full max-w-xs">
        {saving ? "Guardando…" : "Guardar resultado"}
      </Button>
    </div>
  );
}
