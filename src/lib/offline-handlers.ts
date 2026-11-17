/**
 * Registry de handlers client-side.
 *
 * Cada handler recibe el payload que fue encolado y lo manda al server action
 * correspondiente. Si el server action tira error, el procesador de la cola
 * lo maneja (backoff + reintento o marcar failed).
 *
 * Fase 3C: los handlers de `*.create` devuelven `{tempId, realId, entity}` para
 * que el procesador persista el mapping. Las ops dependientes reciben `idMap`
 * para reescribir referencias temporales antes de llamar al server.
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
import { createStudent } from "@/server/students";
import { createSession } from "@/server/sessions";
import { resolveId, type OperationType, type OperationHandler } from "./offline-queue";

type HandlerMap = Record<OperationType, OperationHandler>;

async function unwrap<T extends { ok: boolean; error?: string }>(
  result: Promise<T>,
): Promise<T> {
  const r = await result;
  if (!r.ok) throw new Error(r.error ?? "Operación rechazada por el servidor");
  return r;
}

/** Reconstruye un FormData desde un plain object serializable. */
function toFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

export const handlers: HandlerMap = {
  // ---------- Creates (fase 3C) ----------
  "student.create": async (payload) => {
    const p = payload as { tempId: string; fields: Record<string, string> };
    const r = (await unwrap(createStudent(toFormData(p.fields)))) as { ok: true; id: string };
    // No borramos el temp cache acá: dejamos que PendingStudentsList lo oculte
    // cuando vea el idMap. Así evitamos el parpadeo "temp desaparece → server
    // refresh aún no llegó → nada visible → aparece real".
    return { tempId: p.tempId, realId: r.id, entity: "student" };
  },
  "session.create": async (payload, { idMap }) => {
    const p = payload as {
      tempId: string;
      studentId: string;
      fields: Record<string, string>;
    };
    // El studentId puede ser temp (si también se creó offline). Resolver.
    const realStudentId = resolveId(p.studentId, idMap);
    const fields = { ...p.fields, studentId: realStudentId };
    const r = (await unwrap(createSession(toFormData(fields)))) as { ok: true; id: string };
    return { tempId: p.tempId, realId: r.id, entity: "session" };
  },

  // ---------- Measurements ----------
  "frequency.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveFrequencyResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveFrequencyResult({ ...p, sessionId, behaviorMethodId }));
  },
  "duration.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveDurationResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveDurationResult({ ...p, sessionId, behaviorMethodId }));
  },
  "latency.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveLatencyResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveLatencyResult({ ...p, sessionId, behaviorMethodId }));
  },
  "intensity.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveIntensityResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveIntensityResult({ ...p, sessionId, behaviorMethodId }));
  },
  "opportunity.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveOpportunityResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveOpportunityResult({ ...p, sessionId, behaviorMethodId }));
  },
  "temporal.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveTemporalSamplingResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const behaviorMethodId = resolveId(p.behaviorMethodId, idMap);
    await unwrap(saveTemporalSamplingResult({ ...p, sessionId, behaviorMethodId }));
  },
  "event.save": async (payload, { idMap }) => {
    const p = payload as Parameters<typeof saveEventSamplingResult>[0];
    const sessionId = resolveId(p.sessionId, idMap);
    const studentId = resolveId(p.studentId, idMap);
    await unwrap(saveEventSamplingResult({ ...p, sessionId, studentId }));
  },
  "abc.save": async (payload, { idMap }) => {
    const p = payload as {
      studentId: string;
      sessionId: string;
      behaviorName: string;
      fields: Record<string, string>;
    };
    const studentId = resolveId(p.studentId, idMap);
    const sessionId = resolveId(p.sessionId, idMap);
    await unwrap(saveABCRecord(studentId, sessionId, p.behaviorName, toFormData(p.fields)));
  },
  "anecdotal.save": async (payload, { idMap }) => {
    const p = payload as {
      studentId: string;
      sessionId: string;
      behaviorName: string;
      fields: Record<string, string>;
    };
    const studentId = resolveId(p.studentId, idMap);
    const sessionId = resolveId(p.sessionId, idMap);
    await unwrap(saveAnecdotalRecord(studentId, sessionId, p.behaviorName, toFormData(p.fields)));
  },
  "session.complete": async (payload, { idMap }) => {
    const p = payload as { sessionId: string };
    const sessionId = resolveId(p.sessionId, idMap);
    await unwrap(completeSession(sessionId));
  },
};
