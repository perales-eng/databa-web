// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/server/measurements", () => ({
  saveOpportunityResult: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/server/progress", () => ({
  saveProgress: vi.fn(async () => ({ ok: true })),
  loadProgress: vi.fn(async () => ({ ok: true, data: null, updatedAt: null })),
  clearProgress: vi.fn(async () => ({ ok: true })),
}));

import { OpportunityPad } from "@/components/measure/opportunity-pad";

const defaultProps = {
  sessionId: "session-1",
  behaviorMethodId: "bm-1",
  studentId: "stu-1",
  behaviorName: "Petición",
  maxOpportunities: 5,
  opportunityDescription: "",
  correctResponseDescription: "",
  onSaved: vi.fn(),
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OpportunityPad", () => {
  it("registra correctas e incorrectas y actualiza el %", () => {
    render(<OpportunityPad {...defaultProps} />);

    const correct = screen.getByRole("button", { name: /^correcto$/i });
    const incorrect = screen.getByRole("button", { name: /incorrecto/i });

    fireEvent.click(correct);
    fireEvent.click(correct);
    fireEvent.click(incorrect);
    fireEvent.click(correct);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/3 correctas/)).toBeInTheDocument();
    expect(screen.getByText(/1 incorrectas/)).toBeInTheDocument();
  });

  it("deshabilita ambos botones al alcanzar maxOpportunities", () => {
    render(<OpportunityPad {...defaultProps} maxOpportunities={2} />);
    const correct = screen.getByRole("button", { name: /^correcto$/i });
    const incorrect = screen.getByRole("button", { name: /incorrecto/i });
    fireEvent.click(correct);
    fireEvent.click(incorrect);
    expect(correct).toBeDisabled();
    expect(incorrect).toBeDisabled();
  });
});
