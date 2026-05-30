"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { completeSession } from "@/server/measurements";

export function FinalizeOverdueButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    try {
      const result = await completeSession(sessionId);
      if (!result.ok) {
        toast.error(result.error ?? "No se pudo finalizar");
        setPending(false);
        return;
      }
      toast.success("Sesión finalizada");
      router.refresh();
    } catch {
      toast.error("No se pudo finalizar la sesión");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-deep/30 bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-deep transition hover:border-amber-deep/60 hover:bg-white disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      {pending ? "..." : "Finalizar"}
    </button>
  );
}
