"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";

export type BehaviorActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const behaviorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

export async function createBehavior(formData: FormData): Promise<BehaviorActionResult> {
  const { organization } = await requireOrganization();
  const parsed = behaviorSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const name = parsed.data.name.trim();

  // Si ya existe (incluso soft-deleted), reactivar.
  const existing = await db.behavior.findUnique({
    where: { organizationId_name: { organizationId: organization.id, name } },
  });
  if (existing) {
    if (existing.deletedAt) {
      const updated = await db.behavior.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          description: parsed.data.description?.trim() || null,
        },
      });
      revalidatePath("/settings/behaviors");
      return { ok: true, id: updated.id };
    }
    return { ok: false, error: "Ya existe una conducta con ese nombre" };
  }

  const created = await db.behavior.create({
    data: {
      organizationId: organization.id,
      name,
      description: parsed.data.description?.trim() || null,
    },
  });
  revalidatePath("/settings/behaviors");
  return { ok: true, id: created.id };
}

export async function updateBehavior(
  id: string,
  formData: FormData,
): Promise<BehaviorActionResult> {
  const { organization } = await requireOrganization();
  const parsed = behaviorSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await db.behavior.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "Conducta no encontrada" };

  const name = parsed.data.name.trim();
  if (name !== existing.name) {
    const collision = await db.behavior.findUnique({
      where: { organizationId_name: { organizationId: organization.id, name } },
    });
    if (collision && collision.id !== id) {
      return { ok: false, error: "Ya existe otra conducta con ese nombre" };
    }
  }

  await db.behavior.update({
    where: { id },
    data: {
      name,
      description: parsed.data.description?.trim() || null,
    },
  });
  revalidatePath("/settings/behaviors");
  return { ok: true, id };
}

export async function deleteBehavior(id: string): Promise<{ ok: boolean; error?: string }> {
  const { organization } = await requireOrganization();
  const existing = await db.behavior.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "Conducta no encontrada" };

  await db.behavior.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/settings/behaviors");
  return { ok: true };
}

/**
 * Crea o reusa una Behavior por nombre dentro de la org. Usado al crear
 * BehaviorMethod para enlazar al catálogo automáticamente.
 */
export async function upsertBehaviorByName(
  organizationId: string,
  rawName: string,
): Promise<{ id: string; name: string }> {
  const name = rawName.trim();
  if (!name) throw new Error("Nombre vacío");

  const existing = await db.behavior.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing) {
    if (existing.deletedAt) {
      const reactivated = await db.behavior.update({
        where: { id: existing.id },
        data: { deletedAt: null },
      });
      return { id: reactivated.id, name: reactivated.name };
    }
    return { id: existing.id, name: existing.name };
  }
  const created = await db.behavior.create({
    data: { organizationId, name },
  });
  return { id: created.id, name: created.name };
}
