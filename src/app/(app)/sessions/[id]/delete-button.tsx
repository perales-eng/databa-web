"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/server/sessions";

export function DeleteSessionButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar la sesión "${title}"?`)) return;
    startTransition(async () => {
      await deleteSession(id);
    });
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending}>
      <Trash2 className="h-4 w-4" /> {pending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}
