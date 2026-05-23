"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/auth-helpers";
import {
  frequencyRate,
  averageIRT,
  durationStats,
  latencyStats,
  intensityStats,
  opportunityStats,
  temporalSamplingStats,
} from "@/lib/measurements/calc";

export type MeasurementSaveResult = { ok: true } | { ok: false; error: string };

async function verifySessionAndMethod(
  organizationId: string,
  sessionId: string,
  behaviorMethodId: string,
) {
  const [session, bm] = await Promise.all([
    db.therapySession.findFirst({
      where: { id: sessionId, organizationId, deletedAt: null },
    }),
    db.behaviorMethod.findFirst({
      where: { id: behaviorMethodId, organizationId, deletedAt: null },
    }),
  ]);
  if (!session) return { ok: false as const, error: "Sesión no encontrada" };
  if (!bm) return { ok: false as const, error: "Método no encontrado" };
  return { ok: true as const, session, bm };
}

export async function saveFrequencyResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  timestampsMs: number[];
  sessionDurationSec: number;
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const count = data.timestampsMs.length;
  const rate = frequencyRate(count, data.sessionDurationSec);
  const irt = averageIRT(data.timestampsMs);

  await db.measurementResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      methodType: "FREQUENCY",
      behaviorName: check.bm.behaviorName,
      resultValue: String(count),
      resultUnit: "occurrences",
      sessionDurationSec: data.sessionDurationSec,
      rawData: {
        timestamps: data.timestampsMs,
        rate,
        irt,
      },
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function saveDurationResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  durationsSec: number[];
  sessionDurationSec: number;
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const stats = durationStats(data.durationsSec);

  await db.measurementResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      methodType: "DURATION",
      behaviorName: check.bm.behaviorName,
      resultValue: String(stats.average.toFixed(2)),
      resultUnit: "seconds",
      sessionDurationSec: data.sessionDurationSec,
      rawData: { durations: data.durationsSec, stats },
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function saveLatencyResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  timesSec: number[];
  sessionDurationSec: number;
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const stats = latencyStats(data.timesSec);

  await db.measurementResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      methodType: "LATENCY",
      behaviorName: check.bm.behaviorName,
      resultValue: String(stats.average.toFixed(2)),
      resultUnit: "seconds",
      sessionDurationSec: data.sessionDurationSec,
      rawData: { times: data.timesSec, stats },
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function saveIntensityResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  values: number[];
  sessionDurationSec: number;
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const stats = intensityStats(data.values);

  await db.measurementResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      methodType: "INTENSITY",
      behaviorName: check.bm.behaviorName,
      resultValue: String(stats.average.toFixed(2)),
      resultUnit: "scale",
      sessionDurationSec: data.sessionDurationSec,
      rawData: { values: data.values, stats },
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function saveOpportunityResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  studentId: string;
  opportunities: { timestamp: number; success: boolean; note?: string }[];
  endCondition: "MANUAL" | "TIME_LIMIT" | "OPPORTUNITY_LIMIT";
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const stats = opportunityStats(data.opportunities.map((o) => ({ success: o.success })));

  await db.opportunityResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      studentId: data.studentId,
      totalOpportunities: stats.total,
      successfulOpportunities: stats.successful,
      successPercentage: stats.percentage,
      opportunityDetails: data.opportunities,
      endCondition: data.endCondition,
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function saveTemporalSamplingResult(data: {
  sessionId: string;
  behaviorMethodId: string;
  studentId: string;
  samplingType: "PARTIAL" | "WHOLE" | "MOMENTARY";
  intervalDurationSec: number;
  totalDurationSec: number;
  intervals: { index: number; startSec: number; marked: boolean; note?: string }[];
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();
  const check = await verifySessionAndMethod(organization.id, data.sessionId, data.behaviorMethodId);
  if (!check.ok) return check;

  const stats = temporalSamplingStats(data.intervals.map((i) => ({ marked: i.marked })));

  await db.temporalSamplingResult.create({
    data: {
      organizationId: organization.id,
      behaviorMethodId: data.behaviorMethodId,
      sessionId: data.sessionId,
      studentId: data.studentId,
      samplingType: data.samplingType,
      intervalDurationSec: data.intervalDurationSec,
      totalDurationSec: data.totalDurationSec,
      totalIntervals: stats.totalIntervals,
      markedIntervals: stats.markedIntervals,
      markedPercentage: stats.percentage,
      intervalDetails: data.intervals,
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

const abcSchema = z.object({
  occurredAt: z.string().min(1),
  location: z.string().max(200).optional().or(z.literal("")),
  peoplePresent: z.string().max(200).optional().or(z.literal("")),
  antecedentType: z.string().max(100).optional().or(z.literal("")),
  antecedentDescription: z.string().max(1000).optional().or(z.literal("")),
  behaviorDescription: z.string().min(1, "La conducta es requerida").max(1000),
  behaviorDurationSec: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  behaviorIntensity: z.coerce.number().int().min(1).max(10).optional().or(z.literal("").transform(() => undefined)),
  behaviorTopography: z.string().max(200).optional().or(z.literal("")),
  consequenceType: z.string().max(100).optional().or(z.literal("")),
  consequenceDescription: z.string().max(1000).optional().or(z.literal("")),
  whatObtained: z.string().max(500).optional().or(z.literal("")),
  whatAvoided: z.string().max(500).optional().or(z.literal("")),
  functionAnalysis: z.string().max(1000).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export async function saveABCRecord(
  studentId: string,
  sessionId: string,
  behaviorName: string,
  formData: FormData,
): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();

  const parsed = abcSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await db.aBCRecord.create({
    data: {
      organizationId: organization.id,
      studentId,
      sessionId,
      behaviorName,
      occurredAt: new Date(parsed.data.occurredAt),
      location: parsed.data.location || null,
      peoplePresent: parsed.data.peoplePresent || null,
      antecedentType: parsed.data.antecedentType || null,
      antecedentDescription: parsed.data.antecedentDescription || null,
      behaviorDescription: parsed.data.behaviorDescription,
      behaviorDurationSec: parsed.data.behaviorDurationSec ?? null,
      behaviorIntensity: parsed.data.behaviorIntensity ?? null,
      behaviorTopography: parsed.data.behaviorTopography || null,
      consequenceType: parsed.data.consequenceType || null,
      consequenceDescription: parsed.data.consequenceDescription || null,
      whatObtained: parsed.data.whatObtained || null,
      whatAvoided: parsed.data.whatAvoided || null,
      functionAnalysis: parsed.data.functionAnalysis || null,
      notes: parsed.data.notes || null,
    },
  });

  await markSessionInProgress(sessionId);
  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}

const anecdotalSchema = z.object({
  recordDate: z.string().min(1, "La fecha es requerida"),
  recordTime: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().min(1, "La descripción es requerida").max(2000),
  context: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().max(100).optional().or(z.literal("")),
  observations: z.string().max(1000).optional().or(z.literal("")),
});

export async function saveAnecdotalRecord(
  studentId: string,
  sessionId: string,
  behaviorName: string,
  formData: FormData,
): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();

  const parsed = anecdotalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await db.anecdotalRecord.create({
    data: {
      organizationId: organization.id,
      studentId,
      sessionId,
      behaviorName,
      recordDate: new Date(parsed.data.recordDate),
      recordTime: parsed.data.recordTime || null,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      context: parsed.data.context || null,
      category: parsed.data.category || null,
      observations: parsed.data.observations || null,
    },
  });

  await markSessionInProgress(sessionId);
  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}

export async function saveEventSamplingResult(data: {
  sessionId: string;
  studentId: string;
  behaviorName: string;
  sessionDurationMin: number;
  intensityScale: number | null;
  dataSaveType: string;
  events: { timestamp: number; durationSec?: number; intensity?: number; note?: string }[];
}): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();

  const session = await db.therapySession.findFirst({
    where: { id: data.sessionId, organizationId: organization.id, deletedAt: null },
  });
  if (!session) return { ok: false, error: "Sesión no encontrada" };

  await db.eventSampling.create({
    data: {
      organizationId: organization.id,
      studentId: data.studentId,
      sessionId: data.sessionId,
      behaviorName: data.behaviorName,
      sessionDurationMin: data.sessionDurationMin,
      intensityScale: data.intensityScale,
      dataSaveType: data.dataSaveType,
      data: data.events,
    },
  });

  await markSessionInProgress(data.sessionId);
  revalidatePath(`/sessions/${data.sessionId}`);
  return { ok: true };
}

export async function completeSession(sessionId: string): Promise<MeasurementSaveResult> {
  const { organization } = await requireOrganization();

  const session = await db.therapySession.findFirst({
    where: { id: sessionId, organizationId: organization.id, deletedAt: null },
  });
  if (!session) return { ok: false, error: "Sesión no encontrada" };

  await db.therapySession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

async function markSessionInProgress(sessionId: string) {
  await db.therapySession.updateMany({
    where: { id: sessionId, status: "PENDING" },
    data: { status: "IN_PROGRESS" },
  });
}
