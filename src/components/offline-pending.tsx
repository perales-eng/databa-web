"use client";

/**
 * UI de ítems creados offline, pendientes de sincronizar.
 *
 * Mientras no haya red, el server no los conoce. Los mostramos como tarjetas
 * extra en las listas (estudiantes, sesiones del estudiante) con un badge
 * "pendiente". Cuando la cola sincroniza (QUEUE_SYNCED_EVENT), su cache
 * temp se borra y `router.refresh` repuebla la lista con el ítem real.
 */

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TEMP_SESSION_KEY_PREFIX,
  TEMP_STUDENT_KEY_PREFIX,
  useTempItems,
  type TempSessionCache,
  type TempStudentCache,
} from "@/lib/offline-client";

export function PendingStudentsList() {
  const items = useTempItems<TempStudentCache>(TEMP_STUDENT_KEY_PREFIX);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((s) => (
        <Card key={s.tempId} className="h-full border-dashed opacity-85">
          <CardContent className="flex items-start gap-4 p-5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: s.color || "hsl(var(--primary))" }}
            >
              {s.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.name}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="warning">Pendiente de sincronizar</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function PendingSessionsList({ studentId }: { studentId: string }) {
  const items = useTempItems<TempSessionCache>(TEMP_SESSION_KEY_PREFIX).filter(
    (s) => s.studentId === studentId,
  );
  if (items.length === 0) return null;
  return (
    <ul className="divide-y">
      {items.map((s) => (
        <li key={s.tempId} className="flex items-center justify-between gap-3 py-3 opacity-80">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatSafeDate(s.sessionDate)}
            </p>
          </div>
          <Badge variant="warning">Pendiente</Badge>
        </li>
      ))}
    </ul>
  );
}

function formatSafeDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return format(d, "PPP p", { locale: es });
  } catch {
    return iso;
  }
}
