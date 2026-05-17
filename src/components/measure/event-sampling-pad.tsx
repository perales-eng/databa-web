"use client";

import * as React from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEventSamplingResult } from "@/server/measurements";
import { toast } from "sonner";

type Props = {
  sessionId: string;
  studentId: string;
  behaviorName: string;
  sessionDurationMin: number;
  intensityScale: number | null;
  dataSaveType: string;
  onSaved: () => void;
};

type EventEntry = {
  id: number;
  timestamp: number;
  durationSec?: number;
  intensity?: number;
  note?: string;
};

export function EventSamplingPad({
  sessionId,
  studentId,
  behaviorName,
  sessionDurationMin,
  intensityScale,
  dataSaveType,
  onSaved,
}: Props) {
  const [events, setEvents] = React.useState<EventEntry[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<number | null>(null);
  const counter = React.useRef(0);

  function addEvent() {
    counter.current += 1;
    setEvents((prev) => [...prev, { id: counter.current, timestamp: Date.now() }]);
  }

  function removeEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEvent(id: number, patch: Partial<Omit<EventEntry, "id">>) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveEventSamplingResult({
      sessionId,
      studentId,
      behaviorName,
      sessionDurationMin,
      intensityScale,
      dataSaveType,
      events: events.map(({ timestamp, durationSec, intensity, note }) => ({
        timestamp,
        durationSec,
        intensity,
        note,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${behaviorName}" guardado — ${events.length} eventos`);
    setEvents([]);
    onSaved();
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums">{events.length}</p>
          <p className="text-sm text-muted-foreground">eventos registrados</p>
        </div>
        <button
          type="button"
          onClick={addEvent}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 text-xs font-bold select-none gap-1"
        >
          <Plus className="h-6 w-6" />
          EVENTO
        </button>
      </div>

      {events.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.map((ev, i) => (
            <div key={ev.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  #{i + 1} · {new Date(ev.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEvent(ev.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Duración (seg)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={ev.durationSec ?? ""}
                    onChange={(e) => updateEvent(ev.id, { durationSec: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Opcional"
                  />
                </div>
                {intensityScale && (
                  <div className="space-y-1">
                    <Label className="text-xs">Intensidad (1–{intensityScale})</Label>
                    <Input
                      type="number"
                      min={1}
                      max={intensityScale}
                      className="h-8 text-xs"
                      value={ev.intensity ?? ""}
                      onChange={(e) => updateEvent(ev.id, { intensity: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Opcional"
                    />
                  </div>
                )}
              </div>
              {editingNote === ev.id ? (
                <Textarea
                  rows={2}
                  className="text-xs"
                  value={ev.note ?? ""}
                  onChange={(e) => updateEvent(ev.id, { note: e.target.value || undefined })}
                  onBlur={() => setEditingNote(null)}
                  autoFocus
                  placeholder="Nota…"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNote(ev.id)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  {ev.note ? ev.note : "+ Agregar nota"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEvents([])} disabled={events.length === 0}>
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </Button>
        <Button onClick={handleSave} disabled={saving || events.length === 0} className="flex-1">
          {saving ? "Guardando…" : "Guardar resultado"}
        </Button>
      </div>
    </div>
  );
}
