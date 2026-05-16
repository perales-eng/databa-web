"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/server/students";

export function DeleteStudentButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar al estudiante "${name}"? Esta acción puede deshacerse desde la base de datos.`)) {
      return;
    }
    startTransition(async () => {
      await deleteStudent(id);
    });
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending}>
      <Trash2 className="h-4 w-4" /> {pending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}
