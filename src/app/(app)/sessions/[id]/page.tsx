import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Calendar, Clock, User, Play } from "lucide-react";
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

const METHOD_LABELS: Record<string, string> = {
  FREQUENCY: "Frecuencia",
  DURATION: "Duración",
  LATENCY: "Latencia",
  INTENSITY: "Intensidad",
  PERCENTAGE_OPPORTUNITY: "Oportunidades",
  TEMPORAL_SAMPLING: "Muestreo temporal",
  EVENT_SAMPLING: "Event sampling",
  ANECDOTAL: "Anecdótico",
  ABC: "ABC",
};

function formatResultValue(methodType: string, value: string, unit: string | null, rawData: unknown) {
  const raw = rawData as Record<string, unknown> | null;
  switch (methodType) {
    case "FREQUENCY": {
      const count = Number(value);
      const rate = raw?.rate as number | undefined;
      return `${count} ocurrencias${rate !== undefined ? ` · ${rate.toFixed(2)}/min` : ""}`;
    }
    case "DURATION": {
      const stats = raw?.stats as Record<string, number> | undefined;
      if (stats) return `${stats.count} ep. · prom ${stats.average.toFixed(1)}s · total ${stats.total}s`;
      return `${value}s`;
    }
    case "LATENCY": {
      const stats = raw?.stats as Record<string, number> | undefined;
      if (stats) return `${stats.count} medic. · prom ${stats.average.toFixed(1)}s`;
      return `${value}s`;
    }
    case "INTENSITY": {
      const stats = raw?.stats as Record<string, number> | undefined;
      if (stats) return `${stats.count} registros · prom ${stats.average.toFixed(1)}`;
      return value;
    }
    default:
      return value;
  }
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization } = await requireOrganization();
  const { id } = await params;
  const session = await getSession(organization.id, id);
  if (!session) notFound();

  const totalMeasurements =
    session._count.results +
    session.opportunityResults.length +
    session.temporalSamplingResults.length +
    session.abcRecords.length +
    session.anecdotalRecords.length +
    session.eventSamplings.length;

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
          {session.status !== "COMPLETED" && session.status !== "CANCELLED" ? (
            <Link href={`/sessions/${session.id}/measure`}>
              <Button>
                <Play className="h-4 w-4" /> Iniciar medición
              </Button>
            </Link>
          ) : null}
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
          <CardTitle>
            Mediciones
            {totalMeasurements > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalMeasurements} registros)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalMeasurements === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Sin mediciones registradas todavía.</p>
              {session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
                <Link href={`/sessions/${session.id}/measure`} className="mt-2 text-sm text-primary underline">
                  Iniciar medición
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {session.results.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Resultados generales
                  </h3>
                  <ul className="divide-y">
                    {session.results.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.behaviorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatResultValue(r.methodType, r.resultValue, r.resultUnit, r.rawData)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="secondary">{METHOD_LABELS[r.methodType] ?? r.methodType}</Badge>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(r.measurementDate, "HH:mm")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {session.opportunityResults.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Oportunidades
                  </h3>
                  <ul className="divide-y">
                    {session.opportunityResults.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {r.successfulOpportunities}/{r.totalOpportunities} correctas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.successPercentage.toFixed(0)}% · {r.endCondition}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="secondary">Oportunidades</Badge>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(r.measurementDate, "HH:mm")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {session.temporalSamplingResults.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Muestreo temporal
                  </h3>
                  <ul className="divide-y">
                    {session.temporalSamplingResults.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {r.markedIntervals}/{r.totalIntervals} intervalos marcados
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.markedPercentage.toFixed(0)}% · {r.samplingType} · {r.intervalDurationSec}s/intervalo
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="secondary">Muestreo</Badge>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(r.measurementDate, "HH:mm")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {session.eventSamplings.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Event sampling
                  </h3>
                  <ul className="divide-y">
                    {session.eventSamplings.map((r) => {
                      const events = r.data as { timestamp: number }[];
                      return (
                        <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.behaviorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {events.length} eventos · {r.sessionDurationMin} min
                              {r.dataSaveType ? ` · ${r.dataSaveType}` : ""}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <Badge variant="secondary">Event sampling</Badge>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {format(r.measurementDate, "HH:mm")}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {session.abcRecords.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Registros ABC
                  </h3>
                  <ul className="divide-y">
                    {session.abcRecords.map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {r.behaviorName || r.behaviorDescription}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {r.antecedentType ? `A: ${r.antecedentType}` : ""}
                            {r.consequenceType ? ` · C: ${r.consequenceType}` : ""}
                            {r.functionAnalysis ? ` · ${r.functionAnalysis}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="secondary">ABC</Badge>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {format(r.occurredAt, "HH:mm")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {session.anecdotalRecords.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Registros anecdóticos
                  </h3>
                  <ul className="divide-y">
                    {session.anecdotalRecords.map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="secondary">Anecdótico</Badge>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.recordTime ?? format(r.recordDate, "HH:mm")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
