# Control de acceso — quién puede registrarse

> Estado actual: **registro público cerrado** vía feature flag `SIGNUPS_ENABLED`.

## Cómo funciona hoy (opción A — implementada)

El registro público está controlado por una env var:

| `SIGNUPS_ENABLED` | Comportamiento |
|---|---|
| `true` | `/signup` muestra el formulario y la action crea cuentas normalmente. |
| Cualquier otro valor (o ausente) | `/signup` muestra "Registro cerrado". La server action rechaza cualquier intento aunque alguien haga POST a mano. CTAs de signup en landing y login también se ocultan. |

**Default cerrado**: si la var no está seteada, el signup público está deshabilitado. Esto evita que un deploy mal configurado abra el registro por accidente.

### Qué sigue funcionando con el registro cerrado

- ✅ **Login con cuentas existentes** (ej. `demo@databa.app`).
- ✅ **Invitaciones** (`/invite/[token]`) — un OWNER puede invitar nuevos usuarios desde la app, y esos links generan cuentas reales sin pasar por `/signup`.
- ✅ Cualquier flujo interno que cree usuarios (seed, server-side).

### Cómo abrir o cerrar el registro

**Para abrir (Vercel production):**
1. Vercel → Settings → Environment Variables → Add New.
2. Key: `SIGNUPS_ENABLED`. Value: `true`. Tildar los 3 environments.
3. Deployments → ⋯ → Redeploy del deploy más reciente (sin "Use existing Build Cache").

**Para cerrar:** borrá la variable (o cambiala a cualquier valor distinto de `true`) y redeploy.

**En local:** agregá `SIGNUPS_ENABLED=true` en `.env` antes de `npm run dev`.

### Dónde vive el código

- `src/lib/feature-flags.ts` — helper `signupsEnabled()`.
- `src/app/(auth)/signup/actions.ts` — server action chequea el flag antes de crear nada.
- `src/app/(auth)/signup/page.tsx` — muestra mensaje de cierre cuando está off.
- `src/app/(auth)/login/page.tsx` — oculta el link "Crear cuenta".
- `src/app/page.tsx` — oculta los CTAs de signup de la landing.

---

## Alternativas evaluadas (pendientes / posibles)

### Opción B — Bloqueo hardcodeado

Quitar el botón "Crear cuenta" del UI y hacer que la action siempre falle, sin env var. Más simple pero requiere un deploy nuevo cada vez que se quiera reabrir el registro. Se descartó porque la opción A ofrece la misma ergonomía con un toggle reversible sin cambios de código.

### Opción C — Modo "invitación obligatoria" (recomendado a largo plazo)

Eliminar definitivamente el signup público y forzar que todo nuevo usuario entre vía link de invitación generado por un OWNER existente.

**Cambios estimados:**
- Quitar la ruta `/signup` (o redirigirla a `/login`).
- Asegurarse de que el primer usuario se crea por seed o por un script de admin (hoy el seed ya crea `demo@databa.app`).
- Validar el flujo `/invite/[token]` end-to-end: aceptar invitación → crear cuenta + membership → login automático.
- Posiblemente UI de "gestión de invitaciones" más completa (lista, expiración, revocar) si todavía no existe.
- Documentar el proceso para el OWNER ("cómo invitar a alguien").

**Cuándo encararlo:** cuando se confirme que la app va a quedar en uso real con usuarios reales y haya que sostener un modelo de acceso más prolijo que un feature flag. Mientras tanto, A cubre el caso "no quiero que random people se registren".

### Opción D — Allowlist de emails

Permitir signup público pero solo si el email pertenece a una lista (env var `SIGNUP_ALLOWED_EMAILS` o tabla en DB). Útil si querés que un grupo conocido se auto-registre sin tener que mandar invitaciones individuales. Más complejo que A, menos restrictivo que C. Se descarta por ahora.
