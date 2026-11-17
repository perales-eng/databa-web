"use client";

/**
 * Página de medir para una sesión creada offline (ID temporal).
 *
 * El server no conoce esta sesión todavía (la creación está encolada). Leemos
 * los datos necesarios desde IndexedDB:
 *  - La sesión temporal (temp:session:{tempId}) para título y studentId
 *  - El estudiante (cache "student:{studentId}") para nombre + behaviorMethods
 *
 * Las mediciones que se registren acá se encolan con sessionId = tempId. Al
 * sincronizar, el handler de la cola resuelve temp→real vía idMap.
 *
 * Nota: el server page renderiza este componente SIN recibir el tempId como
 * prop, para que el HTML sea idéntico para cualquier URL /sessions/temp-*
 * (y así el SW puede alias-earlas a un único response seed cacheado).
 */

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MeasureShell } from "./measure-shell";
import {
  TEMP_SESSION_KEY_PREFIX,
  type TempSessionCache,
} from "@/lib/offline-client";
import { getCache, getRealId } from "@/lib/offline-queue";

type CachedBehaviorMethod = {
  id: string;
  behaviorName: string;
  methodType: string;
  description: string | null;
  config: Record<string, unknown> | null;
};

type CachedStudent = {
  id: string;
  name: string;
  behaviorMethods: CachedBehaviorMethod[];
};

export function TempMeasure() {
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "missing"; reason: string }
    | {
        kind: "ready";
        tempId: string;
        session: TempSessionCache;
        student: CachedStudent;
      }
  >({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const match = window.location.pathname.match(
        /\/sessions\/(temp-[^/]+)\/measure/,
      );
      if (!match) {
        if (!cancelled) setState({ kind: "missing", reason: "URL inválida" });
        return;
      }
      const tempId = match[1];
      // Si este tempId ya sincronizó, redirigir a la URL real.
      const realId = await getRealId(tempId);
      if (realId) {
        window.location.replace(`/sessions/${realId}/measure`);
        return;
      }
      const sessionEntry = await getCache<TempSessionCache>(
        TEMP_SESSION_KEY_PREFIX + tempId,
      );
      if (!sessionEntry) {
        if (!cancelled)
          setState({
            kind: "missing",
            reason: "No encontramos la sesión en caché local",
          });
        return;
      }
      const studentEntry = await getCache<CachedStudent>(
        `student:${sessionEntry.data.studentId}`,
      );
      if (!studentEntry) {
        if (!cancelled)
          setState({
            kind: "missing",
            reason:
              "No encontramos los datos del estudiante en caché local. Visitá su perfil online al menos una vez.",
          });
        return;
      }
      if (cancelled) return;
      setState({
        kind: "ready",
        tempId,
        session: sessionEntry.data,
        student: studentEntry.data,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando sesión pendiente…
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-sm text-muted-foreground">{state.reason}</p>
        <Link
          href="/students"
          className="mt-4 inline-block text-sm text-primary underline"
        >
          Volver a estudiantes
        </Link>
      </div>
    );
  }

  const behaviorMethods = state.student.behaviorMethods.map((bm) => ({
    id: bm.id,
    behaviorName: bm.behaviorName,
    methodType: bm.methodType as Parameters<
      typeof MeasureShell
    >[0]["behaviorMethods"][number]["methodType"],
    description: bm.description,
    config: (bm.config ?? {}) as Record<string, unknown>,
  }));

  return (
    <div>
      <Link
        href={`/students/${state.student.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al estudiante
      </Link>

      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {state.session.title}
          </h1>
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" /> Pendiente de sincronizar
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {state.student.name}
        </p>
      </header>

      <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
        Esta sesión se creó sin conexión. Las mediciones que registres se
        encolan y se subirán al servidor cuando vuelva internet.
      </div>

      <MeasureShell
        sessionId={state.tempId}
        studentId={state.student.id}
        studentName={state.student.name}
        behaviorMethods={behaviorMethods}
      />
    </div>
  );
}
