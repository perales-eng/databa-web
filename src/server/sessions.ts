"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";

const sessionSchema = z.object({
  studentId: z.string().cuid(),
  title: z.string().min(1, "El título es requerido").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  sessionDate: z.string().min(1, "La fecha es requerida"),
  durationMin: z.coerce.number().int().positive().max(600).optional().or(z.literal("").transform(() => undefined)),
  sessionType: z.enum(["SCHEDULED", "IMMEDIATE"]).default("SCHEDULED"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
});

export type SessionFormResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSession(formData: FormData): Promise<SessionFormResult> {
  const { organization, user } = await requireOrganization();
  const parsed = sessionSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    sessionDate: formData.get("sessionDate"),
    durationMin: formData.get("durationMin"),
    sessionType: formData.get("sessionType") ?? "SCHEDULED",
    status: formData.get("status") ?? "PENDING",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // Verify student belongs to org
  const student = await db.student.findFirst({
    where: { id: parsed.data.studentId, organizationId: organization.id, deletedAt: null },
  });
  if (!student) return { ok: false, error: "Estudiante no encontrado" };

  const session = await db.therapySession.create({
    data: {
      organizationId: organization.id,
      studentId: student.id,
      createdById: user.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      sessionDate: new Date(parsed.data.sessionDate),
      durationMin: parsed.data.durationMin ?? null,
      sessionType: parsed.data.sessionType,
      status: parsed.data.status,
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/dashboard");
  return { ok: true, id: session.id };
}

export async function updateSession(id: string, formData: FormData): Promise<SessionFormResult> {
  const { organization } = await requireOrganization();
  const parsed = sessionSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    sessionDate: formData.get("sessionDate"),
    durationMin: formData.get("durationMin"),
    sessionType: formData.get("sessionType") ?? "SCHEDULED",
    status: formData.get("status") ?? "PENDING",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await db.therapySession.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "Sesión no encontrada" };

  await db.therapySession.update({
    where: { id },
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      sessionDate: new Date(parsed.data.sessionDate),
      durationMin: parsed.data.durationMin ?? null,
      sessionType: parsed.data.sessionType,
      status: parsed.data.status,
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/sessions/${id}`);
  revalidatePath(`/students/${existing.studentId}`);
  return { ok: true, id };
}

export async function deleteSession(id: string) {
  const { organization } = await requireOrganization();
  const existing = await db.therapySession.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return;

  await db.therapySession.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/calendar");
  revalidatePath(`/students/${existing.studentId}`);
  revalidatePath("/dashboard");
  redirect(`/students/${existing.studentId}`);
}
