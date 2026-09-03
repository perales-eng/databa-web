# Cómo Cambiar el Rol de Peralta de OWNER a DEV

## ✅ Implementación Completada

Se agregó el rol **DEV** al sistema con permisos jerárquicos:

### 📊 Jerarquía de Permisos:

```
🔧 DEV (Super Admin)
  └─ Puede invitar solo a: OWNER
  └─ Puede cambiar roles de: TODOS
  └─ Puede remover a: TODOS
  └─ Puede hacer: TODO

👑 OWNER (Propietario)
  └─ Puede invitar a: ADMIN, THERAPIST
  └─ Puede cambiar roles de: ADMIN, THERAPIST
  └─ Puede remover a: ADMIN, THERAPIST
  
👔 ADMIN (Administrador)
  └─ Puede invitar a: THERAPIST
  └─ No puede cambiar roles
  └─ No puede remover miembros
  
👨‍⚕️ THERAPIST (Terapeuta)
  └─ No puede invitar
  └─ Solo trabaja con datos
```

---

## 🔄 Pasos para Cambiar Peralta a DEV

### Opción 1: Usando Prisma Studio (Recomendado - Visual)

1. **Abrir Prisma Studio:**
   ```bash
   cd /Users/papa-mac/Projects/localmac/databa-web
   npx prisma studio
   ```

2. **Navegar a la tabla `Membership`**

3. **Buscar el registro donde:**
   - `organizationId` = ID de "Clínica Demo" o "Mi consu"
   - `userId` = ID del usuario `perales@gmail.com`

4. **Cambiar el campo `role`:**
   - De: `OWNER`
   - A: `DEV`

5. **Guardar** (botón "Save 1 change")

6. **Cerrar Prisma Studio** (Ctrl+C en la terminal)

---

### Opción 2: Usando SQL Directo (Rápido)

1. **Conectarse a PostgreSQL:**
   ```bash
   docker exec -it databa-postgres psql -U databa -d databa_dev
   ```

2. **Encontrar tu membership ID:**
   ```sql
   SELECT 
     m.id as membership_id,
     m.role,
     u.email,
     o.name as organization
   FROM "Membership" m
   JOIN "User" u ON m."userId" = u.id
   JOIN "Organization" o ON m."organizationId" = o.id
   WHERE u.email = 'perales@gmail.com';
   ```

3. **Actualizar el rol a DEV:**
   ```sql
   UPDATE "Membership" 
   SET role = 'DEV' 
   WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');
   ```

4. **Verificar el cambio:**
   ```sql
   SELECT 
     m.id,
     m.role,
     u.email,
     o.name
   FROM "Membership" m
   JOIN "User" u ON m."userId" = u.id
   JOIN "Organization" o ON m."organizationId" = o.id
   WHERE u.email = 'perales@gmail.com';
   ```

5. **Salir de PostgreSQL:**
   ```sql
   \q
   ```

---

## ✅ Verificar que Funciona

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Ir a:** http://localhost:3001

3. **Login con:** `perales@gmail.com`

4. **Ir a:** `/settings`

5. **Verificar que:**
   - Tu rol aparece como **"Desarrollador"**
   - En el selector de invitación solo aparece **"Propietario"**
   - Podés ver todos los roles en el dropdown de cambiar roles de miembros

---

## 🎯 Qué Cambió en el Código

### Archivos Modificados:

1. **`prisma/schema.prisma`**
   - Agregado `DEV` al enum `Role`

2. **`src/server/organizations.ts`**
   - Validación jerárquica en `inviteMember()`
   - Validación jerárquica en `changeMemberRole()`
   - Validación jerárquica en `removeMember()`
   - Validación jerárquica en `renameOrganization()`

3. **`src/app/(app)/settings/_components/invite-form.tsx`**
   - Selector dinámico de roles según rol del invitador
   - DEV solo ve "Propietario"
   - OWNER solo ve "Administrador" y "Terapeuta"
   - ADMIN solo ve "Terapeuta"

4. **`src/app/(app)/settings/_components/member-actions.tsx`**
   - Agregado "Desarrollador" al selector de roles

5. **`src/app/(app)/settings/page.tsx`**
   - Permisos actualizados para incluir DEV
   - Label "Desarrollador" agregado

6. **`.env`**
   - Agregado `DIRECT_URL` para migraciones de Prisma

---

## 🚨 Importante

- **Solo debe haber UN usuario DEV en el sistema** (vos)
- El rol DEV es para desarrolladores/administradores del sistema
- Los OWNER son propietarios de clínicas individuales
- Si necesitás cambiar otro usuario a DEV, usá el mismo proceso

---

## 📝 Commit Realizado

```
commit 6f8a27d
feat: add DEV role with hierarchical permissions

- Add DEV to Role enum in Prisma schema
- DEV can only invite OWNER
- OWNER can only invite ADMIN/THERAPIST
- ADMIN can only invite THERAPIST
- DEV can change any role, OWNER can change ADMIN/THERAPIST
- Update UI to show role options based on inviter's role
- Fix .env to include DIRECT_URL for migrations
```

---

## 🐛 Si Algo Sale Mal

Si después de cambiar el rol hay algún problema:

1. **Revertir a OWNER:**
   ```sql
   UPDATE "Membership" 
   SET role = 'OWNER' 
   WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');
   ```

2. **Revisar errores en consola del navegador**

3. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```
