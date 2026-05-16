import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Próximamente — Fase 2</CardTitle>
          <CardDescription>
            Vista de calendario con sesiones programadas, reemplaza a <code>CalendarActivity</code>.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
