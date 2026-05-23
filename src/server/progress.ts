"use server";

import type { MeasurementMethodType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";

export type ProgressSaveResult = { ok: true } | { ok: false; error: string };
export type ProgressLoadResult =
  | { ok: true; data: Prisma.JsonValue | null; updatedAt: Date | null }
  | { ok: false; error: string };

async function verifyScope(
  organizationId: string,
  sessionId: string,
  behaviorMethodId: string,
) {
  const [session, bm] = await Promise.all([
    db.therapySession.findFirst({
      where: { id: sessionId, organizationId, deletedAt: null },
      select: { id: true },
    }),
    db.behaviorMethod.findFirst({
      where: { id: behaviorMethodId, organizationId, deletedAt: null },
      select: { id: true, methodType: true },
    }),
  ]);
  if (!session) return { ok: false as const, error: "Sesión no encontrada" };
  if (!bm) return { ok: false as const, error: "Método no encontrado" };
  return { ok: true as const, methodType: bm.methodType };
}

export async function saveProgress(input: {
  sessionId: string;
  behaviorMethodId: string;
  data: Prisma.InputJsonValue;
}): Promise<ProgressSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifyScope(organization.id, input.sessionId, input.behaviorMethodId);
  if (!check.ok) return check;

  await db.measurementProgress.upsert({
    where: {
      behaviorMethodId_sessionId: {
        behaviorMethodId: input.behaviorMethodId,
        sessionId: input.sessionId,
      },
    },
    update: { data: input.data, completedAt: null },
    create: {
      organizationId: organization.id,
      behaviorMethodId: input.behaviorMethodId,
      sessionId: input.sessionId,
      methodType: check.methodType as MeasurementMethodType,
      data: input.data,
    },
  });

  return { ok: true };
}

export async function loadProgress(input: {
  sessionId: string;
  behaviorMethodId: string;
}): Promise<ProgressLoadResult> {
  const { organization } = await requireOrganization();
  const check = await verifyScope(organization.id, input.sessionId, input.behaviorMethodId);
  if (!check.ok) return check;

  const row = await db.measurementProgress.findUnique({
    where: {
      behaviorMethodId_sessionId: {
        behaviorMethodId: input.behaviorMethodId,
        sessionId: input.sessionId,
      },
    },
    select: { data: true, updatedAt: true, completedAt: true },
  });

  if (!row || row.completedAt) {
    return { ok: true, data: null, updatedAt: null };
  }
  return { ok: true, data: row.data, updatedAt: row.updatedAt };
}

export async function clearProgress(input: {
  sessionId: string;
  behaviorMethodId: string;
}): Promise<ProgressSaveResult> {
  const { organization } = await requireOrganization();

  await db.measurementProgress.updateMany({
    where: {
      organizationId: organization.id,
      sessionId: input.sessionId,
      behaviorMethodId: input.behaviorMethodId,
      completedAt: null,
    },
    data: { completedAt: new Date() },
  });

  return { ok: true };
}
