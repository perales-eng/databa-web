"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import * as React from "react";
import {
  EditorialButton,
  EditorialError,
  EditorialField,
  editorialInputClass,
} from "@/components/marketing/auth-shell";
import { ArrowRight } from "@/components/marketing/brand";
import { signupAction } from "./actions";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await signupAction(formData);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      setError("Cuenta creada, pero falló el inicio de sesión. Probá iniciar sesión manualmente.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <EditorialField id="name" label="Nombre completo">
        <input id="name" name="name" autoComplete="name" required className={editorialInputClass} placeholder="Lic. Marta Pérez" />
      </EditorialField>
      <EditorialField id="orgName" label="Organización / clínica" hint="Podrás cambiar el nombre más tarde.">
        <input id="orgName" name="orgName" required className={editorialInputClass} placeholder="Centro ABA San Martín" />
      </EditorialField>
      <EditorialField id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="email" required className={editorialInputClass} placeholder="tu@clinica.com" />
      </EditorialField>
      <EditorialField id="password" label="Contraseña" hint="Mínimo 6 caracteres.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={editorialInputClass}
          placeholder="••••••••"
        />
      </EditorialField>
      {error && <EditorialError>{error}</EditorialError>}
      <EditorialButton type="submit" disabled={loading}>
        {loading ? "Creando…" : "Crear cuenta"}
        {!loading && <ArrowRight />}
      </EditorialButton>
    </form>
  );
}
