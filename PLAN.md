# datABA web — Plan de trabajo por fases

> Documento vivo. Marcar `[x]` al completar. **No borrar tareas**: si se descartan, marcar `~~tachado~~` con motivo.
> Antes de cerrar una fase: `npm run typecheck && npm run lint && npm test` y, si hay schema nuevo, `prisma migrate dev`.

## Estado actual (snapshot)

| Fase | Estado | Commit / evidencia |
|---|---|---|
| 0 — Scaffold | DONE | `376355f` |
| 1 — Modelo dominio Prisma | DONE | `cae270f` |
| 2 — CRUD estudiantes/sesiones + calendario | DONE | `02de214` |
| 3 — Registro de mediciones en sesión | DONE | `6142760` |
| 3.5 — Reparaciones sobre Fase 3 | DONE | `4e8c524` |
| 4 — Sesiones reanudables + paralelas | DONE | `a6afb7a` |
| 5 — Reportes (vistas + CSV) | DONE | `381fa88` (+ `f4b5931`) |
| 6 — Export PDF + gráficos avanzados | DONE | (pendiente commit) |
| 7 — Onboarding + multi-miembro | DONE | `e6b3901`, `54ef29f`, `e1fe655` |
| 8 — Hardening (tests, lint en CI, deps) | TODO | — |

---

## Fase 3.5 — Reparaciones de lo ya hecho (PRIORIDAD ALTA)

Bugs/huecos detectados sobre lo que ya está commiteado. Hay que cerrarlos antes de avanzar.

- [x] **R1. Detalle de sesión no muestra ABC / Anecdotal / EventSampling.** Se guardan vía server actions pero `src/app/(app)/sessions/[id]/page.tsx` sólo renderiza `results`, `opportunityResults`, `temporalSamplingResults`. Decisión de diseño previa: agregar `sessionId String?` (nullable) a `ABCRecord`, `AnecdotalRecord`, `EventSampling` con migración aditiva y filtrar por él. Actualizar las 3 server actions para persistirlo.
- [x] **R2. `getSession()` en `src/server/queries.ts` debe incluir los nuevos registros** (ABC/Anecdotal/EventSampling filtrados por `sessionId`) y devolverlos tipados.
- [x] **R3. Conteo `totalMeasurements`** en detalle de sesión hoy ignora ABC/Anecdotal/EventSampling. Ajustar tras R1.
- [x] **R4. `auth-helpers.requireOrganization`** redirige a `/onboarding` que es un stub → usuario nuevo queda atrapado. Mantener redirección, pero implementar el onboarding (ver Fase 7.1). — Resuelto junto con 7.1/7.2.
- [x] **R5. Smoke test sólo cubre Fase 2.** Ampliar `scripts/smoke-test.ts` con `MeasurementResult` + `OpportunityResult` + `ABCRecord` para validar contratos de Fase 3.
- [x] **R6. `prisma/schema.prisma`**: pasar `behaviorName` desde `MeasureShell` a `ABCForm` y `AnecdotalForm` para que quede registrado en el row. ANECDOTAL y ABC pueden tener `BehaviorMethod` — diseño intencional documentado.
- [x] **R7. `cn` / utils**: verificar que no haya helpers duplicados en `src/lib/utils.ts`. — Limpio.
- [x] **R8. Dependencias instaladas y no usadas:** `framer-motion` removido. `recharts` se usará en Fase 5. `@tanstack/react-query` se mantiene para Fase 4.
- [x] **R9. Lint:** `npm run lint` limpio — sin errores ni warnings.
- [x] **R10. `next.config.ts` / `tsconfig.json`**: cast `any`/`unknown` inseguro en `measure-shell.tsx` eliminado; `config` mapeado correctamente en `page.tsx`.

**Criterio de cierre Fase 3.5:** las 3 nuevas secciones aparecen en detalle de sesión, smoke test extendido pasa, lint limpio.

---

## Fase 4 — Sesiones reanudables + mediciones paralelas

El schema ya tiene `MeasurementProgress` con `@@unique([behaviorMethodId, sessionId])`. Hoy no se usa.

- [x] **4.1.** Server actions `saveProgress(behaviorMethodId, sessionId, data)` y `loadProgress(...)` con upsert.
- [x] **4.2.** Hook `useMeasurementProgress` (debounce ~5 s + `onBeforeUnload`) en `src/components/measure/_hooks/`.
- [x] **4.3.** Integrar el hook en los 7 pads cronometrables (FREQUENCY, DURATION, LATENCY, INTENSITY, OPPORTUNITY, TEMPORAL_SAMPLING, EVENT_SAMPLING).
- [x] **4.4.** Al abrir `/sessions/[id]/measure`, hidratar estado inicial desde `MeasurementProgress.data`. — Cubierto por el hook (`onHydrate`).
- [x] **4.5.** Marcar `completedAt` cuando se guarda el `MeasurementResult` final (limpiar el progreso correspondiente). — Vía `clear()` desde cada pad.
- [x] **4.6.** **Mediciones paralelas:** convertir `MeasureShell` a layout de grilla multi-pad (estado independiente por pad) en lugar del único activo. Mantener "Finalizar sesión" global.
- [x] **4.7.** Tests unitarios del reducer/estado de cada pad (sin DB). — `tests/pad-state.test.ts` (18 tests).

**Criterio de cierre:** cerrar pestaña en medio de una medición y volver al rato → estado restaurado. 2 pads abiertos a la vez funcionan sin pisarse.

---

## Fase 5 — Reportes (vistas + CSV)

