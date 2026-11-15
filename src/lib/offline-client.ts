"use client";

/**
 * API cliente de la cola offline: hook useQueueStatus + helpers de "intentar
 * ejecutar o encolar", y el worker que reacciona a `online` + poll periódico.
 */

import * as React from "react";
import {
  counts,
  enqueue,
  isNetworkError,
  isOnline,
  processQueue,
  subscribeToChanges,
  type OperationType,
} from "./offline-queue";
import { handlers } from "./offline-handlers";

// ---------- Hook: status reactivo ----------

interface QueueStatus {
  pending: number;
  failed: number;
  online: boolean;
}

const EMPTY: QueueStatus = { pending: 0, failed: 0, online: true };

export function useQueueStatus(): QueueStatus {
  const [status, setStatus] = React.useState<QueueStatus>(EMPTY);

  React.useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const c = await counts();
      if (!cancelled) {
        setStatus({ pending: c.pending, failed: c.failed, online: isOnline() });
      }
    }
    refresh();
    const unsub = subscribeToChanges(() => { void refresh(); });
    const onOn = () => setStatus((s) => ({ ...s, online: true }));
    const onOff = () => setStatus((s) => ({ ...s, online: false }));
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  return status;
}

// ---------- "Intenta o encola" ----------

/**
 * Patrón principal para acciones críticas offline-aware:
 * - Si hay red: intenta ejecutar el server action directamente.
 * - Si el server tira error de red o estamos offline: encolamos.
 * - Si el server tira error de app (permisos, validación): propaga al UI.
 *
 * Devuelve `{ok: true, deferred: boolean}`. `deferred` indica si quedó encolado.
 */
export async function runOrEnqueue(
  type: OperationType,
  payload: unknown,
  run: () => Promise<{ ok: boolean; error?: string }>,
): Promise<{ ok: true; deferred: boolean } | { ok: false; error: string }> {
  if (!isOnline()) {
    await enqueue(type, payload);
    return { ok: true, deferred: true };
  }
  try {
    const result = await run();
    if (result.ok) return { ok: true, deferred: false };
    // Error de app (validación, permisos). No encolamos, devolvemos al UI.
    return { ok: false, error: result.error ?? "Rechazado por el servidor" };
  } catch (err) {
    // Error inesperado: si parece de red, encolamos. Si no, lo propagamos.
    if (isNetworkError(err)) {
      await enqueue(type, payload);
      return { ok: true, deferred: true };
    }
    throw err;
  }
}

// ---------- Worker: reacciona a online + polling ----------

let workerStarted = false;

export function startQueueWorker() {
  if (workerStarted || typeof window === "undefined") return;
  workerStarted = true;

  async function flush() {
    if (!isOnline()) return;
    try {
      await processQueue(handlers);
    } catch {
      // processQueue ya maneja errores por operación; un throw acá sería bug nuestro
    }
  }

  // Al volver online, procesá.
  window.addEventListener("online", () => { void flush(); });

  // Reintento periódico (30s) por si quedan operaciones con backoff vencido.
  const interval = window.setInterval(() => { void flush(); }, 30_000);

  // Primer flush apenas carga la app.
  void flush();

  // Limpieza al descargar (no es crítica pero es correcta).
  window.addEventListener("beforeunload", () => window.clearInterval(interval));
}
