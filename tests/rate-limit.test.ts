import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit, cleanupExpired } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite hasta max intentos en la ventana", () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("test1:permite", { max: 5, windowSec: 60 });
      expect(r.ok).toBe(true);
    }
  });

  it("rechaza el intento N+1 con retryAfterSec calculado", () => {
    for (let i = 0; i < 3; i++) rateLimit("test1:rechaza", { max: 3, windowSec: 60 });
    const r = rateLimit("test1:rechaza", { max: 3, windowSec: 60 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it("resetea tras la ventana", () => {
    rateLimit("test1:reset", { max: 1, windowSec: 60 });
    expect(rateLimit("test1:reset", { max: 1, windowSec: 60 }).ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rateLimit("test1:reset", { max: 1, windowSec: 60 }).ok).toBe(true);
  });

  it("keys distintas no se interfieren", () => {
    rateLimit("test1:a", { max: 1, windowSec: 60 });
    rateLimit("test1:a", { max: 1, windowSec: 60 });
    const r = rateLimit("test1:b", { max: 1, windowSec: 60 });
    expect(r.ok).toBe(true);
  });

  it("cleanupExpired remueve buckets vencidos", () => {
    rateLimit("test1:cleanup", { max: 1, windowSec: 60 });
    vi.advanceTimersByTime(61_000);
    const removed = cleanupExpired();
    expect(removed).toBeGreaterThan(0);
  });
});
