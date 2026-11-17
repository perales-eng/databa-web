import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { getSession } from "@/server/queries";
import { MeasureShell } from "./measure-shell";
import { TempMeasure } from "./temp-measure";
import { PersistSnapshot } from "@/components/persist-snapshot";
import { OfflineDataBadge } from "@/components/offline-data-badge";

export default async function MeasurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Sesión creada offline (ID temporal): el server no la conoce. Renderizamos
  // un shell client-only idéntico para cualquier tempId, para que el SW
  // pueda alias-earlo a un único response cacheado. El cliente lee los datos
  // reales desde IndexedDB usando el tempId de window.location.
  if (id.startsWith("temp-")) {
    return <TempMeasure />;
  }

  const { organization } = await requireOrganization();
  const session = await getSession(organization.id, id);
  if (!session) notFound();

  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <p className="text-muted-foreground">
          Esta sesión está{" "}
          <span className="font-medium">
            {session.status === "COMPLETED" ? "completada" : "cancelada"}
          </span>{" "}
          y no se pueden registrar más mediciones.
        </p>
        <Link href={`/sessions/${session.id}`} className="mt-4 inline-block text-sm text-primary underline">
          Ver detalle de la sesión
        </Link>
      </div>
    );
  }

  const behaviorMethods = session.student.behaviorMethods.map((bm) => ({
    ...bm,
    config: (bm.config ?? {}) as Record<string, unknown>,
  }));

  const measureSnapshot = {
    sessionId: session.id,
    sessionTitle: session.title,
    studentId: session.studentId,
    studentName: session.student.name,
    behaviorMethods,
  };

  return (
    <div>
      <PersistSnapshot cacheKey={`measure:${session.id}`} data={measureSnapshot} />
      <OfflineDataBadge cacheKey={`measure:${session.id}`} />
      <Link
        href={`/sessions/${session.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a la sesión
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{session.student.name}</p>
      </header>

      <MeasureShell
        sessionId={session.id}
        studentId={session.studentId}
        studentName={session.student.name}
        behaviorMethods={behaviorMethods}
      />
    </div>
  );
}
