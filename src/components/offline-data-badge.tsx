"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { getCache, isOnline } from "@/lib/offline-queue";

/**
 * Pequeño badge que aparece SOLO si estamos offline y detecta que la página
 * actual tiene un snapshot cacheado. Muestra hace cuánto se guardaron los
 * datos para que el usuario entienda que lo que ve puede estar desactualizado.
 */
export function OfflineDataBadge({ cacheKey }: { cacheKey: string }) {
  const online = React.useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => isOnline(),
    () => true,
  );
  const [updatedAt, setUpdatedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const entry = await getCache(cacheKey);
      if (cancelled) return;
      setUpdatedAt(entry?.updatedAt ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  if (online || !updatedAt) return null;

  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-deep/25 bg-amber/10 px-3 py-1.5">
      <WifiOff className="h-3.5 w-3.5 text-amber-deep" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-deep">
        Mostrando datos de {formatRelative(updatedAt)}
      </span>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "hace unos segundos";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} día${diffD === 1 ? "" : "s"}`;
}
