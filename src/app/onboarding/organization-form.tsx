"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  EditorialButton,
  EditorialError,
  EditorialField,
  editorialInputClass,
} from "@/components/marketing/auth-shell";
import { ArrowRight } from "@/components/marketing/brand";
import { createOrganization } from "@/server/onboarding";

export function OrganizationForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await createOrganization(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Organización creada");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <EditorialField
        id="name"
        label="Nombre de la organización"
        hint="Podrás editarlo más tarde desde Configuración."
      >
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          autoFocus
          className={editorialInputClass}
          placeholder="Ej: Centro ABA San Martín"
        />
      </EditorialField>
      {error && <EditorialError>{error}</EditorialError>}
      <EditorialButton type="submit" disabled={loading}>
        {loading ? "Creando…" : "Crear organización"}
        {!loading && <ArrowRight />}
      </EditorialButton>
    </form>
  );
}
