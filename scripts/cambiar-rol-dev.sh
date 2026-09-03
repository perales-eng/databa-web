#!/bin/bash

# Script para cambiar el rol de perales@gmail.com a DEV
# Uso: ./scripts/cambiar-rol-dev.sh

echo "🔄 Cambiando rol de perales@gmail.com a DEV..."
echo ""

# Ejecutar el UPDATE en PostgreSQL
docker exec -it databa-postgres psql -U databa -d databa_dev <<EOF
-- Mostrar estado actual
\echo '📊 Estado ANTES del cambio:'
SELECT 
  m.role as "Rol Actual",
  u.email as "Email",
  o.name as "Organización"
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';

\echo ''
\echo '🔄 Cambiando rol...'

-- Cambiar el rol
UPDATE "Membership" 
SET role = 'DEV' 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'perales@gmail.com');

\echo ''
\echo '✅ Estado DESPUÉS del cambio:'

-- Verificar el cambio
SELECT 
  m.role as "Rol Nuevo",
  u.email as "Email",
  o.name as "Organización"
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'perales@gmail.com';
EOF

echo ""
echo "✅ Proceso completado!"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Reiniciar el servidor: npm run dev"
echo "   2. Ir a http://localhost:3001"
echo "   3. Login con perales@gmail.com"
echo "   4. Ir a /settings y verificar que tu rol es 'Desarrollador'"
echo ""
