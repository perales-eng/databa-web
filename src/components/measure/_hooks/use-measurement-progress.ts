"use client";

import * as React from "react";
import { saveProgress, loadProgress, clearProgress } from "@/server/progress";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Options<T extends JsonValue> = {
  sessionId: string;
  behaviorMethodId: string;
  state: T;
  isDirty: boolean;
  debounceMs?: number;
  /** Llamado una sola vez con el snapshot persistido (si existe) tras montar. */
  onHydrate?: (snapshot: T, updatedAt: Date | null) => void;
};

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export type UseMeasurementProgressResult = {
  status: Status;
  lastSavedAt: Date | null;
  isHydrating: boolean;
  flush: () => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * Persiste el estado de una medición en `MeasurementProgress` con debounce
 * y `beforeunload`. Hidrata el último snapshot al montar.
 */
export function useMeasurementProgress<T extends JsonValue>({
  sessionId,
  behaviorMethodId,
  state,
  isDirty,
  debounceMs = 5000,
  onHydrate,
}: Options<T>): UseMeasurementProgressResult {
  const [status, setStatus] = React.useState<Status>("loading");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [isHydrating, setIsHydrating] = React.useState(true);

  const stateRef = React.useRef(state);
  const dirtyRef = React.useRef(isDirty);
  const clearedRef = React.useRef(false);
  const inFlightRef = React.useRef<Promise<void> | null>(null);
  const onHydrateRef = React.useRef(onHydrate);

  React.useEffect(() => {
    stateRef.current = state;
    dirtyRef.current = isDirty;
    onHydrateRef.current = onHydrate;
  });

  const persist = React.useCallback(async () => {
    if (clearedRef.current) return;
    if (!dirtyRef.current) return;
    const snapshot = stateRef.current;
    setStatus("saving");
    const p = saveProgress({
      sessionId,
      behaviorMethodId,
      data: snapshot as unknown as Parameters<typeof saveProgress>[0]["data"],
    })
      .then((res) => {
        if (res.ok) {
          setStatus("saved");
          setLastSavedAt(new Date());
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      })
      .finally(() => {
        inFlightRef.current = null;
      });
    inFlightRef.current = p;
    await p;
  }, [sessionId, behaviorMethodId]);

  // Hidratar al montar / cuando cambian las claves.
  React.useEffect(() => {
    let cancelled = false;
    loadProgress({ sessionId, behaviorMethodId }).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data !== null) {
        onHydrateRef.current?.(res.data as T, res.updatedAt);
      }
      setStatus("idle");
      setIsHydrating(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, behaviorMethodId]);

  // Debounce de guardado mientras el estado cambia.
  React.useEffect(() => {
    if (isHydrating) return;
    if (!isDirty) return;
    if (clearedRef.current) return;
    const t = setTimeout(() => {
      void persist();
    }, debounceMs);
    return () => clearTimeout(t);
  }, [state, isDirty, isHydrating, debounceMs, persist]);

  // beforeunload + visibilitychange → intentar flush antes de salir.
  React.useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current || clearedRef.current) return;
      void persist();
      e.preventDefault();
      e.returnValue = "";
    }
    function onVisibility() {
      if (document.visibilityState === "hidden" && dirtyRef.current && !clearedRef.current) {
        void persist();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [persist]);

  const flush = React.useCallback(async () => {
    if (inFlightRef.current) await inFlightRef.current;
    await persist();
  }, [persist]);

  const clear = React.useCallback(async () => {
    clearedRef.current = true;
    await clearProgress({ sessionId, behaviorMethodId });
    // Re-habilitar persistencia: si el consumidor inicia una nueva medición
    // tras guardar, queremos que el próximo cambio vuelva a persistirse.
    clearedRef.current = false;
  }, [sessionId, behaviorMethodId]);

  return { status, lastSavedAt, isHydrating, flush, clear };
}