- [x] **5.1.** `lib/reports/aggregations.ts` puro: agrupar `MeasurementResult` por `behaviorMethodId` y fecha; reusar `calc.ts`.
- [x] **5.2.** Página `/reports` con tres tabs: **General** (KPIs org), **Por estudiante**, **Por método** (individual).
- [x] **5.3.** Componente `<TrendChart>` con `recharts` (line + bar) por método de medición.
- [x] **5.4.** Filtros: rango de fechas, estudiante, método.
- [x] **5.5.** Route handler `/reports/export.csv` que devuelve `Response` con `text/csv` (sin librerías). — Decidido route handler en vez de server action porque las server actions de Next 16 no exponen `Response` directo al cliente para download.
- [x] **5.6.** Botón "Descargar CSV" en cada vista. — En `ReportFilters`, link a `/reports/export.csv?…` con los filtros + tab activo.
- [x] **5.7.** Tests de `aggregations.ts`. — 14 tests + 3 de `csv.ts`.

**Criterio de cierre:** los 3 reportes muestran datos reales y exportan CSV válido.

---

## Fase 6 — PDF + gráficos avanzados

- [x] **6.1.** Decidir librería: `@react-pdf/renderer` (recomendado, JSX server-side). — Instalada `^4.5.1`.
- [x] **6.2.** Template PDF de reporte por estudiante. — `src/lib/reports/pdf-template.tsx` (header con org, KPIs, tablas de mediciones / oportunidades / temporal, sección notas, footer con fecha).
- [x] **6.3.** Route handler `/reports/export.pdf?studentId=…` que devuelve `application/pdf`. — Decidido route handler en vez de server action por el mismo motivo que CSV.
- [x] **6.4.** Gráfico comparativo entre métodos (recharts) en la card por estudiante. — `MultiTrendChart` + `trendByMethodSeries`.
- [x] **6.5.** Anotaciones / notas clínicas en el PDF. — Campo en `ReportFilters` que viaja como `?notes=…`.

**Criterio de cierre:** PDF descargable y abre limpio en Acrobat/Preview/Chrome.

---

## Fase 7 — Onboarding + multi-miembro

- [x] **7.1. Onboarding real:** form en `/onboarding` que crea `Organization` + `Membership(role=OWNER)` en una transacción. Slug auto-derivado y único.
- [x] **7.2.** Borrar el copy "Fase 7" de `auth-helpers.ts` y `onboarding/page.tsx` una vez implementado.
- [x] **7.3. Modelo `Invitation`** (`email`, `organizationId`, `role`, `token`, `expiresAt`, `acceptedAt?`). Migración.
- [x] **7.4.** Server action `inviteMember(email, role)` (solo OWNER/ADMIN) → genera token. Email opcional via Resend queda diferido; UX actual = copy-link.
- [x] **7.5.** Página `/invite/[token]`: si email coincide con sesión, auto-accept; si no, ofrece aceptar igual o cambiar de cuenta. Sin sesión redirige a `/login?from=…`.
- [x] **7.6.** Settings → sección Miembros: listar, cambiar rol (OWNER only, no auto), revocar invitación, remover miembro.
- [x] **7.7.** Settings → editar nombre de organización (solo OWNER).
- [x] **7.8.** Catálogo `Behavior` reutilizable: CRUD bajo `/settings/behaviors` + `<datalist>` autocomplete al crear/editar `BehaviorMethod`. Upsert automático al guardar un BM enlaza al catálogo.

**Criterio de cierre:** usuario nuevo se registra → crea org → invita compañero → compañero acepta y entra como THERAPIST.

---

## Fase 8 — Hardening, observabilidad y CI

- [ ] **8.1.** Tests de server actions con Vitest contra base efímera (Docker PG separado) o `vitest-mock-extended` sobre `db`.
- [ ] **8.2.** Tests de componentes críticos (`FrequencyPad`, `OpportunityPad`, `MeasureShell`) con Testing Library.
- [ ] **8.3.** GitHub Actions: `lint`, `typecheck`, `test` en cada PR.
- [ ] **8.4.** Logging mínimo (pino/console estructurado) en server actions.
- [ ] **8.5.** Error boundary global + página `error.tsx` por segmento.
- [ ] **8.6.** Auditoría: revisar `any`/`unknown` en TS, eliminar deps no usadas (decisión final R8).
- [ ] **8.7.** `seed.ts`: revisar datos demo para que cubran los 9 métodos de medición.
- [ ] **8.8.** README actualizado con instrucciones reales (no el de create-next-app).

**Criterio de cierre:** CI verde en cada PR, cobertura >50% en `src/server` y `src/lib`.

---

## Orden de ejecución recomendado

1. **Fase 3.5** (reparaciones) — bloqueante.
2. **Fase 7.1 + 7.2** (onboarding mínimo) — desbloquea usuarios nuevos. Resto de Fase 7 puede ir más tarde.
3. **Fase 5** (reportes + CSV) — valor visible para el terapeuta.
4. **Fase 4** (reanudables/paralelas) — UX avanzada.
5. **Fase 6** (PDF).
6. **Fase 7 resto** (invitaciones, miembros, catálogo Behavior).
7. **Fase 8** (hardening continuo, idealmente incremental durante las fases previas).

## Reglas operativas

- Cada PR cierra **una** tarea numerada (`R1`, `4.3`, etc.) o un grupo coherente. Referenciar el ID en el mensaje de commit.
- Migraciones **siempre aditivas** (campos nullable + default) hasta que haya prod.
- Server actions: `requireOrganization()` + filtro `organizationId` en cada `where`. Sin excepciones.
- Next 16: `params` y `searchParams` son `Promise` — respetar ese patrón.
- No introducir dependencias nuevas sin justificación en el PR.
- Antes de cerrar fase: `typecheck`, `lint`, `test`, smoke test, y manual check del flujo principal.
