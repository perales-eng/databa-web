import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Próximamente — Fase 5</CardTitle>
          <CardDescription>
            Reportes General, por Estudiante e Individual con exportación CSV y PDF.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
