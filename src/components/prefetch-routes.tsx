"use client";

import * as React from "react";
import { isOnline } from "@/lib/offline-queue";

/**
 * Pre-descarga rutas en background cuando estamos online. El service worker
 * las intercepta y las cachea, haciéndolas disponibles offline.
 *
 * Fetchea tanto el HTML full (navigation) como el RSC payload (Link soft nav),
 * así cualquier forma de llegar a la ruta tiene cache.
 *
 * No renderiza nada.
 */
export function PrefetchRoutes({ paths }: { paths: string[] }) {
  React.useEffect(() => {
    if (!isOnline()) return;
    if (!("serviceWorker" in navigator)) return;

    // Dejar que el render inicial termine antes de meter más fetches.
    const timer = window.setTimeout(() => {
      for (const path of paths) {
        // 1) HTML completo — se guarda bajo cacheKey(path, isRsc=false)
        void fetch(path, { credentials: "include" }).catch(() => {});
        // 2) RSC payload — se guarda bajo cacheKey(path, isRsc=true)
        void fetch(path, {
          credentials: "include",
          headers: { rsc: "1" },
        }).catch(() => {});
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [paths]);

  return null;
}
