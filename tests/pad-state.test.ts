import { describe, it, expect } from "vitest";
import {
  frequency,
  duration,
  latency,
  intensity,
  opportunity,
  temporalSampling,
  eventSampling,
  type IntervalState,
} from "@/lib/measurements/pad-state";

describe("frequency pad state", () => {
  it("tap appends timestamp", () => {
    expect(frequency.tap([], 100)).toEqual([100]);
    expect(frequency.tap([100], 200)).toEqual([100, 200]);
  });
  it("undo pops the last timestamp", () => {
    expect(frequency.undo([100, 200, 300])).toEqual([100, 200]);
    expect(frequency.undo([])).toEqual([]);
  });
  it("reset returns empty array", () => {
    expect(frequency.reset()).toEqual([]);
  });
});

describe("duration pad state", () => {
  it("addEpisode rounds and clamps to >= 0", () => {
    expect(duration.addEpisode([], 12.4)).toEqual([12]);
    expect(duration.addEpisode([10], 12.6)).toEqual([10, 13]);
    expect(duration.addEpisode([], -5)).toEqual([0]);
  });
});

describe("latency pad state", () => {
  it("addResponse clamps to >= 0", () => {
    expect(latency.addResponse([], 1.2)).toEqual([1.2]);
    expect(latency.addResponse([1.2], -0.5)).toEqual([1.2, 0]);
  });
});

describe("intensity pad state", () => {
  it("record appends value", () => {
    expect(intensity.record([], 3)).toEqual([3]);
    expect(intensity.record([1, 2], 5)).toEqual([1, 2, 5]);
  });
});

describe("opportunity pad state", () => {
  it("record adds new opportunity", () => {
    const result = opportunity.record([], true, 100, null);
    expect(result).toEqual([{ timestamp: 100, success: true }]);
  });
  it("record blocks once maxOpportunities reached", () => {
    const list = [
      { timestamp: 1, success: true },
      { timestamp: 2, success: false },
    ];
    expect(opportunity.record(list, true, 3, 2)).toEqual(list);
    expect(opportunity.record(list, true, 3, 5)).toHaveLength(3);
  });
  it("isComplete reflects the limit", () => {
    expect(opportunity.isComplete([], null)).toBe(false);
    expect(opportunity.isComplete([{ timestamp: 1, success: true }], 1)).toBe(true);
    expect(opportunity.isComplete([{ timestamp: 1, success: true }], 5)).toBe(false);
  });
});

describe("temporal sampling pad state", () => {
  const base: IntervalState[] = [
    { index: 0, startSec: 0, marked: null },
    { index: 1, startSec: 10, marked: null },
    { index: 2, startSec: 20, marked: null },
  ];

  it("mark toggles only the targeted interval", () => {
    const next = temporalSampling.mark(base, 1, true);
    expect(next[0].marked).toBeNull();
    expect(next[1].marked).toBe(true);
    expect(next[2].marked).toBeNull();
  });
  it("markAll applies to every interval", () => {
    expect(temporalSampling.markAll(base, true).every((iv) => iv.marked === true)).toBe(true);
    expect(temporalSampling.markAll(base, false).every((iv) => iv.marked === false)).toBe(true);
  });
  it("reset clears marks but preserves schedule", () => {
    const marked = temporalSampling.markAll(base, true);
    const cleared = temporalSampling.reset(marked);
    expect(cleared.every((iv) => iv.marked === null)).toBe(true);
    expect(cleared.map((iv) => iv.startSec)).toEqual([0, 10, 20]);
  });
  it("currentIndex clamps to last interval", () => {
    expect(temporalSampling.currentIndex(0, 10, 3)).toBe(0);
    expect(temporalSampling.currentIndex(15, 10, 3)).toBe(1);
    expect(temporalSampling.currentIndex(999, 10, 3)).toBe(2);
  });
  it("isFinished returns true at/after total duration", () => {
    expect(temporalSampling.isFinished(29, 30)).toBe(false);
    expect(temporalSampling.isFinished(30, 30)).toBe(true);
    expect(temporalSampling.isFinished(31, 30)).toBe(true);
  });
});

describe("event sampling pad state", () => {
  it("add creates monotonic ids", () => {
    const a = eventSampling.add([], 0, 1000);
    expect(a.counter).toBe(1);
    expect(a.events).toEqual([{ id: 1, timestamp: 1000 }]);
    const b = eventSampling.add(a.events, a.counter, 2000);
    expect(b.counter).toBe(2);
    expect(b.events[1]).toEqual({ id: 2, timestamp: 2000 });
  });
  it("remove keeps id stability", () => {
    const list = [
      { id: 1, timestamp: 1 },
      { id: 2, timestamp: 2 },
      { id: 3, timestamp: 3 },
    ];
    expect(eventSampling.remove(list, 2)).toEqual([
      { id: 1, timestamp: 1 },
      { id: 3, timestamp: 3 },
    ]);
  });
  it("update merges patch into the targeted event only", () => {
    const list = [
      { id: 1, timestamp: 1 },
      { id: 2, timestamp: 2 },
    ];
    const next = eventSampling.update(list, 2, { durationSec: 5, note: "hola" });
    expect(next[0]).toEqual({ id: 1, timestamp: 1 });
    expect(next[1]).toEqual({ id: 2, timestamp: 2, durationSec: 5, note: "hola" });
  });
  it("reset returns empty state", () => {
    expect(eventSampling.reset()).toEqual({ events: [], counter: 0 });
  });
});
