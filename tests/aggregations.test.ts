import { describe, it, expect } from "vitest";
import {
  dayKey,
  filterMeasurements,
  filterOpportunities,
  filterTemporal,
  groupByDay,
  groupByMethod,
  groupByStudent,
  trendMeasurement,
  trendOpportunity,
  trendTemporal,
  summarizeMeasurementByMethod,
  orgKpis,
  type MeasurementRow,
  type OpportunityRow,
  type TemporalSamplingRow,
} from "@/lib/reports/aggregations";

function mr(partial: Partial<MeasurementRow>): MeasurementRow {
  return {
    id: "m1",
    behaviorMethodId: "bm1",
    studentId: "s1",
    methodType: "FREQUENCY",
    behaviorName: "Tap",
    resultValue: "10",
    resultUnit: "occurrences",
    measurementDate: new Date("2026-05-01T12:00:00Z"),
    sessionDurationSec: 60,
    ...partial,
  };
}

function or(partial: Partial<OpportunityRow>): OpportunityRow {
  return {
    id: "o1",
    behaviorMethodId: "bm2",
    studentId: "s1",
    totalOpportunities: 10,
    successfulOpportunities: 8,
    successPercentage: 80,
    measurementDate: new Date("2026-05-01T12:00:00Z"),
    ...partial,
  };
}

function tr(partial: Partial<TemporalSamplingRow>): TemporalSamplingRow {
  return {
    id: "t1",
    behaviorMethodId: "bm3",
    studentId: "s1",
    totalIntervals: 10,
    markedIntervals: 6,
    markedPercentage: 60,
    measurementDate: new Date("2026-05-01T12:00:00Z"),
    ...partial,
  };
}

describe("dayKey", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(dayKey(new Date("2026-05-01T23:00:00Z"))).toBe("2026-05-01");
    expect(dayKey(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-31");
  });
});

describe("filters", () => {
  const rows = [
    mr({ id: "a", measurementDate: new Date("2026-05-01T10:00:00Z"), studentId: "s1", behaviorMethodId: "bm1" }),
    mr({ id: "b", measurementDate: new Date("2026-05-15T10:00:00Z"), studentId: "s2", behaviorMethodId: "bm2", methodType: "DURATION" }),
    mr({ id: "c", measurementDate: new Date("2026-06-01T10:00:00Z"), studentId: "s1", behaviorMethodId: "bm1" }),
  ];

  it("filters by date range (inclusive bounds)", () => {
    const out = filterMeasurements(rows, {
      from: new Date("2026-05-10T00:00:00Z"),
      to: new Date("2026-05-31T23:59:59Z"),
    });
    expect(out.map((r) => r.id)).toEqual(["b"]);
  });
  it("filters by studentId", () => {
    expect(filterMeasurements(rows, { studentId: "s2" }).map((r) => r.id)).toEqual(["b"]);
  });
  it("filters by behaviorMethodId", () => {
    expect(filterMeasurements(rows, { behaviorMethodId: "bm1" }).map((r) => r.id)).toEqual(["a", "c"]);
  });
  it("filters by methodType", () => {
    expect(filterMeasurements(rows, { methodType: "DURATION" }).map((r) => r.id)).toEqual(["b"]);
  });
  it("filterOpportunities / filterTemporal honor the same filters", () => {
    const ops = [or({ id: "x", studentId: "s1" }), or({ id: "y", studentId: "s2" })];
    expect(filterOpportunities(ops, { studentId: "s1" }).map((r) => r.id)).toEqual(["x"]);
    const ts = [tr({ id: "p", behaviorMethodId: "bm3" }), tr({ id: "q", behaviorMethodId: "bm9" })];
    expect(filterTemporal(ts, { behaviorMethodId: "bm9" }).map((r) => r.id)).toEqual(["q"]);
  });
});

