"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ArrowRight } from "@/components/marketing/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const linkBtn =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-cream transition hover:bg-teal-bright hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed w-full";

interface SignupFormProps {
  token: string;
  email: string;
  isDevInvitingOwner: boolean;
  organizationName: string;
}

export function SignupForm({ token, email, isDevInvitingOwner, organizationName }: SignupFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const emailInput = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validar que el email coincida
    if (emailInput.toLowerCase() !== email.toLowerCase()) {
      setError("El email debe coincidir con la invitación");
      setLoading(false);
      return;
    }

    try {
      // 1. Crear cuenta usando el endpoint de signup
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password, name }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.error || "Error al crear cuenta");
        setLoading(false);
        return;
      }

      // 2. Login automático
      const signInResult = await signIn("credentials", {
        email: emailInput,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Cuenta creada pero error al iniciar sesión");
        setLoading(false);
        return;
      }

      // 3. Aceptar invitación (esto creará la org o unirá a la existente)
      const acceptRes = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const acceptData = await acceptRes.json();

      if (!acceptRes.ok) {
        setError(acceptData.error || "Error al aceptar invitación");
        setLoading(false);
        return;
      }

      // 4. Éxito
      if (isDevInvitingOwner) {
        toast.success("¡Cuenta creada! Tu organización está lista.");
      } else {
        toast.success(`¡Bienvenido a ${organizationName}!`);
      }

      // Redirigir al dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Error inesperado. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Juan Pérez"
          required
          disabled={loading}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          disabled={loading}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Debe coincidir con el email de la invitación
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={loading} className={linkBtn}>
        {loading ? "Creando cuenta..." : "Crear cuenta"} <ArrowRight />
      </Button>
    </form>
  );
}
