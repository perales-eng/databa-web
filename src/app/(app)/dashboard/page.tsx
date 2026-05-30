import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BarChart3, Activity, ChevronRight, Plus, AlertCircle } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/install-prompt";

const cards = [
  { href: "/students", title: "Estudiantes", description: "Gestioná los estudiantes de tu organización.", icon: Users },
  { href: "/calendar", title: "Calendario", description: "Revisá tus sesiones programadas.", icon: Calendar },
  { href: "/reports", title: "Reportes", description: "Estadísticas y exportaciones (Fase 5).", icon: BarChart3 },
];

const statusVariant = (s: string) =>
  s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "warning" : s === "CANCELLED" ? "destructive" : "secondary";
const statusLabel = (s: string) =>
  ({ PENDING: "Pendiente", IN_PROGRESS: "En curso", COMPLETED: "Completada", CANCELLED: "Cancelada" })[s] ?? s;

export default async function DashboardPage() {
  const { organization, user } = await requireOrganization();

  const weekFrom = new Date();
  weekFrom.setHours(0, 0, 0, 0);
  const weekTo = new Date(weekFrom);
  weekTo.setDate(weekTo.getDate() + 7);

  const now = new Date();
  // Candidatos a "vencida": status abierto + fecha pasada (mín. 1h atrás para no
  // pisar sesiones recién empezadas). Después filtramos por duración planificada.
  const overdueCutoff = new Date(now.getTime() - 60 * 60 * 1000);

  const [studentCount, weekSessionCount, upcoming, overdueCandidates] = await Promise.all([
    db.student.count({ where: { organizationId: organization.id, deletedAt: null } }),
    db.therapySession.count({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        sessionDate: { gte: weekFrom, lt: weekTo },
      },
    }),
    db.therapySession.findMany({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        sessionDate: { gte: now },
      },
      orderBy: { sessionDate: "asc" },
      take: 5,
      include: { student: { select: { id: true, name: true, color: true } } },
    }),
    db.therapySession.findMany({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        sessionDate: { lt: overdueCutoff },
      },
      orderBy: { sessionDate: "asc" },
      include: { student: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  const overdue = overdueCandidates.filter(
    (s) => s.sessionDate.getTime() + (s.durationMin ?? 60) * 60_000 < now.getTime(),
  );

  return (
    <div>
      <header className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Inicio · {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4.2vw,3.4rem)] font-light leading-[1] tracking-[-0.02em]">
          Hola, <span className="italic text-teal-deep">{user.name?.split(" ")[0] ?? "terapeuta"}.</span>
        </h1>
        <p className="mt-3 text-[15px] text-ink/65">
          Trabajando en{" "}
          <span className="font-medium text-ink">{organization.name}</span>.
        </p>
        <div className="mt-5">
          <InstallPrompt />
        </div>
      </header>

      {overdue.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-deep/25 bg-amber/10">
          <div className="flex items-start gap-3 px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-deep" />
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-deep">
                Sesiones sin cerrar
              </p>
              <p className="mt-1 text-[15px] text-ink">
                Tenés <span className="font-medium">{overdue.length}</span> sesión
                {overdue.length === 1 ? "" : "es"} que pasaron su hora planificada y siguen abierta
                {overdue.length === 1 ? "" : "s"}. Entrá para finalizarla{overdue.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-amber-deep/15 border-t border-amber-deep/15 bg-white/40">
            {overdue.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}`}
                  className="group flex items-center gap-3 px-5 py-3 transition hover:bg-white/70"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.student.color ?? "var(--color-teal-deep)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{s.title}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
                      {s.student.name} · {format(s.sessionDate, "PP p", { locale: es })} · {s.status === "IN_PROGRESS" ? "en curso" : "pendiente"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink/50 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
            {overdue.length > 5 && (
              <li className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
                + {overdue.length - 5} más
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">activos en tu organización</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones esta semana</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekSessionCount}</div>
            <p className="text-xs text-muted-foreground">próximos 7 días</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Próximas sesiones</CardTitle>
              <CardDescription>Las 5 más cercanas</CardDescription>
            </div>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                Calendario <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No tenés sesiones programadas.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {upcoming.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <Link href={`/sessions/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: s.student.color ?? "var(--color-primary)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.student.name} · {format(s.sessionDate, "PPP p", { locale: es })}
                        </p>
                      </div>
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
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/students/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4" /> Nuevo estudiante
              </Button>
            </Link>
            <Link href="/students">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4" /> Ver estudiantes
              </Button>
            </Link>
            <Link href="/calendar">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4" /> Calendario
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 font-display text-[24px] font-light tracking-[-0.015em] text-ink">Secciones</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <c.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
