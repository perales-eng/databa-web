# Performance — playbook para acelerar la app

Fecha del análisis: 2026-05-30.

## Síntoma reportado

Los clicks en botones se sienten lentos en producción (databa.vercel.app),
especialmente el primero después de no usar la app por unos minutos.

## Diagnóstico

La latencia tiene tres fuentes, en orden de impacto esperado:

1. **Neon (free tier) auto-suspende** la base después de ~5 minutos sin tráfico.
   El primer request reanuda el cluster y agrega **1-3 segundos** al primer click.
2. **Vercel serverless cold starts** — la función lambda del server action puede
   tardar **300-800ms** en levantar si no se ejecutó hace rato.
3. **Prisma sin connection pooler** — cada server action abre una conexión TCP
   nueva al Postgres. En serverless esto pesa **150-400ms por request**.

Adicionalmente: cada acción hace `revalidatePath` + `router.refresh()`, lo que
fuerza un re-render server-side (otra query al DB). Es necesario para que la UI
se actualice; se puede optimizar caso por caso pero no es la causa principal.

## Cómo confirmar cuál pesa más

1. DevTools → Network → tocar un botón:
   - Si la primera request es lenta (>1s) pero las siguientes rápidas → Neon cold start.
   - Si todas son consistentemente lentas (~500-800ms) → cold start + sin pooler.
2. Dashboard de Neon muestra cuándo el endpoint está suspended y cuánto tarda en wake up.

---

## Opción A — Gratis (connection pooler de Neon)

**Impacto:** elimina el costo de abrir conexión por request (~150-400ms menos por click).
**Costo:** $0.
**No arregla:** los cold starts de Neon (free tier sigue auto-suspendiendo).

### Pasos

1. En el dashboard de Neon:
   - Copiar la connection string **Pooled** (toggle "Pooled connection" activado).
     Tiene `-pooler` en el hostname y debe terminar en
     `?pgbouncer=true&connect_timeout=10`.
   - Copiar también la connection string **Direct** (toggle apagado) — la que ya
     usás hoy.
2. En Vercel → Settings → Environment Variables:
   - Renombrar la actual `DATABASE_URL` → `DIRECT_URL` (mantiene el valor direct).
   - Crear nueva `DATABASE_URL` con el valor **pooled**.
3. En el código, actualizar `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
4. Para el dev local: agregar `DIRECT_URL` a `.env.local` apuntando al mismo
   Postgres local (mismo valor que `DATABASE_URL`).
5. Redeploy desde Vercel (o push para que rebuildee).

---

## Opción B — Pagar Neon Pro (~$19/mes)

**Impacto:** elimina los cold starts del Postgres. Endpoint siempre activo.
La app responde instant todo el tiempo después del primer cargado.
**Costo:** USD ~$19/mes (a confirmar tier exacto en https://neon.tech/pricing).
**Combinar con opción A** sigue valiendo la pena.

### Pasos
1. Upgrade del plan en el dashboard de Neon.
2. Desactivar el "auto-suspend" para el endpoint principal en
   Neon → Settings → Compute → Suspend timeout = "Never".
3. Listo. No requiere cambio de código.

---

## Opción C — Vercel Pro (~$20/mes/miembro)

**Impacto:** mejora cold starts de las lambdas (warm pool más grande), región más
cerca, observabilidad mejor. Mejora moderada — ahorra ~200-500ms en clicks
ocasionales, pero NO elimina cold starts de Neon.
**Costo:** USD ~$20/mes por seat.
**Recomendación:** solo si ya pagaste Neon y seguís sintiendo lentitud.

---

## Opción D — Prisma Accelerate (free tier disponible)

**Impacto:** connection pooler global + edge cache para queries. Reduce latencia
y agrega caching opcional por query.
**Costo:** free tier alcanza para esta app; planes pagos arrancan en USD ~$29/mes.
**Trade-off:** suma una dependencia más (Prisma Data Platform); recomiendo
probar la opción A primero porque resuelve lo mismo sin agregar terceros.

---

## Orden recomendado

1. **Hoy / gratis:** Opción A (pooler de Neon). Es el mejor ratio costo/beneficio.
2. **Si después seguís sintiendo lentitud al primer click:** Opción B (Neon Pro).
3. **Si seguís queriendo más velocidad:** Opción C (Vercel Pro).

La Opción A sola debería cubrir el 80% del problema percibido para uso casual.
Para uso clínico real (sesiones diarias frecuentes) la Opción B vale la pena —
nadie quiere esperar 2 segundos por la primera medición del día.
