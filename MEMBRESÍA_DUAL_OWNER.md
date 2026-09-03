# Membresía Dual para OWNERs Invitados por DEV

## 🎯 Problema Resuelto

Cuando un DEV invitaba a un OWNER y este aceptaba la invitación:
- ✅ Se creaba una nueva organización para el OWNER (correcto)
- ❌ El OWNER **NO** aparecía en la lista de miembros del DEV
- ❌ El DEV no podía remover o gestionar al OWNER invitado

## ✨ Solución Implementada

Ahora, cuando un OWNER acepta una invitación de un DEV:

1. **Se crea su propia organización** (como antes)
   - El OWNER es propietario de su nueva org
   - Puede gestionar sus estudiantes, sesiones, etc.

2. **También se une a la organización del DEV** (NUEVO)
   - Aparece en la lista de "Miembros activos" del DEV
   - El DEV puede ver y gestionar al OWNER
   - El DEV puede remover al OWNER si es necesario

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

## 📋 Comportamiento

### Para el DEV

1. **Invitar**: DEV puede invitar a OWNER
2. **Ver**: El OWNER aparece en "Miembros activos" después de aceptar
3. **Gestionar**: DEV puede cambiar el rol del OWNER (a ADMIN, THERAPIST)
4. **Remover**: DEV puede remover al OWNER de su organización

### Para el OWNER invitado

1. **Acepta invitación**: Se crea su propia organización
2. **Tiene 2 organizaciones**:
   - Su propia clínica (control total)
   - La organización del DEV (puede ver pero no gestionar)
3. **Puede cambiar de organización**: Usando el selector de org en el dashboard
4. **Si el DEV lo remueve**: Solo pierde acceso a la org del DEV, NO a su propia org

## ⚠️ Consideraciones

### Permisos del OWNER en la org del DEV

Un OWNER en la organización del DEV:
- ✅ Puede ver los miembros
- ✅ Puede invitar ADMIN/THERAPIST (según reglas de rol OWNER)
- ❌ NO puede remover al DEV
- ❌ NO puede remover a otros OWNER

### Remoción

Cuando el DEV remueve a un OWNER:
```typescript
// Solo elimina la membresía en la org del DEV
await db.membership.delete({ where: { id: membershipId } });

// La organización propia del OWNER sigue intacta
```

## 🧪 Testing Manual

1. **Como DEV**: Invitar a un nuevo usuario con rol OWNER
2. **Como OWNER**: Aceptar la invitación → debe crear org propia
3. **Como DEV**: Ir a Settings → debe ver al OWNER en "Miembros activos"
4. **Como DEV**: Probar remover al OWNER → debe funcionar
5. **Como OWNER**: Después de ser removido, aún debe tener acceso a su propia org

## 📝 Notas

- El schema de la BD NO requiere cambios
- Usa la estructura existente de `Membership`
- Compatible con el sistema actual de permisos jerárquicos
- El OWNER siempre aterriza en su propia organización después de aceptar la invitación
