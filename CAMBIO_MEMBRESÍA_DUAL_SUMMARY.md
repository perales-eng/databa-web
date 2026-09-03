# Resumen: Membresía Dual para OWNERs Invitados

## 🎯 Problema Original

Cuando un DEV invitaba a un OWNER:
- ❌ El OWNER no aparecía en la lista de miembros del DEV
- ❌ El DEV no podía gestionar ni remover al OWNER invitado
- ❌ Si el DEV "removía" al OWNER, este seguía teniendo acceso

## ✅ Solución Implementada

Ahora, cuando un OWNER acepta la invitación de un DEV:

1. **Se crea su propia organización** (comportamiento original mantenido)
2. **Se une también a la organización del DEV** (NUEVO)
3. **Al remover, se elimina TODO** (NUEVO - CRÍTICO)

Resultado: El OWNER tiene **membresía dual** en ambas organizaciones, pero si el DEV lo remueve, **se elimina completamente su organización y todos sus datos**.

## 📝 Archivos Modificados

### `src/server/organizations.ts`

**Función 1**: `acceptInvitation()`

**Cambio**: En el bloque `if (isDevInvitingOwner)`, ahora se crean **DOS membresías**:

```typescript
// 2. Hacer al usuario OWNER de su nueva organización
await tx.membership.create({
  data: {
    userId: user.id,
    organizationId: created.id,  // su propia org
    role: "OWNER",
  },
});

// 3. También unir al OWNER a la organización del DEV (NUEVO)
await tx.membership.create({
  data: {
    userId: user.id,
    organizationId: inv.organizationId,  // org del DEV
    role: "OWNER",
  },
});
```

**Función 2**: `removeMember()`

**Cambio**: Cuando un DEV remueve a un OWNER, ahora **elimina su organización completa**:

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
        organization: { include: { memberships: true } },
      },
    });

    // 2. Encontrar la org donde el OWNER es el único miembro
    const ownClinic = ownerOrganizations.find(
      (om) => om.organization.memberships.length === 1
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

## 🔍 Cómo Funciona

### Desde la perspectiva del DEV:

1. Invita a `nuevo@email.com` como OWNER
2. El usuario acepta → crea su org "Clínica Nueva"
3. **Ahora aparece en Settings** → Miembros activos
4. Puede cambiar su rol o **removerlo completamente**
5. **Al remover**: Se elimina la organización del OWNER con TODOS sus datos

### Desde la perspectiva del OWNER:

1. Acepta invitación → aterriza en su propia org "Clínica Nueva"
2. Puede cambiar entre organizaciones usando el selector
3. Ve dos organizaciones en su lista:
   - "Clínica Nueva" (su org)
   - "Organización DEV" (del invitador)
4. **Si el DEV lo remueve**: 
   - ❌ Pierde su organización completa
   - ❌ Pierde todos sus datos (estudiantes, sesiones, mediciones, reportes)
   - ❌ Pierde acceso total a la plataforma

## ⚠️ Eliminación en Cascada

Cuando el DEV remueve a un OWNER, se eliminan automáticamente:

- Memberships (membresías)
- Invitations (invitaciones pendientes)
- Students (estudiantes)
- Behaviors (conductas)
- BehaviorMethods (métodos de medición)
- TherapySessions (sesiones)
- MeasurementResults (resultados)
- OpportunityResults (resultados de oportunidades)
- TemporalSamplingResults (muestreo temporal)
- ABCRecords (registros ABC)
- AnecdotalRecords (registros anecdóticos)
- EventSamplings (muestreo de eventos)
- MeasurementProgress (progreso de mediciones)

**Todo en una transacción atómica - irreversible.**

## 🧪 Testing

Para probar esta funcionalidad:

```bash
# 1. Como DEV, invitar a un nuevo OWNER
# 2. Como nuevo usuario, aceptar invitación
# 3. Como OWNER, crear estudiantes, sesiones, datos
# 4. Como DEV, ir a Settings
# 5. Verificar que el OWNER aparece en "Miembros activos"
# 6. Remover al OWNER (confirmar la acción)
# 7. Como OWNER, intentar iniciar sesión → sin acceso
# 8. Verificar BD: organización del OWNER debe estar eliminada
```

## ⚙️ Sin Cambios en Schema

- ✅ No requiere migraciones
- ✅ Usa CASCADE de Prisma existente
- ✅ Compatible con el sistema actual de permisos

## 🔒 Seguridad

- Solo **DEV** puede eliminar completamente a un OWNER
- Los **OWNER** NO pueden remover a otros OWNER
- Operación **atómica** (todo o nada)
- **Irreversible** (sin recuperación)

## 📚 Documentación Completa

Ver: `MEMBRESÍA_DUAL_OWNER.md` para detalles técnicos completos.
