import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Estudiantes</h1>
      <p className="mt-1 text-muted-foreground">Implementación completa en Fase 2.</p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Lista con búsqueda, perfiles, alta y edición — Fase 2 del plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta pantalla reemplazará a <code className="rounded bg-muted px-1.5 py-0.5">StudentListActivity</code> y{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">StudentProfileActivity</code> del proyecto Android.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
