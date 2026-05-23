import { describe, it, expect } from "vitest";
import { toCSV } from "@/lib/reports/csv";

type Row = { name: string; count: number; note: string | null };

describe("toCSV", () => {
  it("emits a header row plus one line per record", () => {
    const out = toCSV<Row>(
      [
        { name: "A", count: 1, note: "hola" },
        { name: "B", count: 2, note: null },
      ],
      [
        { header: "Name", get: (r) => r.name },
        { header: "Count", get: (r) => r.count },
        { header: "Note", get: (r) => r.note },
      ],
    );
    expect(out).toBe("Name,Count,Note\nA,1,hola\nB,2,\n");
  });
  it("quotes fields with commas, quotes, or newlines and doubles internal quotes", () => {
    const out = toCSV<Row>(
      [
        { name: 'He said "hi"', count: 1, note: "a,b" },
        { name: "line1\nline2", count: 2, note: null },
      ],
      [
        { header: "name", get: (r) => r.name },
        { header: "count", get: (r) => r.count },
        { header: "note", get: (r) => r.note },
      ],
    );
    expect(out).toBe(
      'name,count,note\n"He said ""hi""",1,"a,b"\n"line1\nline2",2,\n',
    );
  });
  it("treats null/undefined as empty string", () => {
    const out = toCSV<{ a: string | null | undefined }>(
      [{ a: null }, { a: undefined }, { a: "" }],
      [{ header: "a", get: (r) => r.a }],
    );
    expect(out).toBe("a\n\n\n\n");
  });
});
