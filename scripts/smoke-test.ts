/**
 * Smoke test programático para Fase 2:
 * - Crea estudiante de prueba con un cliente Prisma directo
 * - Crea una sesión asociada
 * - Lista estudiantes y verifica conteos
 * - Soft-deletes y verifica filtros
 *
 * Usa la org "demo-clinic" del seed.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.findUnique({ where: { slug: "demo-clinic" } });
  if (!org) throw new Error("Seed no aplicado — corré `npm run db:seed` primero.");

  // 1. Crear estudiante de prueba
  const student = await db.student.create({
    data: {
      organizationId: org.id,
      name: "Smoke Test Student",
      color: "#FF5733",
    },
  });
  console.log("✓ Crear estudiante:", student.id);

  // 2. Crear sesión
  const session = await db.therapySession.create({
    data: {
      organizationId: org.id,
      studentId: student.id,
      title: "Sesión smoke test",
      sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMin: 45,
    },
  });
  console.log("✓ Crear sesión:", session.id);

  // 3. Verificar listado (con filtro soft-delete y conteos)
  const list = await db.student.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      _count: {
        select: { therapySessions: { where: { deletedAt: null } }, behaviorMethods: { where: { deletedAt: null } } },
      },
    },
  });
  const found = list.find((s) => s.id === student.id);
  if (!found) throw new Error("Estudiante no aparece en el listado");
  if (found._count.therapySessions !== 1) {
    throw new Error(`Conteo de sesiones esperado 1, recibido ${found._count.therapySessions}`);
  }
  console.log(`✓ Listado: ${list.length} estudiantes, smoke student tiene ${found._count.therapySessions} sesión`);

  // 4. Buscar por nombre (insensitive)
  const search = await db.student.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      name: { contains: "smoke", mode: "insensitive" },
    },
  });
  if (search.length !== 1) throw new Error(`Búsqueda esperaba 1 resultado, recibió ${search.length}`);
  console.log("✓ Búsqueda case-insensitive funciona");

  // 5. Soft-delete sesión
  await db.therapySession.update({ where: { id: session.id }, data: { deletedAt: new Date() } });
  const afterDeleteSession = await db.student.findFirst({
    where: { id: student.id },
    include: {
      _count: { select: { therapySessions: { where: { deletedAt: null } } } },
    },
  });
  if (afterDeleteSession?._count.therapySessions !== 0) {
    throw new Error("Soft-delete de sesión no funcionó");
  }
  console.log("✓ Soft-delete de sesión filtra correctamente");

  // 6. Soft-delete estudiante
  await db.student.update({ where: { id: student.id }, data: { deletedAt: new Date() } });
  const afterDeleteStudent = await db.student.findMany({
    where: { organizationId: org.id, deletedAt: null, name: { contains: "smoke", mode: "insensitive" } },
  });
  if (afterDeleteStudent.length !== 0) throw new Error("Soft-delete de estudiante no funcionó");
  console.log("✓ Soft-delete de estudiante filtra correctamente");

  // 7. Sesiones en rango (calendario)
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const inRange = await db.therapySession.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      sessionDate: { gte: from, lte: to },
    },
    include: { student: { select: { id: true, name: true, color: true } } },
  });
  console.log(`✓ Sesiones en rango ±60d: ${inRange.length}`);

  // 8. Cleanup (hard delete del smoke test student)
  await db.therapySession.deleteMany({ where: { studentId: student.id } });
  await db.student.delete({ where: { id: student.id } });
  console.log("✓ Cleanup OK");

  console.log("\n🎉 Smoke test Fase 2: TODO PASA");
}

main()
  .catch((err) => {
    console.error("❌ Smoke test falló:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
