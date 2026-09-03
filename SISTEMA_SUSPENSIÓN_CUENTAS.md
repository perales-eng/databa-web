# Sistema de Suspensión de Cuentas OWNER

## 🎯 Funcionalidad

El DEV ahora puede **suspender temporalmente** la cuenta de un OWNER sin eliminar sus datos. Esto permite:

- ✅ Pausar el acceso del OWNER a la plataforma
- ✅ Mantener todos los datos intactos (estudiantes, sesiones, mediciones)
- ✅ Reactivar la cuenta cuando sea necesario
- ✅ Opción alternativa a la eliminación permanente

## 🔧 Cambios Implementados

### 1. **Schema de Prisma** (`prisma/schema.prisma`)

Agregado campo `suspended` a la tabla `Organization`:

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  suspended Boolean  @default(false)  // NUEVO
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ... relaciones
}
```

**Migración**: `20260903215444_add_organization_suspended`

### 2. **Server Actions** (`src/server/organizations.ts`)

Nueva función `toggleOrganizationSuspension`:

```typescript
export async function toggleOrganizationSuspension(
  membershipId: string
): Promise<ActionResult<{ suspended: boolean }>> {
  // Solo DEV puede suspender
  if (role !== "DEV") {
    return { ok: false, error: "Sin permisos para suspender organizaciones" };
  }

  // Solo se pueden suspender OWNERs
  if (m.role !== "OWNER") {
    return { ok: false, error: "Solo se pueden suspender cuentas de propietarios" };
  }

  // Buscar la organización propia del OWNER y cambiar suspended
  await db.organization.update({
    where: { id: ownClinic.organizationId },
    data: { suspended: !currentState },
  });

  return { ok: true, suspended: newState };
}
```

### 3. **Verificación de Suspensión** (`src/lib/auth-helpers.ts`)

Modificado `requireOrganization()` para verificar estado:

```typescript
export async function requireOrganization() {
  const user = await requireUser();
  const membership = user.memberships[0];
  
  if (!membership) {
    redirect("/onboarding");
  }
  
  // Verificar suspensión (no aplica a DEV)
  if (membership.organization.suspended && membership.role !== "DEV") {
    redirect("/suspended");
  }
  
  return { user, organization: membership.organization, role: membership.role };
}
```

### 4. **Página de Suspensión** (`src/app/suspended/page.tsx`)

Nueva página que se muestra a usuarios suspendidos:

- Muestra mensaje de cuenta suspendida
- Información de la cuenta
- Botón para cerrar sesión
- No permite acceso al dashboard

### 5. **UI de Settings** (`src/app/(app)/settings/page.tsx`)

Actualizado para mostrar:

- Badge "Suspendido" en miembros suspendidos
- Botón de pausa/play para suspender/reactivar
- Query para obtener estado de suspensión de cada OWNER

### 6. **Componentes** (`src/app/(app)/settings/_components/member-actions.tsx`)

Nuevo componente `SuspendMemberButton`:

- Icono de pausa (suspender) o play (reactivar)
- Confirmación antes de cambiar estado
- Toast de feedback
- Solo visible para DEV en cuentas OWNER

## 📋 Flujo de Uso

### Para el DEV:

1. **Ver estado**: En Settings, los OWNERs suspendidos muestran badge "Suspendido"
2. **Suspender**: Click en botón pausa → confirma → cuenta suspendida
3. **Reactivar**: Click en botón play → confirma → cuenta reactivada
4. **Eliminar**: Botón de eliminar sigue disponible para borrado permanente

### Para el OWNER Suspendido:

1. **Intenta entrar**: Inicia sesión normalmente
2. **Redirección**: Automáticamente redirigido a `/suspended`
3. **Mensaje**: Ve página con mensaje de suspensión
4. **Sin acceso**: No puede acceder a dashboard, estudiantes, sesiones, etc.
5. **Puede salir**: Botón para cerrar sesión disponible

### Para el OWNER Reactivado:

1. **Inicia sesión**: Acceso normal
2. **Dashboard**: Todos sus datos intactos
3. **Funcionalidad completa**: Puede trabajar normalmente

## ⚖️ Comparación: Suspender vs Eliminar

| Acción | Datos | Acceso | Reversible |
|--------|-------|--------|------------|
| **Suspender** | ✅ Se mantienen | ❌ Bloqueado | ✅ Sí (reactivar) |
| **Eliminar** | ❌ Se borran | ❌ Bloqueado | ❌ No (permanente) |

## 🔒 Permisos y Validaciones

### Solo DEV puede suspender:
```typescript
if (role !== "DEV") {
  return { ok: false, error: "Sin permisos..." };
}
```

### Solo OWNERs pueden ser suspendidos:
```typescript
if (m.role !== "OWNER") {
  return { ok: false, error: "Solo se pueden suspender propietarios" };
}
```

### DEV no es afectado por suspensión:
```typescript
if (membership.organization.suspended && membership.role !== "DEV") {
  redirect("/suspended");
}
```

### No se puede suspender a sí mismo:
```typescript
if (m.userId === user.id) {
  return { ok: false, error: "No podés suspender tu propia cuenta" };
}
```

## 🧪 Testing

### Test 1: Suspender cuenta
```bash
1. Como DEV, ir a Settings
2. Localizar un OWNER en la lista de miembros
3. Click en botón de pausa
4. Confirmar acción
5. Verificar badge "Suspendido" aparece
6. Como OWNER, cerrar sesión e intentar entrar
7. Verificar redirección a /suspended
```

### Test 2: Reactivar cuenta
```bash
1. Como DEV, ir a Settings
2. Localizar OWNER suspendido (badge rojo)
3. Click en botón de play
4. Confirmar acción
5. Verificar badge desaparece
6. Como OWNER, iniciar sesión
7. Verificar acceso normal al dashboard
8. Verificar datos intactos
```

### Test 3: Datos preservados
```bash
1. Como OWNER, crear estudiantes, sesiones, datos
2. Como DEV, suspender la cuenta del OWNER
3. Verificar en BD: datos existen
4. Como DEV, reactivar cuenta
5. Como OWNER, verificar todos los datos siguen ahí
```

## 📊 Estructura de la BD

```sql
-- Organization con campo suspended
CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "suspended" BOOLEAN DEFAULT false NOT NULL,  -- NUEVO
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

