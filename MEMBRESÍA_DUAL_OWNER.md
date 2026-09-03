# Membresía Dual para OWNERs Invitados por DEV

## 🎯 Problema Resuelto

Cuando un DEV invitaba a un OWNER y este aceptaba la invitación:
- ✅ Se creaba una nueva organización para el OWNER (correcto)
- ❌ El OWNER **NO** aparecía en la lista de miembros del DEV
- ❌ El DEV no podía remover o gestionar al OWNER invitado
- ❌ Si el DEV "removía" al OWNER, este seguía teniendo acceso a su organización

## ✨ Solución Implementada

Ahora, cuando un OWNER acepta una invitación de un DEV:

1. **Se crea su propia organización** (como antes)
   - El OWNER es propietario de su nueva org
   - Puede gestionar sus estudiantes, sesiones, etc.

2. **También se une a la organización del DEV** (NUEVO)
   - Aparece en la lista de "Miembros activos" del DEV
   - El DEV puede ver y gestionar al OWNER
   - El DEV puede remover al OWNER si es necesario

3. **Al remover, se elimina TODO** (NUEVO)
   - Cuando el DEV remueve a un OWNER, se elimina completamente su organización
   - Se borran todos los datos: estudiantes, sesiones, mediciones, reportes, etc.
   - El OWNER pierde acceso total a la plataforma

### Membresía Dual

Un OWNER invitado por DEV tendrá **DOS membresías**:

```
Usuario OWNER:
├─ Organización A (su propia clínica) → rol: OWNER
└─ Organización DEV → rol: OWNER
```

## 🔧 Cambios Técnicos

### `src/server/organizations.ts`

**Función `acceptInvitation()`** - Cuando `isDevInvitingOwner === true`:

```typescript
await db.$transaction(async (tx) => {
  // 1. Crear nueva organización para el OWNER
  const created = await tx.organization.create({
    data: { name: orgName, slug },
  });

  // 2. Hacer al usuario OWNER de su nueva organización
  await tx.membership.create({
    data: {
      userId: user.id,
      organizationId: created.id,
      role: "OWNER",
    },
  });

  // 3. También unir al OWNER a la organización del DEV (NUEVO)
  await tx.membership.create({
    data: {
      userId: user.id,
      organizationId: inv.organizationId, // org del DEV
      role: "OWNER",
    },
  });

  // 4. Marcar invitación como aceptada
  await tx.invitation.update({
    where: { id: inv.id },
    data: { acceptedAt: new Date() },
  });

  return created;
});
```

**Función `removeMember()`** - Eliminación completa cuando DEV remueve OWNER:

```typescript
// Si un DEV remueve a un OWNER, eliminar la organización propia del OWNER
if (role === "DEV" && m.role === "OWNER") {
  await db.$transaction(async (tx) => {
    // 1. Encontrar la organización propia del OWNER
    const ownerOrganizations = await tx.membership.findMany({
      where: {
        userId: m.userId,
        role: "OWNER",
        organizationId: { not: organization.id },
      },
      include: {
        organization: {
          include: { memberships: true },
        },
      },
    });

    // 2. Encontrar la org donde el OWNER es el único miembro
    const ownClinic = ownerOrganizations.find(
      (om) => om.organization.memberships.length === 1 
           && om.organization.memberships[0].userId === m.userId
    );

    // 3. Eliminar la organización completa (cascada automática)
    if (ownClinic) {
      await tx.organization.delete({
        where: { id: ownClinic.organizationId },
      });
    }

    // 4. Eliminar la membresía en la org del DEV
    await tx.membership.delete({ where: { id: m.id } });
  });
}
```

## 📋 Comportamiento

### Para el DEV

1. **Invitar**: DEV puede invitar a OWNER
2. **Ver**: El OWNER aparece en "Miembros activos" después de aceptar
3. **Gestionar**: DEV puede cambiar el rol del OWNER (a ADMIN, THERAPIST)
4. **Remover**: DEV puede remover al OWNER → **ELIMINA TODO**

### Para el OWNER invitado

1. **Acepta invitación**: Se crea su propia organización
2. **Tiene 2 organizaciones**:
   - Su propia clínica (control total)
   - La organización del DEV (puede ver pero no gestionar)
3. **Puede cambiar de organización**: Usando el selector de org en el dashboard
4. **Si el DEV lo remueve**: 
   - ❌ Pierde su organización propia
   - ❌ Pierde todos sus datos (estudiantes, sesiones, mediciones)
   - ❌ Pierde acceso total a la plataforma

## ⚠️ Consideraciones Importantes

### Eliminación en Cascada (CASCADE)

Cuando se elimina la organización del OWNER, Prisma elimina automáticamente:

- ✅ **Memberships** (membresías)
- ✅ **Invitations** (invitaciones pendientes)
- ✅ **Students** (estudiantes)
- ✅ **Behaviors** (conductas del catálogo)
- ✅ **BehaviorMethods** (métodos de medición configurados)
- ✅ **TherapySessions** (sesiones de terapia)
- ✅ **MeasurementResults** (resultados de mediciones)
- ✅ **OpportunityResults** (resultados de oportunidades)
- ✅ **TemporalSamplingResults** (resultados de muestreo temporal)
- ✅ **ABCRecords** (registros ABC)
- ✅ **AnecdotalRecords** (registros anecdóticos)
- ✅ **EventSamplings** (muestreo de eventos)
- ✅ **MeasurementProgress** (progreso de mediciones en curso)

Todo esto sucede en **una sola transacción atómica** gracias a `onDelete: Cascade` en el schema de Prisma.

### Permisos del OWNER en la org del DEV

Un OWNER en la organización del DEV:
- ✅ Puede ver los miembros
- ✅ Puede invitar ADMIN/THERAPIST (según reglas de rol OWNER)
- ❌ NO puede remover al DEV
- ❌ NO puede remover a otros OWNER

### Remoción

Cuando el DEV remueve a un OWNER:
```typescript
// 1. Busca la organización propia del OWNER
// 2. Elimina la organización completa (CASCADE)
// 3. Elimina la membresía en la org del DEV
// Todo en una transacción atómica
```

**⚠️ ADVERTENCIA**: Esta operación es **irreversible** y elimina **todos los datos** del OWNER.

## 🧪 Testing Manual

1. **Como DEV**: Invitar a un nuevo usuario con rol OWNER
2. **Como OWNER**: Aceptar la invitación → debe crear org propia y unirse a org del DEV
3. **Como OWNER**: Crear estudiantes, sesiones, registros en su propia org
4. **Como DEV**: Ir a Settings → debe ver al OWNER en "Miembros activos"
5. **Como DEV**: Remover al OWNER
6. **Como OWNER**: Intentar iniciar sesión → no debe tener acceso (sin organizaciones)
7. **Verificar BD**: La organización del OWNER y todos sus datos deben estar eliminados

## 🔒 Seguridad

- Solo el **DEV** puede eliminar completamente a un OWNER
- Los **OWNER** NO pueden remover a otros OWNER (protección)
- La eliminación es **atómica** (transacción)
- **No hay rollback**: una vez eliminado, no se puede recuperar

## 📝 Notas

- El schema de la BD NO requiere cambios (usa CASCADE existente)
- Usa la estructura existente de `Membership` y relaciones de Prisma
- Compatible con el sistema actual de permisos jerárquicos
- El OWNER siempre aterriza en su propia organización después de aceptar la invitación
- La eliminación es **permanente** y **completa**
