/**
 * Pure state transitions for measurement pads. Sin React, sin DOM —
 * testable en isolation.
 */

// FREQUENCY ─────────────────────────────────────────────────────────────
export const frequency = {
  tap: (timestamps: number[], at: number): number[] => [...timestamps, at],
  undo: (timestamps: number[]): number[] => timestamps.slice(0, -1),
  reset: (): number[] => [],
};

// DURATION ──────────────────────────────────────────────────────────────
export const duration = {
  addEpisode: (durations: number[], seconds: number): number[] => [
    ...durations,
    Math.max(0, Math.round(seconds)),
  ],
  reset: (): number[] => [],
};

// LATENCY ───────────────────────────────────────────────────────────────
export const latency = {
  addResponse: (timesSec: number[], latencySec: number): number[] => [
    ...timesSec,
    Math.max(0, latencySec),
  ],
  reset: (): number[] => [],
};

// INTENSITY ─────────────────────────────────────────────────────────────
export const intensity = {
  record: (values: number[], value: number): number[] => [...values, value],
  reset: (): number[] => [],
};

// OPPORTUNITY ───────────────────────────────────────────────────────────
export type Opportunity = { timestamp: number; success: boolean };
export const opportunity = {
  record: (
    list: Opportunity[],
    success: boolean,
    at: number,
    maxOpportunities: number | null,
  ): Opportunity[] => {
    if (maxOpportunities !== null && list.length >= maxOpportunities) return list;
    return [...list, { timestamp: at, success }];
  },
  isComplete: (list: Opportunity[], maxOpportunities: number | null): boolean =>
    maxOpportunities !== null && list.length >= maxOpportunities,
  reset: (): Opportunity[] => [],
};

// TEMPORAL SAMPLING ─────────────────────────────────────────────────────
export type IntervalState = { index: number; startSec: number; marked: boolean | null };
export const temporalSampling = {
  mark: (intervals: IntervalState[], index: number, value: boolean): IntervalState[] =>
    intervals.map((iv) => (iv.index === index ? { ...iv, marked: value } : iv)),
  markAll: (intervals: IntervalState[], value: boolean): IntervalState[] =>
    intervals.map((iv) => ({ ...iv, marked: value })),
  currentIndex: (elapsedSec: number, intervalSec: number, total: number): number =>
    Math.min(Math.floor(elapsedSec / intervalSec), total - 1),
  isFinished: (elapsedSec: number, totalSec: number): boolean => elapsedSec >= totalSec,
  reset: (intervals: IntervalState[]): IntervalState[] =>
    intervals.map((iv) => ({ ...iv, marked: null })),
};

// EVENT SAMPLING ────────────────────────────────────────────────────────
export type EventEntry = {
  id: number;
  timestamp: number;
  durationSec?: number;
  intensity?: number;
  note?: string;
};
export const eventSampling = {
  add: (events: EventEntry[], counter: number, at: number) => {
    const next = counter + 1;
    return {
      events: [...events, { id: next, timestamp: at }],
      counter: next,
    };
  },
  remove: (events: EventEntry[], id: number): EventEntry[] =>
    events.filter((e) => e.id !== id),
  update: (events: EventEntry[], id: number, patch: Partial<Omit<EventEntry, "id">>): EventEntry[] =>
    events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  reset: (): { events: EventEntry[]; counter: number } => ({ events: [], counter: 0 }),
};
