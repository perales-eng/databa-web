import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBehaviorForm, BehaviorRow } from "./_components/behavior-form";

export default async function BehaviorCatalogPage() {
  const { organization } = await requireOrganization();

  const behaviors = await db.behavior.findMany({
    where: { organizationId: organization.id, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { behaviorMethods: { where: { deletedAt: null } } } },
    },
  });

  const enriched = behaviors.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    usageCount: b._count.behaviorMethods,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/settings" className="flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Configuración
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de conductas</h1>
        <p className="text-sm text-muted-foreground">
          Las conductas que vayas registrando acá quedan disponibles como sugerencia al configurar métodos de medición.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar conducta</CardTitle>
          <CardDescription>Reusable por todos los estudiantes de la organización.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBehaviorForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conductas registradas</CardTitle>
          <CardDescription>
            {enriched.length} {enriched.length === 1 ? "conducta" : "conductas"} en el catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enriched.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              Todavía no hay conductas. Agregá la primera arriba, o se crearán automáticamente al configurar métodos.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {enriched.map((b) => (
                <li key={b.id}>
                  <BehaviorRow behavior={b} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
