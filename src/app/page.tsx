import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-semibold tracking-tight">datABA</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/signup">
              <Button>Crear cuenta</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Análisis de Conducta Aplicada,{" "}
              <span className="text-primary">desde cualquier dispositivo</span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Registra mediciones de frecuencia, duración, latencia, intensidad, muestreo temporal y
              oportunidades. Visualiza el progreso de tus estudiantes con gráficos profesionales.
              Funciona offline durante tus sesiones.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Empezar gratis</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} datABA — Hecho para profesionales ABA.
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "9 métodos de medición",
    desc: "Frecuencia, duración, latencia, intensidad, muestreo temporal, oportunidades, ABC, anecdóticos, event sampling.",
  },
  { title: "Mediciones paralelas", desc: "Ejecutá varias mediciones a la vez sin perder datos." },
  { title: "Offline en sesión", desc: "Tus cronómetros siguen funcionando aunque pierdas conexión." },
  { title: "Gráficos profesionales", desc: "Líneas, barras, dispersión y gráficos combinados por método." },
  { title: "Reportes y exportación", desc: "Generá CSV y PDF listos para análisis estadístico." },
  { title: "Multi-clínica", desc: "Invitá a tu equipo. Cada organización con sus datos aislados." },
];
