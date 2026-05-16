"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";

const studentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type StudentFormResult = { ok: true; id: string } | { ok: false; error: string };

export async function createStudent(formData: FormData): Promise<StudentFormResult> {
  const { organization, user } = await requireOrganization();
  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const student = await db.student.create({
    data: {
      organizationId: organization.id,
      createdById: user.id,
      name: parsed.data.name.trim(),
      color: parsed.data.color || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { ok: true, id: student.id };
}

export async function updateStudent(id: string, formData: FormData): Promise<StudentFormResult> {
  const { organization } = await requireOrganization();
  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await db.student.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "Estudiante no encontrado" };

  await db.student.update({
    where: { id },
    data: {
      name: parsed.data.name.trim(),
      color: parsed.data.color || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { ok: true, id };
}

export async function deleteStudent(id: string) {
  const { organization } = await requireOrganization();
  const existing = await db.student.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return;

  await db.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}
