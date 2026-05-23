import { db } from "@/lib/db";
import type { MeasurementMethodType } from "@prisma/client";
import type {
  MeasurementRow,
  OpportunityRow,
  TemporalSamplingRow,
} from "@/lib/reports/aggregations";

export type ReportFilters = {
  from?: Date | null;
  to?: Date | null;
  studentId?: string | null;
  behaviorMethodId?: string | null;
  methodType?: MeasurementMethodType | null;
};

function buildWhere(organizationId: string, f: ReportFilters) {
  return {
    organizationId,
    ...(f.studentId
      ? { OR: [{ studentId: f.studentId }, { session: { studentId: f.studentId } }] }
      : {}),
    ...(f.behaviorMethodId ? { behaviorMethodId: f.behaviorMethodId } : {}),
    ...(f.from || f.to
      ? {
          measurementDate: {
            ...(f.from ? { gte: f.from } : {}),
            ...(f.to ? { lte: f.to } : {}),
          },
        }
      : {}),
  };
}

export type ReportData = {
  measurements: (MeasurementRow & { studentName: string; sessionId: string })[];
  opportunities: (OpportunityRow & { studentName: string })[];
  temporal: (TemporalSamplingRow & { studentName: string })[];
  students: { id: string; name: string }[];
  behaviorMethods: { id: string; behaviorName: string; methodType: MeasurementMethodType }[];
};

export async function loadReportData(
  organizationId: string,
  f: ReportFilters,
): Promise<ReportData> {
  // MeasurementResult no tiene studentId propio — viene por session.studentId.
  const measurementWhere = {
    organizationId,
    ...(f.behaviorMethodId ? { behaviorMethodId: f.behaviorMethodId } : {}),
    ...(f.methodType ? { methodType: f.methodType } : {}),
    ...(f.studentId ? { session: { studentId: f.studentId } } : {}),
    ...(f.from || f.to
      ? {
          measurementDate: {
            ...(f.from ? { gte: f.from } : {}),
            ...(f.to ? { lte: f.to } : {}),
          },
        }
      : {}),
  };

  const sharedWhere = buildWhere(organizationId, { ...f, methodType: null });

  const [measurements, opportunities, temporal, students, behaviorMethods] = await Promise.all([
    db.measurementResult.findMany({
      where: measurementWhere,
      orderBy: { measurementDate: "asc" },
      include: { session: { select: { studentId: true, student: { select: { name: true } } } } },
    }),
    db.opportunityResult.findMany({
      where: sharedWhere,
      orderBy: { measurementDate: "asc" },
      include: { session: { select: { student: { select: { name: true } } } } },
    }),
    db.temporalSamplingResult.findMany({
      where: sharedWhere,
      orderBy: { measurementDate: "asc" },
      include: { session: { select: { student: { select: { name: true } } } } },
    }),
    db.student.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.behaviorMethod.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, behaviorName: true, methodType: true },
    }),
  ]);

  return {
    measurements: measurements.map((r) => ({
      id: r.id,
      behaviorMethodId: r.behaviorMethodId,
      studentId: r.session.studentId,
      methodType: r.methodType,
      behaviorName: r.behaviorName,
      resultValue: r.resultValue,
      resultUnit: r.resultUnit,
      measurementDate: r.measurementDate,
      sessionDurationSec: r.sessionDurationSec,
      sessionId: r.sessionId,
      studentName: r.session.student.name,
    })),
    opportunities: opportunities.map((r) => ({
      id: r.id,
      behaviorMethodId: r.behaviorMethodId,
      studentId: r.studentId,
      totalOpportunities: r.totalOpportunities,
      successfulOpportunities: r.successfulOpportunities,
      successPercentage: r.successPercentage,
      measurementDate: r.measurementDate,
      studentName: r.session.student.name,
    })),
    temporal: temporal.map((r) => ({
      id: r.id,
      behaviorMethodId: r.behaviorMethodId,
      studentId: r.studentId,
      totalIntervals: r.totalIntervals,
      markedIntervals: r.markedIntervals,
      markedPercentage: r.markedPercentage,
      measurementDate: r.measurementDate,
      studentName: r.session.student.name,
    })),
    students,
    behaviorMethods,
  };
}