## 🚨 Casos de Uso

### 1. **Periodo de Prueba Vencido**
Cliente en periodo de prueba → vence → DEV suspende → cliente paga → DEV reactiva

### 2. **Falta de Pago**
Cliente no paga → DEV suspende temporalmente → cliente regulariza → DEV reactiva

### 3. **Solicitud del Cliente**
Cliente pide pausar cuenta (vacaciones, etc.) → DEV suspende → cliente vuelve → DEV reactiva

### 4. **Investigación/Auditoría**
Actividad sospechosa → DEV suspende preventivamente → investiga → DEV reactiva o elimina

## 📝 Notas Importantes

- ✅ La suspensión NO afecta la organización del DEV
- ✅ Solo se suspende la organización propia del OWNER
- ✅ El OWNER mantiene su membresía en la org del DEV
- ✅ Los datos quedan completamente intactos
- ✅ La reactivación es instantánea
- ✅ No hay límite de suspensiones/reactivaciones
- ⚠️ El OWNER suspendido NO recibe notificación (por implementar)

## 🔮 Mejoras Futuras

- [ ] Enviar email al OWNER cuando su cuenta es suspendida
- [ ] Agregar campo `suspendedAt` y `suspendedReason`
- [ ] Historial de suspensiones
- [ ] Auto-suspensión programada (ej: después de X días sin pago)
- [ ] Notificación al OWNER antes de suspender (advertencia)
