/**
 * Pure calculation utilities for each measurement method.
 *
 * These functions MUST be pure (no DB, no side effects) to be unit-testable
 * and reusable on client (live displays) + server (persisted aggregations).
 */

/** Average of an array of numbers, returns 0 for empty arrays. */
export const avg = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

// --------- Frequency ---------

/** Occurrences per minute. sessionDurationSec must be > 0. */
export function frequencyRate(occurrences: number, sessionDurationSec: number): number {
  if (sessionDurationSec <= 0) return 0;
  return occurrences / (sessionDurationSec / 60);
}

/** Average inter-response time in seconds (interval between consecutive timestamps). */
export function averageIRT(timestampsMs: number[]): number {
  if (timestampsMs.length < 2) return 0;
  const sorted = [...timestampsMs].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 1000);
  return avg(gaps);
}

// --------- Duration ---------

export function durationStats(durationsSec: number[]) {
  return {
    count: durationsSec.length,
    total: sum(durationsSec),
    average: avg(durationsSec),
    max: durationsSec.length === 0 ? 0 : Math.max(...durationsSec),
  };
}

// --------- Latency ---------

export function latencyStats(timesSec: number[]) {
  return {
    count: timesSec.length,
    average: avg(timesSec),
    max: timesSec.length === 0 ? 0 : Math.max(...timesSec),
  };
}

// --------- Intensity ---------

export function intensityStats(values: number[]) {
  return {
    count: values.length,
    average: avg(values),
    max: values.length === 0 ? 0 : Math.max(...values),
  };
}

// --------- Opportunity ---------

export function opportunityStats(opportunities: { success: boolean }[]) {
  const total = opportunities.length;
  const successful = opportunities.filter((o) => o.success).length;
  return {
    total,
    successful,
    failed: total - successful,
    percentage: total === 0 ? 0 : (successful / total) * 100,
  };
}

// --------- Temporal Sampling ---------

export function temporalSamplingStats(intervals: { marked: boolean }[]) {
  const total = intervals.length;
  const marked = intervals.filter((i) => i.marked).length;
  return {
    totalIntervals: total,
    markedIntervals: marked,
    unmarkedIntervals: total - marked,
    percentage: total === 0 ? 0 : (marked / total) * 100,
  };
}

/** Build the schedule of intervals for a temporal-sampling session, in seconds. */
export function buildIntervals(totalDurationSec: number, intervalDurationSec: number) {
  const count = Math.floor(totalDurationSec / intervalDurationSec);
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    startSec: i * intervalDurationSec,
    endSec: (i + 1) * intervalDurationSec,
  }));
}
