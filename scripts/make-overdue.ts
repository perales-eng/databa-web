import { db } from "@/lib/db";

async function main() {
  const org = await db.organization.findFirst({ where: { name: "Clínica Demo" } });
  if (!org) throw new Error("no org");
  const student = await db.student.findFirst({ where: { organizationId: org.id } });
  if (!student) throw new Error("no student");
  const yesterday23 = new Date();
  yesterday23.setDate(yesterday23.getDate() - 1);
  yesterday23.setHours(23, 0, 0, 0);
  const s = await db.therapySession.create({
    data: {
      organizationId: org.id,
      studentId: student.id,
      title: "Sesión vencida de prueba",
      sessionDate: yesterday23,
      durationMin: 60,
      status: "IN_PROGRESS",
      sessionType: "IMMEDIATE",
    },
  });
  console.log("Created session id:", s.id);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