describe("grouping", () => {
  const rows = [
    mr({ id: "a", measurementDate: new Date("2026-05-01T12:00:00Z"), behaviorMethodId: "bm1", studentId: "s1" }),
    mr({ id: "b", measurementDate: new Date("2026-05-01T18:00:00Z"), behaviorMethodId: "bm2", studentId: "s2" }),
    mr({ id: "c", measurementDate: new Date("2026-05-02T10:00:00Z"), behaviorMethodId: "bm1", studentId: "s1" }),
  ];

  it("groupByDay buckets same-day rows together", () => {
    const m = groupByDay(rows);
    expect(m.get("2026-05-01")?.map((r) => r.id)).toEqual(["a", "b"]);
    expect(m.get("2026-05-02")?.map((r) => r.id)).toEqual(["c"]);
  });
  it("groupByMethod buckets by behaviorMethodId", () => {
    const m = groupByMethod(rows);
    expect(m.get("bm1")?.map((r) => r.id)).toEqual(["a", "c"]);
    expect(m.get("bm2")?.map((r) => r.id)).toEqual(["b"]);
  });
  it("groupByStudent buckets by studentId", () => {
    const m = groupByStudent(rows);
    expect(m.get("s1")?.map((r) => r.id)).toEqual(["a", "c"]);
    expect(m.get("s2")?.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("trend series", () => {
  it("trendMeasurement averages parsed resultValue per day, sorted ascending", () => {
    const rows = [
      mr({ resultValue: "10", measurementDate: new Date("2026-05-02T08:00:00Z") }),
      mr({ resultValue: "4", measurementDate: new Date("2026-05-01T08:00:00Z") }),
      mr({ resultValue: "6", measurementDate: new Date("2026-05-01T20:00:00Z") }),
      mr({ resultValue: "no-num", measurementDate: new Date("2026-05-03T08:00:00Z") }),
    ];
    const series = trendMeasurement(rows);
    expect(series).toEqual([
      { date: "2026-05-01", value: 5, count: 2 },
      { date: "2026-05-02", value: 10, count: 1 },
      { date: "2026-05-03", value: 0, count: 1 },
    ]);
  });
  it("trendOpportunity averages successPercentage per day", () => {
    const rows = [
      or({ successPercentage: 80, measurementDate: new Date("2026-05-01T08:00:00Z") }),
      or({ successPercentage: 60, measurementDate: new Date("2026-05-01T20:00:00Z") }),
    ];
    expect(trendOpportunity(rows)).toEqual([{ date: "2026-05-01", value: 70, count: 2 }]);
  });
  it("trendTemporal averages markedPercentage per day", () => {
    const rows = [tr({ markedPercentage: 50 }), tr({ markedPercentage: 70 })];
    expect(trendTemporal(rows)).toEqual([{ date: "2026-05-01", value: 60, count: 2 }]);
  });
});

describe("summarizeMeasurementByMethod", () => {
  it("aggregates per behaviorMethodId with sessions/totalRecords/average", () => {
    const rows = [
      mr({ behaviorMethodId: "bm1", resultValue: "10", measurementDate: new Date("2026-05-01T08:00:00Z") }),
      mr({ behaviorMethodId: "bm1", resultValue: "20", measurementDate: new Date("2026-05-01T20:00:00Z") }),
      mr({ behaviorMethodId: "bm1", resultValue: "30", measurementDate: new Date("2026-05-02T08:00:00Z") }),
      mr({ behaviorMethodId: "bm2", resultValue: "5", behaviorName: "Otra" }),
    ];
    const summary = summarizeMeasurementByMethod(rows);
    const bm1 = summary.find((s) => s.behaviorMethodId === "bm1")!;
    expect(bm1.totalRecords).toBe(3);
    expect(bm1.average).toBe(20);
    expect(bm1.sessions).toBe(2); // 2 días distintos
    const bm2 = summary.find((s) => s.behaviorMethodId === "bm2")!;
    expect(bm2.behaviorName).toBe("Otra");
    expect(bm2.totalRecords).toBe(1);
  });
});

describe("orgKpis", () => {
  it("counts unique students/methods/days across all three tables", () => {
    const measurements = [
      mr({ studentId: "s1", behaviorMethodId: "bm1", sessionDurationSec: 60 }),
      mr({ studentId: "s2", behaviorMethodId: "bm1", sessionDurationSec: 120 }),
    ];
    const ops = [or({ studentId: "s2", behaviorMethodId: "bm2" })];
    const ts = [
      tr({
        studentId: "s3",
        behaviorMethodId: "bm3",
        measurementDate: new Date("2026-05-02T10:00:00Z"),
      }),
    ];
    const k = orgKpis(measurements, ops, ts);
    expect(k.totalMeasurements).toBe(2);
    expect(k.totalOpportunities).toBe(1);
    expect(k.totalTemporal).toBe(1);
    expect(k.uniqueStudents).toBe(3);
    expect(k.uniqueMethods).toBe(3);
    expect(k.daysWithActivity).toBe(2);
    expect(k.totalSessionSeconds).toBe(180);
  });
});
