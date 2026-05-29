"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  EditorialButton,
  EditorialError,
  EditorialField,
  editorialInputClass,
} from "@/components/marketing/auth-shell";
import { ArrowRight } from "@/components/marketing/brand";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") ?? "/dashboard";

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push(from);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <EditorialField id="email" label="Email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={editorialInputClass}
          placeholder="tu@clinica.com"
        />
      </EditorialField>
      <EditorialField id="password" label="Contraseña">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className={editorialInputClass}
          placeholder="••••••••"
        />
      </EditorialField>
      {error && <EditorialError>{error}</EditorialError>}
      <EditorialButton type="submit" disabled={loading}>
        {loading ? "Entrando…" : "Entrar a datABA"}
        {!loading && <ArrowRight />}
      </EditorialButton>
    </form>
  );
}
