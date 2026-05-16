import { PrismaClient, MeasurementMethodType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Wipe demo data idempotently
  const existing = await db.user.findUnique({ where: { email: "demo@databa.app" } });
  if (existing) {
    await db.user.delete({ where: { id: existing.id } });
  }
  await db.organization.deleteMany({ where: { slug: "demo-clinic" } });

  const org = await db.organization.create({
    data: { name: "Clínica Demo", slug: "demo-clinic" },
  });

  await db.user.create({
    data: {
      email: "demo@databa.app",
      name: "Terapeuta Demo",
      passwordHash,
      memberships: { create: { organizationId: org.id, role: "OWNER" } },
    },
  });

  const student1 = await db.student.create({
    data: { organizationId: org.id, name: "Mateo G.", color: "#0F766E" },
  });
  const student2 = await db.student.create({
    data: { organizationId: org.id, name: "Sofía R.", color: "#7C3AED" },
  });

  const behavior = await db.behavior.create({
    data: {
      organizationId: org.id,
      name: "Conducta disruptiva",
      description: "Vocalizaciones fuera de turno o golpes a la mesa.",
    },
  });

  await db.behaviorMethod.create({
    data: {
      organizationId: org.id,
      studentId: student1.id,
      behaviorId: behavior.id,
      behaviorName: behavior.name,
      methodType: MeasurementMethodType.FREQUENCY,
      config: { saveFrequency: true, saveTotalOccurrences: true, saveIRT: true },
    },
  });

  await db.behaviorMethod.create({
    data: {
      organizationId: org.id,
      studentId: student1.id,
      behaviorId: behavior.id,
      behaviorName: behavior.name,
      methodType: MeasurementMethodType.DURATION,
      config: { saveIndividualDurations: true, saveAverageDuration: true },
    },
  });

  await db.behaviorMethod.create({
    data: {
      organizationId: org.id,
      studentId: student2.id,
      behaviorName: "Atención sostenida en tarea",
      methodType: MeasurementMethodType.TEMPORAL_SAMPLING,
      config: {
        samplingType: "MOMENTARY",
        intervalDurationSeconds: 30,
        totalDurationSeconds: 600,
        saveIntervalDetails: true,
        saveSummary: true,
      },
    },
  });

  console.log("✓ Seed completo:");
  console.log("  Login: demo@databa.app / demo1234");
  console.log(`  Org: ${org.name}, 2 estudiantes, 3 behavior methods`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
