import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  MeasurementRow,
  OpportunityRow,
  TemporalSamplingRow,
  OrgKpis,
} from "@/lib/reports/aggregations";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { borderBottomWidth: 1, borderColor: "#e5e5e5", paddingBottom: 8, marginBottom: 12 },
  orgName: { fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  subtitle: { fontSize: 10, color: "#666", marginTop: 2 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kpi: {
    width: "31%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 4,
  },
  kpiLabel: { fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  table: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 4, marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e5e5" },
  tableRowLast: { flexDirection: "row" },
  th: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    backgroundColor: "#f5f5f5",
    color: "#444",
  },
  td: { flex: 1, padding: 6, fontSize: 9 },
  notes: {
    marginTop: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
    paddingTop: 6,
  },
  empty: { fontSize: 9, color: "#999", fontStyle: "italic", padding: 6 },
});

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

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es", { year: "numeric", month: "2-digit", day: "2-digit" });
}
function fmtHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type EnrichedMeasurement = MeasurementRow & { studentName?: string };

export type StudentReportProps = {
  organizationName: string;
  studentName: string;
  range: { from: Date | null; to: Date | null };
  kpis: OrgKpis;
  measurements: EnrichedMeasurement[];
  opportunities: OpportunityRow[];
  temporal: TemporalSamplingRow[];
  notes?: string | null;
};

export function StudentReport(props: StudentReportProps) {
  const { organizationName, studentName, range, kpis, measurements, opportunities, temporal, notes } = props;

  const rangeLabel = range.from || range.to
    ? `${range.from ? fmtDate(range.from) : "inicio"} – ${range.to ? fmtDate(range.to) : "hoy"}`
    : "todo el período";

  const generated = new Date().toLocaleString("es");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{organizationName}</Text>
          <Text style={styles.title}>Reporte de mediciones</Text>
          <Text style={styles.subtitle}>{studentName} · {rangeLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Mediciones</Text>
              <Text style={styles.kpiValue}>{kpis.totalMeasurements}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Oportunidades</Text>
              <Text style={styles.kpiValue}>{kpis.totalOpportunities}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Muestreo temporal</Text>
              <Text style={styles.kpiValue}>{kpis.totalTemporal}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Métodos activos</Text>
              <Text style={styles.kpiValue}>{kpis.uniqueMethods}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Días con actividad</Text>
              <Text style={styles.kpiValue}>{kpis.daysWithActivity}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Tiempo total sesión</Text>
              <Text style={styles.kpiValue}>{fmtHours(kpis.totalSessionSeconds)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mediciones</Text>
          {measurements.length === 0 ? (
            <Text style={styles.empty}>Sin registros en el rango.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.th}>Fecha</Text>
                <Text style={styles.th}>Conducta</Text>
                <Text style={styles.th}>Método</Text>
                <Text style={styles.th}>Valor</Text>
                <Text style={styles.th}>Unidad</Text>
              </View>
              {measurements.map((r, i) => (
                <View
                  key={r.id}
                  style={i === measurements.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text style={styles.td}>{fmtDate(r.measurementDate)}</Text>
                  <Text style={styles.td}>{r.behaviorName}</Text>
                  <Text style={styles.td}>{METHOD_LABELS[r.methodType] ?? r.methodType}</Text>
                  <Text style={styles.td}>{r.resultValue}</Text>
                  <Text style={styles.td}>{r.resultUnit ?? "—"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oportunidades</Text>
          {opportunities.length === 0 ? (
            <Text style={styles.empty}>Sin registros de oportunidades.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.th}>Fecha</Text>
                <Text style={styles.th}>Aciertos / Total</Text>
                <Text style={styles.th}>% Éxito</Text>
              </View>
              {opportunities.map((r, i) => (
                <View
                  key={r.id}
                  style={i === opportunities.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text style={styles.td}>{fmtDate(r.measurementDate)}</Text>
                  <Text style={styles.td}>{r.successfulOpportunities}/{r.totalOpportunities}</Text>
                  <Text style={styles.td}>{r.successPercentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muestreo temporal</Text>
          {temporal.length === 0 ? (
            <Text style={styles.empty}>Sin registros de muestreo temporal.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.th}>Fecha</Text>
                <Text style={styles.th}>Marcados / Intervalos</Text>
                <Text style={styles.th}>% Intervalos</Text>
              </View>
              {temporal.map((r, i) => (
                <View
                  key={r.id}
                  style={i === temporal.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text style={styles.td}>{fmtDate(r.measurementDate)}</Text>
                  <Text style={styles.td}>{r.markedIntervals}/{r.totalIntervals}</Text>
                  <Text style={styles.td}>{r.markedPercentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas clínicas</Text>
            <View style={styles.notes}>
              <Text>{notes}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Generado el {generated} · datABA
        </Text>
      </Page>
    </Document>
  );
}
