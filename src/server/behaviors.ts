"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";
import { methodConfigSchemas, type MethodType } from "@/lib/measurements/schemas";
import { upsertBehaviorByName } from "@/server/behavior-catalog";

const METHOD_TYPES: MethodType[] = [
  "FREQUENCY",
  "DURATION",
  "LATENCY",
  "INTENSITY",
  "PERCENTAGE_OPPORTUNITY",
  "TEMPORAL_SAMPLING",
  "EVENT_SAMPLING",
  "ANECDOTAL",
  "ABC",
];

const baseSchema = z.object({
  behaviorName: z.string().min(1, "El nombre de la conducta es requerido").max(100),
  methodType: z.enum(METHOD_TYPES as [MethodType, ...MethodType[]]),
  description: z.string().max(500).optional().or(z.literal("")),
  functionTypes: z.string().optional().or(z.literal("")),
});

export type BehaviorMethodFormResult = { ok: true; id: string } | { ok: false; error: string };

function parseConfig(methodType: MethodType, raw: unknown) {
  const schema = methodConfigSchemas[methodType];
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false as const, error: result.error.issues[0]?.message ?? "Configuración inválida" };
  }
  return { ok: true as const, data: result.data };
}

function extractConfig(methodType: MethodType, formData: FormData): unknown {
  switch (methodType) {
    case "FREQUENCY":
      return {
        saveFrequency: formData.get("saveFrequency") === "true",
        saveTotalOccurrences: formData.get("saveTotalOccurrences") === "true",
        saveIRT: formData.get("saveIRT") === "true",
      };
    case "DURATION":
      return {
        saveIndividualDurations: formData.get("saveIndividualDurations") === "true",
        saveAverageDuration: formData.get("saveAverageDuration") === "true",
      };
    case "LATENCY":
      return {
        maxTimeSeconds: formData.get("maxTimeSeconds") ? Number(formData.get("maxTimeSeconds")) : null,
        saveIndividualTimes: formData.get("saveIndividualTimes") === "true",
        saveAverageTime: formData.get("saveAverageTime") === "true",
      };
    case "INTENSITY":
      return {
        maxMeasurements: formData.get("maxMeasurements") ? Number(formData.get("maxMeasurements")) : null,
        scaleMin: Number(formData.get("scaleMin") ?? 1),
        scaleMax: Number(formData.get("scaleMax") ?? 10),
        saveIndividualValues: formData.get("saveIndividualValues") === "true",
        saveAverage: formData.get("saveAverage") === "true",
      };
    case "PERCENTAGE_OPPORTUNITY":
      return {
        maxOpportunities: formData.get("maxOpportunities") ? Number(formData.get("maxOpportunities")) : null,
        maxTimeMinutes: formData.get("maxTimeMinutes") ? Number(formData.get("maxTimeMinutes")) : null,
        opportunityDescription: String(formData.get("opportunityDescription") ?? ""),
        correctResponseDescription: String(formData.get("correctResponseDescription") ?? ""),
        saveOpportunityDetails: formData.get("saveOpportunityDetails") === "true",
      };
    case "TEMPORAL_SAMPLING":
      return {
        samplingType: formData.get("samplingType") ?? "PARTIAL",
        intervalDurationSeconds: Number(formData.get("intervalDurationSeconds") ?? 10),
        totalDurationSeconds: Number(formData.get("totalDurationSeconds") ?? 300),
        saveIntervalDetails: formData.get("saveIntervalDetails") === "true",
        saveSummary: formData.get("saveSummary") === "true",
      };
    case "EVENT_SAMPLING":
      return {
        sessionDurationMinutes: Number(formData.get("sessionDurationMinutes") ?? 30),
        intensityScale: formData.get("intensityScale") ? Number(formData.get("intensityScale")) : null,
        dataSaveType: formData.get("dataSaveType") ?? "BOTH",
      };
    case "ANECDOTAL":
      return {};
    case "ABC":
      return {};
  }
}

export async function createBehaviorMethod(
  studentId: string,
  formData: FormData,
): Promise<BehaviorMethodFormResult> {
  const { organization } = await requireOrganization();

  const base = baseSchema.safeParse({
    behaviorName: formData.get("behaviorName"),
    methodType: formData.get("methodType"),
    description: formData.get("description"),
    functionTypes: formData.get("functionTypes"),
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const student = await db.student.findFirst({
    where: { id: studentId, organizationId: organization.id, deletedAt: null },
  });
  if (!student) return { ok: false, error: "Estudiante no encontrado" };

  const rawConfig = extractConfig(base.data.methodType, formData);
  const configResult = parseConfig(base.data.methodType, rawConfig);
  if (!configResult.ok) return { ok: false, error: configResult.error };

  const functionTypes = base.data.functionTypes
    ? base.data.functionTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const behaviorName = base.data.behaviorName.trim();
  const catalogEntry = await upsertBehaviorByName(organization.id, behaviorName);

  const bm = await db.behaviorMethod.create({
    data: {
      organizationId: organization.id,
      studentId: student.id,
      behaviorId: catalogEntry.id,
      behaviorName,
      methodType: base.data.methodType,
      description: base.data.description?.trim() || null,
      functionTypes: functionTypes ?? [],
      config: configResult.data,
    },
  });

  revalidatePath(`/students/${studentId}`);
  return { ok: true, id: bm.id };
}

export async function updateBehaviorMethod(
  id: string,
  studentId: string,
  formData: FormData,
): Promise<BehaviorMethodFormResult> {
  const { organization } = await requireOrganization();

  const base = baseSchema.safeParse({
    behaviorName: formData.get("behaviorName"),
    methodType: formData.get("methodType"),
    description: formData.get("description"),
    functionTypes: formData.get("functionTypes"),
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await db.behaviorMethod.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return { ok: false, error: "Método no encontrado" };

  const rawConfig = extractConfig(base.data.methodType, formData);
  const configResult = parseConfig(base.data.methodType, rawConfig);
  if (!configResult.ok) return { ok: false, error: configResult.error };

  const functionTypes = base.data.functionTypes
    ? base.data.functionTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const behaviorName = base.data.behaviorName.trim();
  const catalogEntry = await upsertBehaviorByName(organization.id, behaviorName);

  await db.behaviorMethod.update({
    where: { id },
    data: {
      behaviorId: catalogEntry.id,
      behaviorName,
      methodType: base.data.methodType,
      description: base.data.description?.trim() || null,
      functionTypes: functionTypes ?? [],
      config: configResult.data,
    },
  });

  revalidatePath(`/students/${studentId}`);
  return { ok: true, id };
}

export async function deleteBehaviorMethod(id: string, studentId: string) {
  const { organization } = await requireOrganization();

  const existing = await db.behaviorMethod.findFirst({
    where: { id, organizationId: organization.id, deletedAt: null },
  });
  if (!existing) return;

  await db.behaviorMethod.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}
