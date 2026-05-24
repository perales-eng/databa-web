import { requireOrganization } from "@/lib/auth-helpers";
import { listSessionsInRange } from "@/server/queries";
import { db } from "@/lib/db";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const { organization } = await requireOrganization();

  // Show a 90-day window: 30 days back, 60 days forward.
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const to = new Date(now);
  to.setDate(to.getDate() + 60);

  const [sessions, students] = await Promise.all([
    listSessionsInRange(organization.id, from, to),
    db.student.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const events = sessions.map((s) => {
    const start = s.sessionDate;
    const end = new Date(start.getTime() + (s.durationMin ?? 60) * 60 * 1000);
    return {
      id: s.id,
      title: `${s.student.name} — ${s.title}`,
      start: start.toISOString(),
      end: end.toISOString(),
      color: s.student.color ?? "#0F766E",
      status: s.status,
    };
  });

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clic en un evento para abrir su detalle, o clic en un día/franja vacía para crear una sesión nueva.
        </p>
      </header>
      <CalendarView events={events} students={students} />
    </div>
  );
}
