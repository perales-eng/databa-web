import { describe, it, expect } from "vitest";
import {
  avg,
  sum,
  frequencyRate,
  averageIRT,
  durationStats,
  latencyStats,
  intensityStats,
  opportunityStats,
  temporalSamplingStats,
  buildIntervals,
} from "@/lib/measurements/calc";

describe("measurement calculations", () => {
  it("avg/sum handle empty arrays", () => {
    expect(avg([])).toBe(0);
    expect(sum([])).toBe(0);
  });

  it("frequencyRate computes per-minute correctly", () => {
    // 12 occurrences in 120s = 6 per min
    expect(frequencyRate(12, 120)).toBe(6);
    expect(frequencyRate(0, 60)).toBe(0);
    expect(frequencyRate(5, 0)).toBe(0); // guard
  });

  it("averageIRT computes inter-response gaps", () => {
    // 0s, 2s, 6s -> gaps 2s, 4s -> avg 3s
    expect(averageIRT([0, 2000, 6000])).toBe(3);
    expect(averageIRT([])).toBe(0);
    expect(averageIRT([1000])).toBe(0);
  });

  it("durationStats produces count/total/avg/max", () => {
    expect(durationStats([5, 10, 15])).toEqual({ count: 3, total: 30, average: 10, max: 15 });
    expect(durationStats([])).toEqual({ count: 0, total: 0, average: 0, max: 0 });
  });

  it("latencyStats / intensityStats compute basic aggregates", () => {
    expect(latencyStats([2, 4])).toEqual({ count: 2, average: 3, max: 4 });
    expect(intensityStats([3, 7, 10])).toEqual({
      count: 3,
      average: (3 + 7 + 10) / 3,
      max: 10,
    });
  });

  it("opportunityStats counts success ratio", () => {
    const r = opportunityStats([
      { success: true },
      { success: false },
      { success: true },
      { success: true },
    ]);
    expect(r.total).toBe(4);
    expect(r.successful).toBe(3);
    expect(r.failed).toBe(1);
    expect(r.percentage).toBe(75);
    expect(opportunityStats([]).percentage).toBe(0);
  });

  it("temporalSamplingStats counts marked intervals", () => {
    const r = temporalSamplingStats([
      { marked: true },
      { marked: false },
      { marked: true },
      { marked: false },
      { marked: true },
    ]);
    expect(r.totalIntervals).toBe(5);
    expect(r.markedIntervals).toBe(3);
    expect(r.percentage).toBe(60);
  });

  it("buildIntervals builds schedule of windows", () => {
    const intervals = buildIntervals(120, 30);
    expect(intervals).toHaveLength(4);
    expect(intervals[0]).toEqual({ index: 0, startSec: 0, endSec: 30 });
    expect(intervals[3]).toEqual({ index: 3, startSec: 90, endSec: 120 });
  });
});
