/**
 * Offline queue para operaciones de datos.
 *
 * Patrón:
 *  1. El cliente llama `enqueueOrRun(op)` en vez de la server action directo.
 *  2. Si hay red: intenta ejecutar; si falla por red, encola en IndexedDB.
 *  3. Si no hay red: encola directo.
 *  4. Un worker escucha `online` event y procesa la cola con backoff.
 *  5. Después de N intentos fallidos se marca como `failed` y notifica al UI.
 *
 * Importante: las server actions reales viven en el server. Desde el cliente
 * solo podemos invocarlas por referencia. Usamos un **registry** en
 * `operation-handlers.ts` que mapea `op.type` → función async que llama al
 * action correcto con el payload.
 */

import Dexie, { type EntityTable, type Table } from "dexie";

// ---------- Tipos ----------

export type OperationType =
  | "frequency.save"
  | "duration.save"
  | "latency.save"
  | "intensity.save"
  | "opportunity.save"
  | "temporal.save"
  | "event.save"
  | "abc.save"
  | "anecdotal.save"
  | "session.complete";

export type OperationStatus = "pending" | "failed";

export interface PendingOperation {
  id?: number;
  type: OperationType;
  // Payload serializado. Los handlers son responsables de deserializar.
  payload: unknown;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  status: OperationStatus;
  lastError?: string;
  // Idempotency key — usamos esto para que el servidor pueda deduplicar.
  idempotencyKey: string;
}

// ---------- Dexie DB ----------

export interface CacheEntry {
  key: string;
  data: unknown;
  updatedAt: number;
}

class OfflineDb extends Dexie {
  pending!: EntityTable<PendingOperation, "id">;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super("databa-offline-queue");
    this.version(1).stores({
      pending: "++id, status, type, createdAt",
    });
    // Fase 3B: tabla de snapshots de datos leídos del server.
    this.version(2).stores({
      pending: "++id, status, type, createdAt",
      cache: "key, updatedAt",
    });
  }
}

let dbInstance: OfflineDb | null = null;

function getDb(): OfflineDb | null {
  if (typeof window === "undefined") return null;
  if (!dbInstance) dbInstance = new OfflineDb();
  return dbInstance;
}

// ---------- API pública ----------

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Agrega una operación a la cola. Útil cuando estás seguro de que querés
 * encolar sin intentar primero (ej. si ya detectaste offline).
 */
export async function enqueue(type: OperationType, payload: unknown): Promise<PendingOperation> {
  const db = getDb();
  if (!db) throw new Error("Offline queue no disponible en SSR");
  const now = Date.now();
  const op: PendingOperation = {
    type,
    payload,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    status: "pending",
    idempotencyKey: uuid(),
  };
  const id = await db.pending.add(op);
  op.id = id;
  notifyChange();
  return op;
}

/** Elimina una operación (al terminar bien o al ser descartada). */
export async function remove(id: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pending.delete(id);
  notifyChange();
}

/** Marca una operación como fallida después de agotar reintentos. */
export async function markFailed(id: number, error: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pending.update(id, {
    status: "failed",
    lastError: error,
    updatedAt: Date.now(),
  });
  notifyChange();
}

/** Lista operaciones por estado. */
export async function listByStatus(status: OperationStatus): Promise<PendingOperation[]> {
  const db = getDb();
  if (!db) return [];
  return db.pending.where("status").equals(status).sortBy("createdAt");
}

/** Cuenta operaciones pendientes y fallidas. */
export async function counts(): Promise<{ pending: number; failed: number }> {
  const db = getDb();
  if (!db) return { pending: 0, failed: 0 };
  const [pending, failed] = await Promise.all([
    db.pending.where("status").equals("pending").count(),
    db.pending.where("status").equals("failed").count(),
  ]);
  return { pending, failed };
}

/** Reintenta explícitamente todas las fallidas (devuelve a pending). */
export async function retryFailed(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pending.where("status").equals("failed").modify({
    status: "pending",
    attempts: 0,
    lastError: undefined,
    updatedAt: Date.now(),
  });
  notifyChange();
}

