import Link from "next/link";

export type ReportTab = "general" | "student" | "method";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "student", label: "Por estudiante" },
  { key: "method", label: "Por método" },
];

export function ReportTabs({ current, params }: { current: ReportTab; params: URLSearchParams }) {
  return (
    <div className="flex gap-1 border-b">
      {TABS.map((t) => {
        const sp = new URLSearchParams(params);
        sp.set("tab", t.key);
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={`/reports?${sp.toString()}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
