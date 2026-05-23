// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/server/measurements", () => ({
  saveFrequencyResult: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/server/progress", () => ({
  saveProgress: vi.fn(async () => ({ ok: true })),
  loadProgress: vi.fn(async () => ({ ok: true, data: null, updatedAt: null })),
  clearProgress: vi.fn(async () => ({ ok: true })),
}));

import { FrequencyPad } from "@/components/measure/frequency-pad";

const defaultProps = {
  sessionId: "session-1",
  behaviorMethodId: "bm-1",
  behaviorName: "Tap test",
  sessionStartMs: Date.now(),
  onSaved: vi.fn(),
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FrequencyPad", () => {
  it("renderiza con contador en 0 inicialmente", () => {
    render(<FrequencyPad {...defaultProps} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("ocurrencias")).toBeInTheDocument();
  });

  it("incrementa el contador al hacer tap", () => {
    render(<FrequencyPad {...defaultProps} />);
    const tap = screen.getByRole("button", { name: /tap/i });
    fireEvent.click(tap);
    fireEvent.click(tap);
    fireEvent.click(tap);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("undo decrementa una ocurrencia", () => {
    render(<FrequencyPad {...defaultProps} />);
    const tap = screen.getByRole("button", { name: /tap/i });
    fireEvent.click(tap);
    fireEvent.click(tap);
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /deshacer/i }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("reiniciar deja el contador en 0", () => {
    render(<FrequencyPad {...defaultProps} />);
    const tap = screen.getByRole("button", { name: /tap/i });
    fireEvent.click(tap);
    fireEvent.click(tap);
    fireEvent.click(screen.getByRole("button", { name: /reiniciar/i }));
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it('botón "Guardar resultado" está deshabilitado sin taps', () => {
    render(<FrequencyPad {...defaultProps} />);
    const save = screen.getByRole("button", { name: /guardar resultado/i });
    expect(save).toBeDisabled();
  });
});
