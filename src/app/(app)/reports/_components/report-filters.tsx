"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; label: string };

type Props = {
  students: Option[];
  behaviorMethods: Option[];
  csvHref: string;
};

export function ReportFilters({ students, behaviorMethods, csvHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [from, setFrom] = React.useState(params.get("from") ?? "");
  const [to, setTo] = React.useState(params.get("to") ?? "");
  const [studentId, setStudentId] = React.useState(params.get("studentId") ?? "");
  const [behaviorMethodId, setBehaviorMethodId] = React.useState(params.get("behaviorMethodId") ?? "");

  function apply() {
    const next = new URLSearchParams(params.toString());
    function set(key: string, value: string) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    set("from", from);
    set("to", to);
    set("studentId", studentId);
    set("behaviorMethodId", behaviorMethodId);
    router.push(`${pathname}?${next.toString()}`);
  }

  function reset() {
    setFrom("");
    setTo("");
    setStudentId("");
    setBehaviorMethodId("");
    const next = new URLSearchParams();
    const tab = params.get("tab");
    if (tab) next.set("tab", tab);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor="from" className="text-xs">Desde</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="text-xs">Hasta</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="studentId" className="text-xs">Estudiante</Label>
          <select
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todos</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="behaviorMethodId" className="text-xs">Método / conducta</Label>
          <select
            id="behaviorMethodId"
            value={behaviorMethodId}
            onChange={(e) => setBehaviorMethodId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todos</option>
            {behaviorMethods.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" onClick={apply} size="sm" className="flex-1">Aplicar</Button>
          <Button type="button" onClick={reset} size="sm" variant="outline">Limpiar</Button>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <a
          href={csvHref}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Descargar CSV
        </a>
      </div>
    </div>
  );
}
