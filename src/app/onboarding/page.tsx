import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sin organización</CardTitle>
          <CardDescription>
            Tu cuenta no pertenece a ninguna organización. Esta pantalla se completará en Fase 7
            (invitaciones y creación de orgs adicionales).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
