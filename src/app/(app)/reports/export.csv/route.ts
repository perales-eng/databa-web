import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/auth-helpers";
import { loadReportData, type ReportFilters } from "@/server/queries-reports";
import {
  filterMeasurements,
  filterOpportunities,
  filterTemporal,
  dayKey,
} from "@/lib/reports/aggregations";
import { toCSV } from "@/lib/reports/csv";

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseEndDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T23:59:59.999Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const { organization } = await requireOrganization();
  const url = new URL(request.url);
  const sp = url.searchParams;
  const tab = sp.get("tab") || "general";

  const filters: ReportFilters = {
    from: parseDate(sp.get("from")),
    to: parseEndDate(sp.get("to")),
    studentId: sp.get("studentId") || null,
    behaviorMethodId: sp.get("behaviorMethodId") || null,
  };

  const data = await loadReportData(organization.id, filters);
  const measurements = filterMeasurements(data.measurements, filters);
  const opportunities = filterOpportunities(data.opportunities, filters);
  const temporal = filterTemporal(data.temporal, filters);

  let csv: string;
  let name: string;

  if (tab === "student" || tab === "general") {
    // Tabla unificada por registro.
    type Row = {
      type: string;
      date: string;
      student: string;
      behavior: string;
      method: string;
      value: string;
      unit: string;
      durationSec: number | null;
    };
    const rows: Row[] = [
      ...measurements.map<Row>((r) => ({
        type: "measurement",
        date: dayKey(r.measurementDate),
        student: r.studentName,
        behavior: r.behaviorName,
        method: r.methodType,
        value: r.resultValue,
        unit: r.resultUnit ?? "",
        durationSec: r.sessionDurationSec,
      })),
      ...opportunities.map<Row>((r) => ({
        type: "opportunity",
        date: dayKey(r.measurementDate),
        student: r.studentName,
        behavior: "",
        method: "PERCENTAGE_OPPORTUNITY",
        value: r.successPercentage.toFixed(2),
        unit: "%",
        durationSec: null,
      })),
      ...temporal.map<Row>((r) => ({
        type: "temporal",
        date: dayKey(r.measurementDate),
        student: r.studentName,
        behavior: "",
        method: "TEMPORAL_SAMPLING",
        value: r.markedPercentage.toFixed(2),
        unit: "%",
        durationSec: null,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    csv = toCSV(rows, [
      { header: "type", get: (r) => r.type },
      { header: "date", get: (r) => r.date },
      { header: "student", get: (r) => r.student },
      { header: "behavior", get: (r) => r.behavior },
      { header: "method", get: (r) => r.method },
      { header: "value", get: (r) => r.value },
      { header: "unit", get: (r) => r.unit },
      { header: "sessionDurationSec", get: (r) => r.durationSec },
    ]);
    name = `reportes-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    // tab === "method": una fila por (behaviorMethod, día) con promedio.
    type Row = {
      date: string;
      behavior: string;
      method: string;
      records: number;
      averageValue: string;
      unit: string;
    };
    const byKey = new Map<string, { rows: typeof measurements; behaviorName: string; methodType: string; unit: string | null }>();
    for (const r of measurements) {
      const k = `${r.behaviorMethodId}|${dayKey(r.measurementDate)}`;
      const cur = byKey.get(k);
      if (cur) cur.rows.push(r);
      else
        byKey.set(k, {
          rows: [r],
          behaviorName: r.behaviorName,
          methodType: r.methodType,
          unit: r.resultUnit,
        });
    }
    const rows: Row[] = [...byKey.entries()]
      .map(([k, v]) => {
        const [, date] = k.split("|");
        const vals = v.rows
          .map((r) => Number(r.resultValue))
          .filter((n) => Number.isFinite(n));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return {
          date,
          behavior: v.behaviorName,
          method: v.methodType,
          records: v.rows.length,
          averageValue: avg.toFixed(2),
          unit: v.unit ?? "",
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.behavior.localeCompare(b.behavior));

    csv = toCSV(rows, [
      { header: "date", get: (r) => r.date },
      { header: "behavior", get: (r) => r.behavior },
      { header: "method", get: (r) => r.method },
      { header: "records", get: (r) => r.records },
      { header: "averageValue", get: (r) => r.averageValue },
      { header: "unit", get: (r) => r.unit },
    ]);
    name = `reportes-metodo-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
