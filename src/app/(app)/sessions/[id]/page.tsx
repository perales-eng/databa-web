import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Trash2, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { requireOrganization } from "@/lib/auth-helpers";
import { getSession } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteSessionButton } from "./delete-button";

const statusVariant = (s: string) =>
  s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "warning" : s === "CANCELLED" ? "destructive" : "secondary";
const statusLabel = (s: string) =>
  ({ PENDING: "Pendiente", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" })[s] ?? s;

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
  const session = await getSession(organization.id, id);
  if (!session) notFound();

  return (
    <div>
      <Link
        href={`/students/${session.studentId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a {session.student.name}
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={statusVariant(session.status)}>{statusLabel(session.status)}</Badge>
            <Badge variant="outline">{session.sessionType === "IMMEDIATE" ? "Inmediata" : "Programada"}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(session.sessionDate, "PPP p", { locale: es })}
            </span>
            {session.durationMin ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {session.durationMin} min
              </span>
            ) : null}
            <Link
              href={`/students/${session.studentId}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <User className="h-4 w-4" /> {session.student.name}
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/sessions/${session.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <DeleteSessionButton id={session.id} title={session.title} />
        </div>
      </header>

      {session.description ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{session.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Mediciones</CardTitle>
        </CardHeader>
        <CardContent>
          {session._count.results === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Sin mediciones registradas todavía.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                La ejecución de mediciones se habilita en Fase 3.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {session._count.results} mediciones registradas (la vista detallada llega en Fase 5).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
