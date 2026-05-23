import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-helpers";
import { OrganizationForm } from "./organization-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crea tu organización</CardTitle>
          <CardDescription>
            Para empezar a registrar estudiantes y sesiones, dale un nombre a tu organización.
            Quedarás como propietario (OWNER) y podrás invitar al equipo más adelante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
