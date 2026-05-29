import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { requireOrganization } from "@/lib/auth-helpers";
import { listStudents } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SearchParams = Promise<{ q?: string; sort?: string }>;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const { organization } = await requireOrganization();
  const { q, sort } = await searchParams;
  const students = await listStudents(organization.id, { search: q, sort });

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
            Legajos · {organization.name}
          </span>
          <h1 className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.05] tracking-[-0.02em]">
            Estudiantes.
          </h1>
          <p className="mt-3 text-[15px] text-ink/65">
            {students.length} {students.length === 1 ? "estudiante" : "estudiantes"} activos.
          </p>
        </div>
        <Link href="/students/new">
          <Button>
            <Plus className="h-4 w-4" /> Nuevo estudiante
          </Button>
        </Link>
      </header>

      <form className="mb-6 flex gap-2" action="/students" method="get">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre…"
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          name="sort"
          defaultValue={sort ?? "name_asc"}
          className="flex h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="name_asc">Nombre A → Z</option>
          <option value="name_desc">Nombre Z → A</option>
          <option value="created_desc">Recién agregados</option>
          <option value="created_asc">Más antiguos</option>
        </select>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No hay estudiantes todavía</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agregá tu primer estudiante para empezar a registrar datos.
            </p>
            <Link href="/students/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" /> Nuevo estudiante
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/students/${s.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                    style={{ background: s.color || "hsl(var(--primary))" }}
                  >
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary">{s._count.behaviorMethods} métodos</Badge>
                      <Badge variant="outline">{s._count.therapySessions} sesiones</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
