/**
 * Pure aggregations sobre MeasurementResult / OpportunityResult /
 * TemporalSamplingResult. Sin DB — recibe rows ya cargados.
 */

import type { MeasurementMethodType } from "@prisma/client";
import { avg, sum } from "@/lib/measurements/calc";

// ── Input shapes (subset mínimo de los modelos Prisma) ────────────────────

export type MeasurementRow = {
  id: string;
  behaviorMethodId: string;
  studentId: string;
  methodType: MeasurementMethodType;
  behaviorName: string;
  resultValue: string;
  resultUnit: string | null;
  measurementDate: Date;
  sessionDurationSec: number | null;
};

export type OpportunityRow = {
  id: string;
  behaviorMethodId: string;
  studentId: string;
  totalOpportunities: number;
  successfulOpportunities: number;
  successPercentage: number;
  measurementDate: Date;
};

export type TemporalSamplingRow = {
  id: string;
  behaviorMethodId: string;
  studentId: string;
  totalIntervals: number;
  markedIntervals: number;
  markedPercentage: number;
  measurementDate: Date;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** YYYY-MM-DD en UTC, estable para agrupación y CSV. */
export function dayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseValue(row: MeasurementRow): number {
  const n = Number(row.resultValue);
  return Number.isFinite(n) ? n : 0;
}

function inRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

// ── Filtros ────────────────────────────────────────────────────────────────

export type Filters = {
  from?: Date | null;
  to?: Date | null;
  studentId?: string | null;
  behaviorMethodId?: string | null;
  methodType?: MeasurementMethodType | null;
};

export function filterMeasurements(rows: MeasurementRow[], f: Filters): MeasurementRow[] {
  return rows.filter((r) => {
    if (!inRange(r.measurementDate, f.from ?? null, f.to ?? null)) return false;
    if (f.studentId && r.studentId !== f.studentId) return false;
    if (f.behaviorMethodId && r.behaviorMethodId !== f.behaviorMethodId) return false;
    if (f.methodType && r.methodType !== f.methodType) return false;
    return true;
  });
}

export function filterOpportunities(rows: OpportunityRow[], f: Filters): OpportunityRow[] {
  return rows.filter((r) => {
    if (!inRange(r.measurementDate, f.from ?? null, f.to ?? null)) return false;
    if (f.studentId && r.studentId !== f.studentId) return false;
    if (f.behaviorMethodId && r.behaviorMethodId !== f.behaviorMethodId) return false;
    return true;
  });
}

export function filterTemporal(rows: TemporalSamplingRow[], f: Filters): TemporalSamplingRow[] {
  return rows.filter((r) => {
    if (!inRange(r.measurementDate, f.from ?? null, f.to ?? null)) return false;
    if (f.studentId && r.studentId !== f.studentId) return false;
    if (f.behaviorMethodId && r.behaviorMethodId !== f.behaviorMethodId) return false;
    return true;
  });
}

// ── Agrupaciones ───────────────────────────────────────────────────────────

export function groupByDay<T extends { measurementDate: Date }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = dayKey(r.measurementDate);
    const bucket = map.get(k);
    if (bucket) bucket.push(r);
    else map.set(k, [r]);
  }
  return map;
}

export function groupByMethod<T extends { behaviorMethodId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const bucket = map.get(r.behaviorMethodId);
    if (bucket) bucket.push(r);
    else map.set(r.behaviorMethodId, [r]);
  }
  return map;
}

export function groupByStudent<T extends { studentId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const bucket = map.get(r.studentId);
    if (bucket) bucket.push(r);
    else map.set(r.studentId, [r]);
  }
  return map;
}

// ── Series temporales (input para charts) ──────────────────────────────────

export type TrendPoint = { date: string; value: number; count: number };

/**
 * Serie por día: promedia `resultValue` numérico de las mediciones que caen
 * en ese día para el método dado. Útil para FREQUENCY/DURATION/LATENCY/
 * INTENSITY. Para OPPORTUNITY/TEMPORAL_SAMPLING usar `trendOpportunity` /
 * `trendTemporal`.
 */
export function trendMeasurement(rows: MeasurementRow[]): TrendPoint[] {
  const byDay = groupByDay(rows);
  return [...byDay.entries()]
    .map(([date, bucket]) => ({
      date,
      value: avg(bucket.map(parseValue)),
      count: bucket.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function trendOpportunity(rows: OpportunityRow[]): TrendPoint[] {
  const byDay = groupByDay(rows);
  return [...byDay.entries()]
    .map(([date, bucket]) => ({
      date,
      value: avg(bucket.map((r) => r.successPercentage)),
      count: bucket.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function trendTemporal(rows: TemporalSamplingRow[]): TrendPoint[] {
  const byDay = groupByDay(rows);
  return [...byDay.entries()]
    .map(([date, bucket]) => ({
      date,
      value: avg(bucket.map((r) => r.markedPercentage)),
      count: bucket.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Resúmenes por método (para tab "Por método") ──────────────────────────

export type MethodSummary = {
  behaviorMethodId: string;
  behaviorName: string;
  methodType: MeasurementMethodType;
  sessions: number;
  totalRecords: number;
  average: number;
  unit: string | null;
};

export function summarizeMeasurementByMethod(rows: MeasurementRow[]): MethodSummary[] {
  const grouped = groupByMethod(rows);
  return [...grouped.entries()].map(([behaviorMethodId, bucket]) => {
    const sessions = new Set(bucket.map((r) => r.behaviorMethodId + "·" + dayKey(r.measurementDate))).size;
    const first = bucket[0];
    return {
      behaviorMethodId,
      behaviorName: first.behaviorName,
      methodType: first.methodType,
      sessions,
      totalRecords: bucket.length,
      average: avg(bucket.map(parseValue)),
      unit: first.resultUnit,
    };
  });
}

// ── KPIs globales (tab "General") ──────────────────────────────────────────

export type OrgKpis = {
  totalMeasurements: number;
  totalOpportunities: number;
  totalTemporal: number;
  uniqueStudents: number;
  uniqueMethods: number;
  daysWithActivity: number;
  totalSessionSeconds: number;
};

export function orgKpis(
  measurements: MeasurementRow[],
  opportunities: OpportunityRow[],
  temporal: TemporalSamplingRow[],
): OrgKpis {
  const students = new Set<string>();
  const methods = new Set<string>();
  const days = new Set<string>();

  for (const r of measurements) {
    students.add(r.studentId);
    methods.add(r.behaviorMethodId);
    days.add(dayKey(r.measurementDate));
  }
  for (const r of opportunities) {
    students.add(r.studentId);
    methods.add(r.behaviorMethodId);
    days.add(dayKey(r.measurementDate));
  }
  for (const r of temporal) {
    students.add(r.studentId);
    methods.add(r.behaviorMethodId);
    days.add(dayKey(r.measurementDate));
  }

  return {
    totalMeasurements: measurements.length,
    totalOpportunities: opportunities.length,
    totalTemporal: temporal.length,
    uniqueStudents: students.size,
    uniqueMethods: methods.size,
    daysWithActivity: days.size,
    totalSessionSeconds: sum(
      measurements.map((r) => r.sessionDurationSec ?? 0).filter((n) => n > 0),
    ),
  };
}
