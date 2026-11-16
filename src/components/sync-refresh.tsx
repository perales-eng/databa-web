"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { QUEUE_SYNCED_EVENT } from "@/lib/offline-client";

/**
 * Escucha el evento global que emite el worker de la cola offline cuando
 * procesa operaciones exitosamente. Antes de router.refresh():
 *
 *  1. Le pide al SW que limpie el cache HTML (así el fetch RSC que dispara
 *     el refresh no devuelve data stale del cache del SW).
 *  2. Luego dispara router.refresh() para que Next.js vuelva a pedir el RSC
 *     — que ahora sí viene con data fresca del server.
 *
 * Montado en el app layout para cubrir todas las rutas autenticadas.
 */
export function SyncRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    async function onSynced() {
      // 1) Purgar HTML cache del SW
      try {
        if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "purge-html-cache" });
        }
      } catch {
        // si falla, seguimos con el refresh igual
      }
      // 2) Pedir render fresco al server
      router.refresh();
    }
    window.addEventListener(QUEUE_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(QUEUE_SYNCED_EVENT, onSynced);
  }, [router]);

  return null;
}
