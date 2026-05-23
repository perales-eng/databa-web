import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireOrganization } from "@/lib/auth-helpers";
import { loadReportData, type ReportFilters } from "@/server/queries-reports";
import {
  filterMeasurements,
  filterOpportunities,
  filterTemporal,
  orgKpis,
} from "@/lib/reports/aggregations";
import { StudentReport } from "@/lib/reports/pdf-template";

export const runtime = "nodejs";

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
  const studentId = sp.get("studentId");

  if (!studentId) {
    return NextResponse.json(
      { error: "Se requiere studentId para generar el PDF" },
      { status: 400 },
    );
  }

  const filters: ReportFilters = {
    from: parseDate(sp.get("from")),
    to: parseEndDate(sp.get("to")),
    studentId,
    behaviorMethodId: sp.get("behaviorMethodId") || null,
  };

  const data = await loadReportData(organization.id, filters);
  const measurements = filterMeasurements(data.measurements, filters);
  const opportunities = filterOpportunities(data.opportunities, filters);
  const temporal = filterTemporal(data.temporal, filters);
  const kpis = orgKpis(measurements, opportunities, temporal);

  const student = data.students.find((s) => s.id === studentId);
  if (!student) {
    return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
  }

  const notes = sp.get("notes")?.trim() || null;

  const buffer = await renderToBuffer(
    <StudentReport
      organizationName={organization.name}
      studentName={student.name}
      range={{ from: filters.from ?? null, to: filters.to ?? null }}
      kpis={kpis}
      measurements={measurements}
      opportunities={opportunities}
      temporal={temporal}
      notes={notes}
    />,
  );

  const filename = `reporte-${student.name.replace(/[^a-zA-Z0-9-_]/g, "_")}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
