import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Plus, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { requireOrganization } from "@/lib/auth-helpers";
import { getStudent } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteStudentButton } from "./delete-button";

const statusVariant = (s: string) =>
  s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "warning" : s === "CANCELLED" ? "destructive" : "secondary";

const statusLabel = (s: string) =>
  ({ PENDING: "Pendiente", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" })[s] ?? s;

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
  const student = await getStudent(organization.id, id);
  if (!student) notFound();

  return (
    <div>
      <Link
        href="/students"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a estudiantes
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold text-white"
            style={{ background: student.color || "hsl(var(--primary))" }}
          >
            {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
            {student.birthDate ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Nacimiento: {format(student.birthDate, "PPP", { locale: es })}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/students/${student.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <DeleteStudentButton id={student.id} name={student.name} />
        </div>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Sesiones" value={student._count.therapySessions} />
        <StatCard label="Métodos" value={student._count.behaviorMethods} />
        <StatCard label="ABC" value={student._count.abcRecords} />
        <StatCard label="Anecdóticos" value={student._count.anecdotalRecords} />
      </div>

      {student.notes ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{student.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sesiones</CardTitle>
              <CardDescription>Últimas 10</CardDescription>
            </div>
            <Link href={`/students/${student.id}/sessions/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nueva
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {student.therapySessions.length === 0 ? (
              <EmptyState icon={Calendar} text="Sin sesiones todavía" />
            ) : (
              <ul className="divide-y">
                {student.therapySessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <Link href={`/sessions/${s.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium hover:underline">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(s.sessionDate, "PPP p", { locale: es })}
                      </p>
                    </Link>
                    <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de medición</CardTitle>
            <CardDescription>Configuración de conductas a medir (Fase 3)</CardDescription>
          </CardHeader>
          <CardContent>
            {student.behaviorMethods.length === 0 ? (
              <EmptyState icon={Activity} text="Sin métodos configurados" />
            ) : (
              <ul className="divide-y">
                {student.behaviorMethods.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.behaviorName}</p>
                      <p className="text-xs text-muted-foreground">{methodLabel(m.methodType)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Icon className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function methodLabel(t: string) {
  return (
    {
      FREQUENCY: "Frecuencia",
      DURATION: "Duración",
      LATENCY: "Latencia",
      INTENSITY: "Intensidad",
      TEMPORAL_SAMPLING: "Muestreo temporal",
      PERCENTAGE_OPPORTUNITY: "Oportunidades",
      EVENT_SAMPLING: "Event sampling",
      ANECDOTAL: "Anecdótico",
      ABC: "ABC",
    }[t] ?? t
  );
}
