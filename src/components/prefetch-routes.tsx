"use client";

import * as React from "react";
import { isOnline } from "@/lib/offline-queue";

/**
 * Pre-descarga rutas en background cuando estamos online. El service worker
 * las intercepta y las cachea, haciéndolas disponibles offline.
 *
 * Fetchea RSC payload (lo que usa el router de Next en soft nav vía Link).
 * El SW solo cachea request con header `rsc` o navigate full — un fetch()
 * plano no es cacheado, así que lo omitimos.
 *
 * IMPORTANTE: trackeamos qué paths ya prefetcheamos en una ref global para
 * no re-disparar el fetch cuando el parent re-renderiza con el mismo set de
 * rutas (new array reference pero mismo contenido). Esto evita cancelar
 * prefetches en vuelo cuando QUEUE_SYNCED_EVENT dispara router.refresh().
 *
 * No renderiza nada.
 */

const fetched = new Set<string>();

export function PrefetchRoutes({ paths }: { paths: string[] }) {
  // Serializamos las paths para deduplicar efectos: un useEffect con un array
  // literal como dep se re-ejecuta en cada render del parent; con un string
  // solo cuando el contenido cambia de verdad.
  const key = paths.join("|");

  React.useEffect(() => {
    if (!isOnline()) return;
    if (!("serviceWorker" in navigator)) return;

    for (const path of paths) {
      if (fetched.has(path)) continue;
      fetched.add(path);
      void fetch(path, {
        credentials: "include",
        headers: { rsc: "1" },
      }).catch(() => {
        // Si falló (p.ej. server timeout transitorio), permitimos reintento
        // la próxima vez que el componente se monte con esa path.
        fetched.delete(path);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
