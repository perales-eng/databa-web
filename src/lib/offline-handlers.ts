/**
 * Registry de handlers client-side.
 *
 * Cada handler recibe el payload que fue encolado y lo manda al server action
 * correspondiente. Si el server action tira error, el procesador de la cola
 * lo maneja (backoff + reintento o marcar failed).
 */

import {
  saveFrequencyResult,
  saveDurationResult,
  saveLatencyResult,
  saveIntensityResult,
  saveOpportunityResult,
  saveTemporalSamplingResult,
  saveEventSamplingResult,
  saveABCRecord,
  saveAnecdotalRecord,
  completeSession,
} from "@/server/measurements";
import type { OperationType } from "./offline-queue";

type HandlerMap = Record<
  OperationType,
  (payload: unknown, meta: { idempotencyKey: string }) => Promise<void>
>;

async function unwrap<T extends { ok: boolean; error?: string }>(
  result: Promise<T>,
): Promise<void> {
  const r = await result;
  if (!r.ok) throw new Error(r.error ?? "Operación rechazada por el servidor");
}

export const handlers: HandlerMap = {
  "frequency.save": async (payload) => {
    await unwrap(saveFrequencyResult(payload as Parameters<typeof saveFrequencyResult>[0]));
  },
  "duration.save": async (payload) => {
    await unwrap(saveDurationResult(payload as Parameters<typeof saveDurationResult>[0]));
  },
  "latency.save": async (payload) => {
    await unwrap(saveLatencyResult(payload as Parameters<typeof saveLatencyResult>[0]));
  },
  "intensity.save": async (payload) => {
    await unwrap(saveIntensityResult(payload as Parameters<typeof saveIntensityResult>[0]));
  },
  "opportunity.save": async (payload) => {
    await unwrap(saveOpportunityResult(payload as Parameters<typeof saveOpportunityResult>[0]));
  },
  "temporal.save": async (payload) => {
    await unwrap(saveTemporalSamplingResult(payload as Parameters<typeof saveTemporalSamplingResult>[0]));
  },
  "event.save": async (payload) => {
    await unwrap(saveEventSamplingResult(payload as Parameters<typeof saveEventSamplingResult>[0]));
  },
  "abc.save": async (payload) => {
    const p = payload as {
      studentId: string;
      sessionId: string;
      behaviorName: string;
      fields: Record<string, string>;
    };
    const fd = new FormData();
    for (const [k, v] of Object.entries(p.fields)) fd.set(k, v);
    await unwrap(saveABCRecord(p.studentId, p.sessionId, p.behaviorName, fd));
  },
  "anecdotal.save": async (payload) => {
    const p = payload as {
      studentId: string;
      sessionId: string;
      behaviorName: string;
      fields: Record<string, string>;
    };
    const fd = new FormData();
    for (const [k, v] of Object.entries(p.fields)) fd.set(k, v);
    await unwrap(saveAnecdotalRecord(p.studentId, p.sessionId, p.behaviorName, fd));
  },
  "session.complete": async (payload) => {
    await unwrap(completeSession((payload as { sessionId: string }).sessionId));
  },
};
