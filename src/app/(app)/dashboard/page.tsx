import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, Activity } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const cards = [
  {
    href: "/students",
    title: "Estudiantes",
    description: "Gestioná los estudiantes de tu organización.",
    icon: Users,
  },
  {
    href: "/calendar",
    title: "Calendario",
    description: "Revisá tus sesiones programadas.",
    icon: Calendar,
  },
  {
    href: "/reports",
    title: "Reportes",
    description: "Estadísticas y exportaciones de datos.",
    icon: BarChart3,
  },
];

export default async function DashboardPage() {
  const { organization, user } = await requireOrganization();
  const studentCount = await db.student.count({
    where: { organizationId: organization.id, deletedAt: null },
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {user.name?.split(" ")[0] ?? "terapeuta"}.
        </h1>
        <p className="mt-1 text-muted-foreground">
          Organización: <span className="font-medium text-foreground">{organization.name}</span>
        </p>
      </header>

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
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">disponible en Fase 2</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
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
