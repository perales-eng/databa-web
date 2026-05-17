"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBehaviorMethod } from "@/server/behaviors";

export function DeleteBehaviorMethodButton({
  id,
  studentId,
  behaviorName,
}: {
  id: string;
  studentId: string;
  behaviorName: string;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar el método "${behaviorName}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      await deleteBehaviorMethod(id, studentId);
    } catch {
      toast.error("Error al eliminar el método");
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} className="h-8 w-8 text-muted-foreground hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
