import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth";

export default async function SuspendedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-light tracking-tight">
            Cuenta Suspendida
          </h1>
        </div>

        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Acceso Temporalmente Deshabilitado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu cuenta ha sido suspendida temporalmente. No podés acceder a la plataforma en este momento.
                <br />
                <br />
                Para más información, contactá al administrador de tu organización.
              </p>
            </div>
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="space-y-3"
        >
          <Button type="submit" variant="outline" className="w-full">
            Cerrar Sesión
          </Button>
        </form>

        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium">Información de tu cuenta:</p>
          <p className="mt-1">Email: {session.user.email}</p>
          <p className="mt-1">Nombre: {session.user.name ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
