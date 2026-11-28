"use client";

/**
 * Pre-caliente del cache HTML/RSC para rutas críticas de offline.
 *
 * Dispara inmediatamente al montar, sin setTimeout. Reintenta hasta 4 veces
 * con backoff (0s, 1s, 3s, 8s) si el fetch no cachea correctamente (puede
 * pasar si el pool de Prisma está saturado durante el cold-start).
 *
 * Calentamos DOS variantes del seed:
 *  - RSC (header `rsc: 1`): la usa una soft-navigation (<Link>/router.push).
 *  - HTML-full (header `x-sw-prewarm: 1`): la usa una navegación full-page
 *    (recarga o relanzamiento de la PWA parada en la ruta de medir temp).
 * Sin la variante HTML-full, una navegación full offline cae a offline.html.
 *
 * El objetivo es garantizar que el seed de "medir sesión temp" esté
 * disponible antes de que el usuario pueda crear una sesión offline.
 */

import * as React from "react";
import { isOnline } from "@/lib/offline-queue";

const CRITICAL_PATHS = ["/sessions/temp-__seed__/measure"];
const RETRY_DELAYS_MS = [0, 1000, 3000, 8000];

async function warmVariant(
  path: string,
  headers: Record<string, string>,
): Promise<boolean> {
  const res = await fetch(path, { credentials: "include", headers });
  return res.ok; // el SW cachea en el .then() del fetch cuando res.ok
}

async function prewarmPath(path: string): Promise<void> {
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if (!isOnline()) return;
    try {
      // Ambas variantes deben quedar cacheadas: RSC para soft-nav, HTML-full
      // para navegación full-page offline.
      const [rscOk, htmlOk] = await Promise.all([
        warmVariant(path, { rsc: "1" }),
        warmVariant(path, { "x-sw-prewarm": "1" }),
      ]);
      if (rscOk && htmlOk) return;
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
