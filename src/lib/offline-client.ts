"use client";

/**
 * API cliente de la cola offline: hook useQueueStatus + helpers de "intentar
 * ejecutar o encolar", y el worker que reacciona a `online` + poll periódico.
 */

import * as React from "react";
import {
  counts,
  enqueue,
  genTempId,
  getCache,
  isNetworkError,
  isOnline,
  isTempId,
  processQueue,
  putCache,
  subscribeToChanges,
  TEMP_PREFIX,
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
    if (result.ok) {
      // Mutation ONLINE exitosa: emitir evento para que SyncRefresh purgue
      // el cache HTML del SW y haga router.refresh(). Sin esto, el SW seguiría
      // sirviendo HTML stale (stale-while-revalidate) en la próxima navegación.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(QUEUE_SYNCED_EVENT, { detail: { ok: 1 } }));
      }
      return { ok: true, deferred: false };
    }
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

// ---------- Create offline con ID temporal (Fase 3C) ----------

/**
 * Representa un item creado offline, pendiente de sync. Se almacena en el
 * cache de IndexedDB bajo keys `temp:students:*` y `temp:sessions:*` para que
 * las listas puedan mergearlos con los datos del server.
 */
export interface TempStudentCache {
  tempId: string;
  name: string;
  color: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: number;
}

export interface TempSessionCache {
  tempId: string;
  studentId: string;
  title: string;
  description: string | null;
  sessionDate: string;
  durationMin: number | null;
  sessionType: "SCHEDULED" | "IMMEDIATE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: number;
}

export const TEMP_STUDENT_KEY_PREFIX = "temp:student:";
export const TEMP_SESSION_KEY_PREFIX = "temp:session:";

