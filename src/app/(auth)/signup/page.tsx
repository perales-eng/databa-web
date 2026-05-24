import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signupsEnabled } from "@/lib/feature-flags";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  const open = signupsEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{open ? "Crear cuenta" : "Registro cerrado"}</CardTitle>
          <CardDescription>
            {open
              ? "Empezá a registrar datos en minutos."
              : "El registro público está deshabilitado por ahora. Si necesitás acceso, pedile una invitación al administrador."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {open ? <SignupForm /> : null}
          <p className={`text-center text-sm text-muted-foreground ${open ? "mt-6" : ""}`}>
            {open ? "¿Ya tenés cuenta? " : "¿Ya tenés cuenta? "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
