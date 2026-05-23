# datABA web

Plataforma web multi-tenant para registrar mediciones conductuales ABA (terapia ABA).

Permite cargar estudiantes, configurar métodos de medición (frecuencia, duración, latencia, intensidad, oportunidades, muestreo temporal, event sampling, ABC, anecdótico), correr sesiones con un panel en vivo, generar reportes con gráficos y exportar a CSV o PDF.

## Stack

- **Next.js 16** (App Router, React 19, Server Components + Server Actions)
- **Prisma 6** + PostgreSQL
- **NextAuth (Auth.js) 5 beta** — credentials provider
- **Tailwind v4** + shadcn-style UI
- **Recharts** para charts, **@react-pdf/renderer** para PDFs
- **Vitest** + Testing Library para tests

## Setup local

Necesitás Node 20+ y Docker (para Postgres).

```bash
# 1. instalar deps
npm install

# 2. levantar Postgres
docker compose up -d

# 3. copiar env
cp .env.example .env   # si no existe, crear con DATABASE_URL y NEXTAUTH_SECRET

# 4. migrar + seed con datos demo
npx prisma migrate dev
npm run db:seed

# 5. correr la app
npm run dev
```

App en [http://localhost:3000](http://localhost:3000). Login demo: `demo@databa.app` / `demo1234`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Build de producción |
| `npm run start` | Correr build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run (server actions + state + components) |
| `npm run test:watch` | Vitest watch |
| `npm run db:seed` | Cargar datos demo |
| `npm run db:reset` | Reset BD + re-aplicar migraciones + seed |

## Estructura

```
src/
├── app/                      # rutas Next.js (App Router)
│   ├── (app)/                # rutas protegidas (con layout de la app)
│   │   ├── dashboard/
│   │   ├── students/         # CRUD + perfil + métodos
│   │   ├── sessions/[id]/    # detalle + edición + /measure
│   │   ├── calendar/
│   │   ├── reports/          # /reports, /reports/export.csv, /reports/export.pdf
│   │   └── settings/         # cuenta, org, miembros, /settings/behaviors
│   ├── (auth)/               # login + signup
│   ├── onboarding/           # crear primera organización
│   └── invite/[token]/       # aceptar invitaciones
├── components/
│   ├── ui/                   # primitives (Button, Card, Input, etc.)
│   ├── behaviors/            # form de BehaviorMethod
│   └── measure/              # los 7 pads cronometrables + ABC / Anecdotal
│       └── _hooks/           # useMeasurementProgress (autoguardado)
├── lib/
│   ├── measurements/         # calc.ts (cálculos puros), pad-state.ts, schemas.ts
│   ├── reports/              # aggregations.ts, csv.ts, pdf-template.tsx
│   ├── auth-helpers.ts
│   ├── logger.ts
│   └── db.ts
└── server/                   # server actions por dominio
    ├── students.ts
    ├── sessions.ts
    ├── behaviors.ts
    ├── behavior-catalog.ts
    ├── measurements.ts
    ├── progress.ts
    ├── organizations.ts
    ├── onboarding.ts
    └── queries.ts, queries-reports.ts

prisma/
├── schema.prisma             # modelos multi-tenant + Auth + métodos
├── migrations/
└── seed.ts                   # datos demo (cubren los 9 métodos)

tests/                        # vitest (.test.ts y .test.tsx con jsdom)
```

## Decisiones de diseño relevantes

- **Server actions sobre API routes** para mutaciones. Las únicas API routes son las descargas (`/reports/export.csv`, `/reports/export.pdf`) porque retornan `Response` con `Content-Disposition`.
- **Multi-tenant** desde día 1: todo modelo de dominio tiene `organizationId`; `requireOrganization()` es el guard server-side.
- **Mediciones reanudables**: cada pad escribe a `MeasurementProgress` con debounce 5s + flush en `beforeunload`. Al volver a abrir la sesión, el snapshot se rehidrata.
- **Mediciones paralelas**: `/sessions/[id]/measure` renderiza todos los métodos en una grilla; estados independientes.
- **Catálogo de Behaviors**: se llena automáticamente al guardar un BehaviorMethod (upsert por nombre); UI dedicada en `/settings/behaviors`.
- **PDFs server-side**: `@react-pdf/renderer` corre en route handler con `runtime=nodejs`.

## CI

`.github/workflows/ci.yml` corre `lint + typecheck + test + build` en cada PR y push a `main`.

## Plan de trabajo

Ver `PLAN.md` para el estado de las fases (todas completadas hasta Fase 8).
