"use client";

/**
 * Pre-caliente del cache HTML/RSC para rutas críticas de offline.
 *
 * A diferencia de PrefetchRoutes, esto corre INMEDIATAMENTE al montar (sin
 * setTimeout) y no se re-ejecuta en cada render (usa un ref boolean para
 * garantizar un solo intento por load de la app). El objetivo: garantizar
 * que el seed de "medir sesión temp" siempre esté en el SW cache antes de
 * que el usuario pueda crear una sesión offline.
 *
 * Si el fetch falla (no hay red, server timeout), se ignora silenciosamente
 * — reintentará el próximo mount (próximo navegación a la app).
 */

import * as React from "react";
import { isOnline } from "@/lib/offline-queue";

const CRITICAL_PATHS = ["/sessions/temp-__seed__/measure"];

export function OfflinePrewarm() {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!isOnline()) return;
    if (!("serviceWorker" in navigator)) return;

    for (const path of CRITICAL_PATHS) {
      // Solo RSC payload: es lo que usa Next.js router en navegación soft
      // (router.push, Link). El SW solo cachea requests con header rsc o
      // navigate full; una fetch() plana no es cacheada.
      void fetch(path, {
        credentials: "include",
        headers: { rsc: "1" },
      }).catch(() => {});
    }
  }, []);

  return null;
}