function formDataToFields(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/**
 * Crea un estudiante: online llama al server directo, offline genera tempId,
 * guarda en IndexedDB y encola. Devuelve `{id}` como si fuese el server.
 */
export async function createStudentOffline(
  formData: FormData,
  runOnline: (fd: FormData) => Promise<{ ok: true; id: string } | { ok: false; error: string }>,
): Promise<{ ok: true; id: string; deferred: boolean } | { ok: false; error: string }> {
  const fields = formDataToFields(formData);
  if (isOnline()) {
    try {
      const r = await runOnline(formData);
      if (r.ok) return { ok: true, id: r.id, deferred: false };
      return r;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      // fall through: encolar
    }
  }
  const tempId = genTempId();
  const cache: TempStudentCache = {
    tempId,
    name: fields.name ?? "",
    color: fields.color || null,
    birthDate: fields.birthDate || null,
    notes: fields.notes || null,
    createdAt: Date.now(),
  };
  await putCache(TEMP_STUDENT_KEY_PREFIX + tempId, cache);
  await enqueue("student.create", { tempId, fields });
  return { ok: true, id: tempId, deferred: true };
}

/**
 * Crea una sesión: online directo, offline con tempId cacheado y encolado.
 * El studentId puede ser temp (si se creó offline antes).
 */
export async function createSessionOffline(
  formData: FormData,
  runOnline: (fd: FormData) => Promise<{ ok: true; id: string } | { ok: false; error: string }>,
): Promise<{ ok: true; id: string; deferred: boolean } | { ok: false; error: string }> {
  const fields = formDataToFields(formData);
  const studentId = fields.studentId ?? "";
  // Si el studentId es temp, el server rechazaría (cuid fail). Forzamos offline path.
  const forceOffline = isTempId(studentId);
  if (!forceOffline && isOnline()) {
    try {
      const r = await runOnline(formData);
      if (r.ok) return { ok: true, id: r.id, deferred: false };
      return r;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }
  const tempId = genTempId();
  const cache: TempSessionCache = {
    tempId,
    studentId,
    title: fields.title ?? "",
    description: fields.description || null,
    sessionDate: fields.sessionDate ?? new Date().toISOString(),
    durationMin: fields.durationMin ? Number(fields.durationMin) : null,
    sessionType: (fields.sessionType as "SCHEDULED" | "IMMEDIATE") ?? "SCHEDULED",
    status: (fields.status as TempSessionCache["status"]) ?? "PENDING",
    createdAt: Date.now(),
  };
  await putCache(TEMP_SESSION_KEY_PREFIX + tempId, cache);
  await enqueue("session.create", { tempId, studentId, fields });
  return { ok: true, id: tempId, deferred: true };
}

/**
 * Hook: lista todos los temp items bajo un prefix. Devuelve un snapshot que
 * se actualiza con `subscribeToChanges` (sync cuando se encola/sincroniza).
 */
export function useTempItems<T>(keyPrefix: string): T[] {
  const [items, setItems] = React.useState<T[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function refresh() {
      // Importamos dinámicamente para no cargar dexie en SSR.
      const { listCacheKeys, getCache } = await import("./offline-queue");
      const keys = (await listCacheKeys()).filter((k) => k.startsWith(keyPrefix));
      const entries = await Promise.all(keys.map((k) => getCache<T>(k)));
      if (cancelled) return;
      setItems(entries.filter(Boolean).map((e) => (e as { data: T }).data));
    }
    void refresh();
    const unsub = subscribeToChanges(() => { void refresh(); });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [keyPrefix]);

  return items;
}

export { isTempId, TEMP_PREFIX };

// ---------- Snapshot de datos: persiste y lee cache (Fase 3B) ----------

/**
 * Hook para páginas: cuando el server te dio `data` fresco, lo persistimos
 * en IndexedDB bajo `key`. Si volvés a esta pantalla offline, otro componente
 * puede leerlo con `useCachedSnapshot`.
 *
 * Es fire-and-forget — no bloquea renderizado online.
 */
export function usePersistSnapshot<T>(key: string, data: T): void {
  React.useEffect(() => {
    // No hace nada si corre en SSR.
    if (typeof window === "undefined") return;
    void putCache(key, data);
  }, [key, data]);
}

/**
 * Hook para páginas: lee el snapshot cacheado de `key`. Devuelve:
 *  - loading:true inicialmente
 *  - {data, updatedAt} si había cache
 *  - {data: null} si no había
 */
export function useCachedSnapshot<T>(key: string): {
  loading: boolean;
  data: T | null;
  updatedAt: number | null;
} {
  const [state, setState] = React.useState<{
    loading: boolean;
    data: T | null;
    updatedAt: number | null;
  }>({ loading: true, data: null, updatedAt: null });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const entry = await getCache<T>(key);
      if (cancelled) return;
      setState({
        loading: false,
        data: entry?.data ?? null,
        updatedAt: entry?.updatedAt ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}

// ---------- Worker: reacciona a online + polling ----------

let workerStarted = false;

/** Nombre del evento que emitimos cuando sincronizamos ops exitosamente.
 *  Un componente en el layout lo escucha y dispara router.refresh() para
 *  que la UI muestre los datos frescos sin que el usuario tenga que recargar. */
export const QUEUE_SYNCED_EVENT = "databa:queue-synced";

/**
 * Wrapper que ejecuta un server action mutación y si sale OK dispara el evento
 * de refresh global (el mismo que usa la cola offline al sincronizar). Esto
 * garantiza que:
 *  - El HTML cache del SW se limpia (no sirve data stale en próxima navegación)
 *  - Next.js vuelve a pedir el RSC → trae data fresh del server
 *
 * Uso típico desde un component "use client":
 *   const result = await mutate(updateSession(id, formData));
 *   if (result.ok) { ... }
 *
 * Alternativa usable con closures:
 *   const result = await mutate(() => deleteStudent(id));
 */
export async function mutate<T>(
  action: Promise<T> | (() => Promise<T>),
): Promise<T> {
  const result = await (typeof action === "function" ? action() : action);
  // Emitimos si el resultado NO indica fallo explícito. Esto cubre tanto
  // acciones que devuelven {ok: true}, como las que devuelven void o hacen
  // redirect (deleteStudent, etc.). Solo cancelamos si { ok: false }.
  const indicatesFailure =
    result != null &&
    typeof result === "object" &&
    "ok" in result &&
    (result as { ok: boolean }).ok === false;
  if (!indicatesFailure && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUEUE_SYNCED_EVENT, { detail: { ok: 1 } }));
  }
  return result;
}

export function startQueueWorker() {
  if (workerStarted || typeof window === "undefined") return;
  workerStarted = true;

  async function flush() {
    if (!isOnline()) return;
    try {
      const result = await processQueue(handlers);
      if (result.ok > 0) {
        window.dispatchEvent(
          new CustomEvent(QUEUE_SYNCED_EVENT, { detail: { ok: result.ok } }),
        );
      }
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
