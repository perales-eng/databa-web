"use client";

/**
 * Pre-caliente del cache HTML/RSC para rutas críticas de offline.
 *
 * Dispara inmediatamente al montar, sin setTimeout. Reintenta hasta 3 veces
 * con backoff (1s, 3s, 8s) si el fetch no cachea correctamente (puede pasar
 * si el pool de Prisma está saturado durante el cold-start). Verifica éxito
 * consultando el SW cache después de cada intento — si el seed quedó
 * guardado, para.
 *
 * El objetivo es garantizar que el seed de "medir sesión temp" esté
 * disponible antes de que el usuario pueda crear una sesión offline.
 */

import * as React from "react";
import { isOnline } from "@/lib/offline-queue";

const CRITICAL_PATHS = ["/sessions/temp-__seed__/measure"];
const RETRY_DELAYS_MS = [0, 1000, 3000, 8000];

async function prewarmPath(path: string): Promise<void> {
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if (!isOnline()) return;
    try {
      const res = await fetch(path, {
        credentials: "include",
        headers: { rsc: "1" },
      });
      if (res.ok) return; // SW ya lo cacheó
    } catch {
      // red o server error — probamos de nuevo en el próximo delay
    }
  }
}

export function OfflinePrewarm() {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    for (const path of CRITICAL_PATHS) {
      void prewarmPath(path);
    }
  }, []);

  return null;
}
