"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

export function CalendarView({ events }: { events: Event[] }) {
  const router = useRouter();
  const [view, setView] = React.useState<View>(Views.MONTH);

  const parsed = React.useMemo(
    () => events.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    [events],
  );

  return (
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
  );
}
