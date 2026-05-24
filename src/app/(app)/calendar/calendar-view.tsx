"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type Event = {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  status: string;
};

type Student = { id: string; name: string; color: string | null };

function localDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function CalendarView({ events, students }: { events: Event[]; students: Student[] }) {
  const router = useRouter();
  const [view, setView] = React.useState<View>(Views.MONTH);
  const [pickerDate, setPickerDate] = React.useState<Date | null>(null);

  const parsed = React.useMemo(
    () => events.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    [events],
  );

  function onSelectSlot(slotInfo: { start: Date; end: Date; action?: string }) {
    // Si clickearon en una vista de día/semana, slotInfo.start tiene la hora.
    // Si clickearon en vista de mes, slotInfo.start es el inicio del día — abrimos
    // el picker con hora 09:00 como sugerencia razonable.
    const d = new Date(slotInfo.start);
    const isDayLevel = view === Views.MONTH || (slotInfo.action === "click" && d.getHours() === 0 && d.getMinutes() === 0);
    if (isDayLevel) {
      d.setHours(9, 0, 0, 0);
    }
    setPickerDate(d);
  }

  function chooseStudent(studentId: string) {
    if (!pickerDate) return;
    const dateStr = encodeURIComponent(localDateTime(pickerDate));
    setPickerDate(null);
    router.push(`/students/${studentId}/sessions/new?date=${dateStr}`);
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-4">
        <Calendar
          localizer={localizer}
          events={parsed}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          style={{ height: "calc(100vh - 220px)", minHeight: 500 }}
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          selectable
          onSelectSlot={onSelectSlot}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color,
              borderRadius: 6,
              opacity: event.status === "CANCELLED" ? 0.4 : event.status === "COMPLETED" ? 0.7 : 1,
              color: "white",
              border: "none",
              padding: "2px 6px",
              fontSize: "0.75rem",
            },
          })}
          onSelectEvent={(event) => router.push(`/sessions/${event.id}`)}
          messages={{
            today: "Hoy",
            previous: "Anterior",
            next: "Siguiente",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay sesiones en este rango.",
            showMore: (count: number) => `+ ${count} más`,
          }}
        />
      </div>

      {pickerDate ? (
        <StudentPickerDialog
          date={pickerDate}
          students={students}
          onChoose={chooseStudent}
          onClose={() => setPickerDate(null)}
        />
      ) : null}
    </>
  );
}

function StudentPickerDialog({
  date,
  students,
  onChoose,
  onClose,
}: {
  date: Date;
  students: Student[];
  onChoose: (studentId: string) => void;
  onClose: () => void;
}) {
  const formatted = format(date, "EEEE d 'de' MMMM, HH:mm 'hs'", { locale: es });

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Nueva sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{formatted}</p>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Elegí el estudiante
        </p>

        {students.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No hay estudiantes cargados. Creá uno primero desde Estudiantes.
          </p>
        ) : (
          <ul className="mt-2 max-h-72 divide-y overflow-y-auto rounded-md border">
            {students.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onChoose(s.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: s.color ?? "#0F766E" }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
