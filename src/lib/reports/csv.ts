/**
 * CSV builder puro. RFC 4180-style: campos con `,`, `"` o newline quedan
 * entre comillas dobles, las comillas internas se duplican.
 */

export type CsvColumn<T> = {
  header: string;
  get: (row: T) => string | number | null | undefined;
};

function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "number" ? String(value) : value;
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeField(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeField(c.get(row))).join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}
