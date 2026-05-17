import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { getSession } from "@/server/queries";
import { MeasureShell } from "./measure-shell";

export default async function MeasurePage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
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

  return (
    <div>
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
        behaviorMethods={session.student.behaviorMethods}
      />
    </div>
  );
}
