"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendChartProps = {
  data: { date: string; value: number; count: number }[];
  variant?: "line" | "bar";
  height?: number;
  yLabel?: string;
};

export function TrendChart({ data, variant = "line", height = 220, yLabel }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Sin datos en el rango seleccionado
      </div>
    );
  }

  const Chart = variant === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", style: { fontSize: 11 } }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v))}
        />
        {variant === "bar" ? (
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
