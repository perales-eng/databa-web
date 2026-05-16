import { requireOrganization } from "@/lib/auth-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const { user, organization, role } = await requireOrganization();
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Tu información personal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {user.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {user.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organización</CardTitle>
            <CardDescription>Tu rol y datos de la organización.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {organization.name}
            </p>
            <p>
              <span className="text-muted-foreground">Rol:</span> {role.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              Invitar miembros disponible en Fase 7.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
