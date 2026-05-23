import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrganization } from "@/lib/auth-helpers";
import { loadReportData, type ReportFilters } from "@/server/queries-reports";
import {
  filterMeasurements,
  filterOpportunities,
  filterTemporal,
  groupByStudent,
  groupByMethod,
  orgKpis,
  summarizeMeasurementByMethod,
  trendMeasurement,
  trendOpportunity,
  trendTemporal,
} from "@/lib/reports/aggregations";
import { ReportFilters as Filters } from "./_components/report-filters";
import { ReportTabs, type ReportTab } from "./_components/tabs";
import { TrendChart } from "./_components/trend-chart";

type SearchParams = {
  tab?: string;
  from?: string;
  to?: string;
  studentId?: string;
  behaviorMethodId?: string;
};

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseEndDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s + "T23:59:59.999Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const METHOD_LABELS: Record<string, string> = {
  FREQUENCY: "Frecuencia",
  DURATION: "Duración",
  LATENCY: "Latencia",
  INTENSITY: "Intensidad",
  PERCENTAGE_OPPORTUNITY: "Oportunidades",
  TEMPORAL_SAMPLING: "Muestreo temporal",
  EVENT_SAMPLING: "Event sampling",
  ANECDOTAL: "Anecdótico",
  ABC: "ABC",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { organization } = await requireOrganization();
  const sp = await searchParams;
  const tab = (sp.tab as ReportTab) || "general";

  const filters: ReportFilters = {
    from: parseDate(sp.from),
    to: parseEndDate(sp.to),
    studentId: sp.studentId || null,
    behaviorMethodId: sp.behaviorMethodId || null,
  };

  const data = await loadReportData(organization.id, filters);

  const measurements = filterMeasurements(data.measurements, filters);
  const opportunities = filterOpportunities(data.opportunities, filters);
  const temporal = filterTemporal(data.temporal, filters);

  const baseParams = new URLSearchParams({
    ...(sp.from ? { from: sp.from } : {}),
    ...(sp.to ? { to: sp.to } : {}),
    ...(sp.studentId ? { studentId: sp.studentId } : {}),
    ...(sp.behaviorMethodId ? { behaviorMethodId: sp.behaviorMethodId } : {}),
  });

  const csvParams = new URLSearchParams(baseParams);
  csvParams.set("tab", tab);
  const csvHref = `/reports/export.csv?${csvParams.toString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Vista de la actividad de medición de tu organización.
        </p>
      </div>

      <Filters
        students={data.students.map((s) => ({ id: s.id, label: s.name }))}
        behaviorMethods={data.behaviorMethods.map((b) => ({
          id: b.id,
          label: `${b.behaviorName} · ${METHOD_LABELS[b.methodType] ?? b.methodType}`,
        }))}
        csvHref={csvHref}
      />

      <ReportTabs current={tab} params={baseParams} />

      {tab === "general" ? (
        <GeneralTab
          measurements={measurements}
          opportunities={opportunities}
          temporal={temporal}
        />
      ) : tab === "student" ? (
        <StudentTab
          measurements={measurements}
          opportunities={opportunities}
          temporal={temporal}
          students={data.students}
        />
      ) : (
        <MethodTab
          measurements={measurements}
          opportunities={opportunities}
          temporal={temporal}
          behaviorMethods={data.behaviorMethods}
        />
      )}
    </div>
  );
}

function GeneralTab({
  measurements,
  opportunities,
  temporal,
}: {
  measurements: Parameters<typeof orgKpis>[0];
  opportunities: Parameters<typeof orgKpis>[1];
  temporal: Parameters<typeof orgKpis>[2];
}) {
  const k = orgKpis(measurements, opportunities, temporal);
  const trend = trendMeasurement(measurements);
  const oppTrend = trendOpportunity(opportunities);
  const tempTrend = trendTemporal(temporal);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Mediciones" value={k.totalMeasurements} />
        <Kpi label="Oportunidades" value={k.totalOpportunities} />
        <Kpi label="Muestreo temporal" value={k.totalTemporal} />
        <Kpi label="Estudiantes activos" value={k.uniqueStudents} />
        <Kpi label="Métodos activos" value={k.uniqueMethods} />
        <Kpi label="Días con actividad" value={k.daysWithActivity} />
        <Kpi label="Tiempo total sesión" value={fmtHours(k.totalSessionSeconds)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tendencia · mediciones (promedio diario)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend} variant="line" yLabel="valor" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">% éxito · oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={oppTrend} variant="bar" yLabel="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">% intervalos · muestreo temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={tempTrend} variant="bar" yLabel="%" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentTab({
  measurements,
  opportunities,
  temporal,
  students,
}: {
  measurements: Parameters<typeof orgKpis>[0];
  opportunities: Parameters<typeof orgKpis>[1];
  temporal: Parameters<typeof orgKpis>[2];
  students: { id: string; name: string }[];
}) {
  const byMeasurement = groupByStudent(measurements);
  const byOpp = groupByStudent(opportunities);
  const byTemp = groupByStudent(temporal);

  const activeStudents = students.filter(
    (s) => byMeasurement.has(s.id) || byOpp.has(s.id) || byTemp.has(s.id),
  );

  if (activeStudents.length === 0) {
    return <EmptyState text="No hay datos para los filtros seleccionados." />;
  }

  return (
    <div className="space-y-4">
      {activeStudents.map((s) => {
        const m = byMeasurement.get(s.id) ?? [];
        const o = byOpp.get(s.id) ?? [];
        const t = byTemp.get(s.id) ?? [];
        return (
          <Card key={s.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{s.name}</CardTitle>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">{m.length} mediciones</Badge>
                <Badge variant="outline">{o.length} opp.</Badge>
                <Badge variant="outline">{t.length} muestreo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart data={trendMeasurement(m)} variant="line" height={160} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MethodTab({
  measurements,
  opportunities,
  temporal,
  behaviorMethods,
}: {
  measurements: Parameters<typeof orgKpis>[0];
  opportunities: Parameters<typeof orgKpis>[1];
  temporal: Parameters<typeof orgKpis>[2];
  behaviorMethods: { id: string; behaviorName: string; methodType: string }[];
}) {
  const summary = summarizeMeasurementByMethod(measurements);
  const byMethod = groupByMethod(measurements);
  const byOppMethod = groupByMethod(opportunities);
  const byTempMethod = groupByMethod(temporal);

  if (summary.length === 0 && opportunities.length === 0 && temporal.length === 0) {
    return <EmptyState text="No hay datos para los filtros seleccionados." />;
  }

  const oppMethods = behaviorMethods.filter(
    (bm) => bm.methodType === "PERCENTAGE_OPPORTUNITY" && byOppMethod.has(bm.id),
  );
  const tempMethods = behaviorMethods.filter(
    (bm) => bm.methodType === "TEMPORAL_SAMPLING" && byTempMethod.has(bm.id),
  );

  return (
    <div className="space-y-4">
      {summary.map((s) => (
        <Card key={s.behaviorMethodId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base truncate">{s.behaviorName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {METHOD_LABELS[s.methodType] ?? s.methodType} · {s.totalRecords} registros · {s.sessions} días · promedio{" "}
              {s.average.toFixed(2)}
              {s.unit ? ` ${s.unit}` : ""}
            </p>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendMeasurement(byMethod.get(s.behaviorMethodId) ?? [])}
              variant="line"
              height={180}
            />
          </CardContent>
        </Card>
      ))}

      {oppMethods.map((bm) => (
        <Card key={bm.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{bm.behaviorName}</CardTitle>
            <p className="text-xs text-muted-foreground">Oportunidades · % éxito</p>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendOpportunity(byOppMethod.get(bm.id) ?? [])}
              variant="bar"
              height={180}
              yLabel="%"
            />
          </CardContent>
        </Card>
      ))}

      {tempMethods.map((bm) => (
        <Card key={bm.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{bm.behaviorName}</CardTitle>
            <p className="text-xs text-muted-foreground">Muestreo temporal · % intervalos</p>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendTemporal(byTempMethod.get(bm.id) ?? [])}
              variant="bar"
              height={180}
              yLabel="%"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {text}
    </div>
  );
}
