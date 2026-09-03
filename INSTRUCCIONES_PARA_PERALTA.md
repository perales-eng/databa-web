# 🎯 Instrucciones para Cambiar tu Rol a DEV

## ✅ Todo el Código Ya Está Implementado

He completado la implementación del rol **DEV** con jerarquía de permisos. Ahora solo necesitás **cambiar tu rol en la base de datos**.

---

## 🚀 Opción 1: Usar el Script Automático (MÁS FÁCIL)

### Pasos:

1. **Asegurate que el servidor esté corriendo:**
   ```bash
   # En una terminal, verificar que el contenedor de PostgreSQL esté corriendo
   docker ps | grep databa-postgres
   ```

2. **Ejecutar el script:**
   ```bash
   cd /Users/papa-mac/Projects/localmac/databa-web
   ./scripts/cambiar-rol-dev.sh
   ```

3. **Listo!** El script:
   - Muestra tu rol actual
   - Cambia el rol a DEV
   - Verifica el cambio
   - Te muestra los próximos pasos

---

## 🔧 Opción 2: Manualmente con SQL (Si preferís hacerlo vos)

### Conectarse a PostgreSQL:
```bash
docker exec -it databa-postgres psql -U databa -d databa_dev
```

### Ver tu rol actual:
```sql
SELECT 
  m.role,
  u.email,
  o.name as organization
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';
```

### Cambiar el rol a DEV:
```sql
UPDATE "Membership" 
SET role = 'DEV' 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');
```

### Verificar el cambio:
```sql
SELECT 
  m.role,
  u.email,
  o.name
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';
```

### Salir de PostgreSQL:
```sql
\q
```

---

## 🔍 Verificar que Funciona

1. **Iniciar el servidor (si no está corriendo):**
   ```bash
   cd /Users/papa-mac/Projects/localmac/databa-web
   npm run dev
   ```

2. **Abrir el navegador:**
   ```
   http://localhost:3001
   ```

3. **Login con:** `perales@gmail.com`

4. **Ir a:** `/settings`

5. **Verificar que:**
   - ✅ Tu rol dice **"Desarrollador"**
   - ✅ En "Generar invitación" solo aparece la opción **"Propietario"**
   - ✅ Podés cambiar roles de todos los miembros (verás todas las opciones: Desarrollador, Propietario, Administrador, Terapeuta)

---

## 🎯 Qué Hace el Rol DEV

Como **DEV** tenés **todos los permisos**:

### ✅ Permisos de DEV:
- ✅ Invitar usuarios con rol **OWNER**
- ✅ Cambiar el rol de **cualquier miembro** (excepto el tuyo propio)
- ✅ Remover **cualquier miembro** (excepto a vos mismo)
- ✅ Renombrar organizaciones
- ✅ Todas las funcionalidades de OWNER, ADMIN y THERAPIST

### 🚫 Lo que NO podés hacer:
- ❌ Cambiar tu propio rol (necesitarías hacerlo desde la DB)
- ❌ Removerte a vos mismo de una organización

---

## 📊 Jerarquía Implementada

```
🔧 DEV (vos)
  └─ Puede invitar: OWNER
  └─ Puede gestionar: TODOS

👑 OWNER (propietarios de clínicas)
  └─ Puede invitar: ADMIN, THERAPIST
  └─ Puede gestionar: ADMIN, THERAPIST
  
👔 ADMIN (supervisores)
  └─ Puede invitar: THERAPIST
  └─ No puede cambiar roles
  
👨‍⚕️ THERAPIST (terapeutas)
  └─ Solo trabaja con datos
```

---

## 🐛 Si Algo Sale Mal

### El script no funciona:
1. Verificar que el contenedor de PostgreSQL esté corriendo:
   ```bash
   docker ps | grep databa-postgres
   ```

2. Si no está corriendo, iniciar:
   ```bash
   docker start databa-postgres
   ```

### No veo el rol "Desarrollador":
1. Limpiar caché del navegador: **Cmd+Shift+R** (Mac)
2. Reiniciar el servidor:
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

### Quiero revertir a OWNER:
```bash
docker exec -it databa-postgres psql -U databa -d databa_dev -c "UPDATE \"Membership\" SET role = 'OWNER' WHERE \"userId\" = (SELECT id FROM \"User\" WHERE email = 'perales@gmail.com');"
```

---

## 📁 Documentación Adicional

- **Resumen técnico completo:** `RESUMEN_IMPLEMENTACION_ROL_DEV.md`
- **Guía detallada:** `COMO_CAMBIAR_PERALTA_A_DEV.md`
- **Script SQL:** `scripts/change-peralta-to-dev.sql`
- **Script bash:** `scripts/cambiar-rol-dev.sh`

---

## ✅ Checklist Final

Después de cambiar tu rol, verificar:

- [ ] Rol en `/settings` dice "Desarrollador"
- [ ] Al invitar, solo ves opción "Propietario"
- [ ] Podés ver/cambiar roles de todos los miembros
- [ ] Selector de roles muestra: Desarrollador, Propietario, Administrador, Terapeuta

---

## 🎉 ¡Listo!

Una vez que ejecutes uno de los métodos, tu rol será **DEV** y tendrás control total sobre el sistema.

**Recordá:** Solo debe haber **UN** usuario DEV en el sistema (vos). Los demás usuarios deben ser OWNER de sus propias clínicas.
