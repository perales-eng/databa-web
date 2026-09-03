-- Script para cambiar el rol de perales@gmail.com de OWNER a DEV
-- Ejecutar: docker exec -it databa-postgres psql -U databa -d databa_dev -f /path/to/this/file.sql
-- O copiar y pegar en psql

BEGIN;

-- 1. Verificar estado actual
SELECT 
  m.id as membership_id,
  m.role as current_role,
  u.email,
  u.name,
  o.name as organization
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';

-- 2. Cambiar el rol a DEV
UPDATE "Membership" 
SET role = 'DEV' 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');

-- 3. Verificar el cambio
SELECT 
  m.id as membership_id,
  m.role as new_role,
  u.email,
  u.name,
  o.name as organization
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';

COMMIT;

-- Para revertir si algo sale mal, ejecutar:
-- UPDATE "Membership" SET role = 'OWNER' WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');
