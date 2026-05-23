"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MultiSeries = {
  key: string;
  label: string;
  points: { date: string; value: number }[];
};

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#475569", "#ca8a04",
];

export function MultiTrendChart({ series, height = 200 }: { series: MultiSeries[]; height?: number }) {
  // Pivot a wide format: cada punto es { date, [seriesKey]: value, ... }
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.date))),
  ).sort();

  const data = allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const point = s.points.find((p) => p.date === date);
      if (point) row[s.key] = point.value;
    }
    return row;
  });

  if (series.length === 0 || data.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Sin datos para comparar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v))}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