/** Incrementa el contador de intentos y guarda el último error. */
async function bumpAttempt(id: number, error?: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const op = await db.pending.get(id);
  if (!op) return;
  await db.pending.update(id, {
    attempts: op.attempts + 1,
    lastError: error,
    updatedAt: Date.now(),
  });
  notifyChange();
}

// ---------- Procesador de cola ----------

const MAX_ATTEMPTS = 5;
let processing = false;

/** Backoff: 2s, 5s, 15s, 1m, 5m */
const BACKOFF_MS = [2_000, 5_000, 15_000, 60_000, 300_000];

/**
 * Procesa la cola. Si ya está corriendo, retorna inmediatamente.
 * Llama a `handlers[op.type](op.payload, { idempotencyKey })` para cada operación.
 */
export async function processQueue(
  handlers: Record<OperationType, (payload: unknown, meta: { idempotencyKey: string }) => Promise<void>>,
): Promise<{ ok: number; failed: number; retried: number }> {
  if (processing) return { ok: 0, failed: 0, retried: 0 };
  processing = true;
  try {
    const pending = await listByStatus("pending");
    let ok = 0, failed = 0, retried = 0;
    for (const op of pending) {
      if (!op.id) continue;
      // Respetar backoff: si el último intento fue muy reciente, saltar esta vuelta.
      // op.attempts cuenta intentos ya hechos. Después del 1er fallo (attempts=1),
      // esperamos BACKOFF_MS[0]=2s. Después del 2º fallo (attempts=2), BACKOFF_MS[1]=5s, etc.
      if (op.attempts > 0) {
        const idx = Math.min(op.attempts - 1, BACKOFF_MS.length - 1);
        const backoff = BACKOFF_MS[idx];
        if (Date.now() - op.updatedAt < backoff) continue;
      }

      try {
        const handler = handlers[op.type];
        if (!handler) throw new Error(`No handler para ${op.type}`);
        await handler(op.payload, { idempotencyKey: op.idempotencyKey });
        await remove(op.id);
        ok += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await bumpAttempt(op.id, msg);
        if (op.attempts + 1 >= MAX_ATTEMPTS) {
          await markFailed(op.id, msg);
          failed += 1;
        } else {
          retried += 1;
        }
      }
    }
    return { ok, failed, retried };
  } finally {
    processing = false;
  }
}

// ---------- Eventos de cambio (para hooks de React) ----------

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyChange() {
  for (const l of listeners) l();
}

/** Suscripción para React (useSyncExternalStore). */
export function subscribeToChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------- Detección de errores de red vs errores de app ----------

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // fetch failed
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("networkerror") ||
      m.includes("load failed") ||
      m.includes("timeout") ||
      m.includes("offline")
    );
  }
  return false;
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

// ---------- Cache de datos (Fase 3B) ----------

/**
 * Guarda un snapshot del dato bajo `key`. Si existe, sobrescribe.
 * No hace nada en SSR.
 */
export async function putCache(key: string, data: unknown): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.cache.put({ key, data, updatedAt: Date.now() });
  notifyChange();
}

/**
 * Lee el snapshot bajo `key`. Devuelve null si no existe.
 */
export async function getCache<T = unknown>(
  key: string,
): Promise<{ data: T; updatedAt: number } | null> {
  const db = getDb();
  if (!db) return null;
  const entry = await db.cache.get(key);
  if (!entry) return null;
  return { data: entry.data as T, updatedAt: entry.updatedAt };
}

/** Elimina un snapshot. */
export async function delCache(key: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.cache.delete(key);
  notifyChange();
}

/** Lista todas las keys cacheadas (útil para debug / purga total). */
export async function listCacheKeys(): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const all = await db.cache.toArray();
  return all.map((e) => e.key);
}

/** Purga todo el cache (invocar en logout). */
export async function purgeAllCache(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.cache.clear();
  notifyChange();
}
