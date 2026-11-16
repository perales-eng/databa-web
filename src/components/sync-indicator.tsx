"use client";

import * as React from "react";
import { WifiOff, CloudUpload, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { processQueue, retryFailed } from "@/lib/offline-queue";
import { handlers } from "@/lib/offline-handlers";
import { useQueueStatus, QUEUE_SYNCED_EVENT } from "@/lib/offline-client";
import { toast } from "sonner";

export function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const { pending, failed, online } = useQueueStatus();
  const [syncing, setSyncing] = React.useState(false);

  async function syncNow() {
    setSyncing(true);
    try {
      if (failed > 0) await retryFailed();
      const r = await processQueue(handlers);
      if (r.ok > 0) {
        toast.success(`${r.ok} operación${r.ok === 1 ? "" : "es"} sincronizada${r.ok === 1 ? "" : "s"}`);
        window.dispatchEvent(new CustomEvent(QUEUE_SYNCED_EVENT, { detail: { ok: r.ok } }));
      }
      if (r.failed > 0) toast.error(`${r.failed} fallaron después de reintentos`);
      if (r.ok === 0 && r.failed === 0 && r.retried === 0) toast("Nada que sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  // Caso 1: online y todo sincronizado → nada que mostrar (o verde compacto).
  if (online && pending === 0 && failed === 0) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-teal-deep">
          <Check className="h-3 w-3" /> Sincronizado
        </span>
      );
    }
    return null;
  }

  // Caso 2: offline sin pendientes.
  if (!online && pending === 0 && failed === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
        <WifiOff className="h-3 w-3" /> Sin conexión
      </span>
    );
  }

  // Caso 3: hay fallos (requieren atención).
  if (failed > 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive">
          {failed} sin enviar
        </span>
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive underline decoration-destructive/40 decoration-2 underline-offset-[4px] hover:decoration-destructive disabled:opacity-50"
        >
          {syncing ? "..." : "Reintentar"}
        </button>
      </div>
    );
  }

  // Caso 4: hay pendientes (normal — se van cuando vuelve conexión).
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-deep/25 bg-amber/10 px-3 py-1.5">
      {online ? (
        <CloudUpload className="h-3.5 w-3.5 text-amber-deep" />
      ) : (
        <WifiOff className="h-3.5 w-3.5 text-amber-deep" />
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-deep">
        {pending} pendiente{pending === 1 ? "" : "s"} · {online ? "subiendo" : "offline"}
      </span>
      {online && (
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          aria-label="Sincronizar ahora"
          className="text-amber-deep transition hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}
