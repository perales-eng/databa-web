import { PrismaClient, MeasurementMethodType, SamplingType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(10, 0, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Wipe demo data idempotently.
  const existing = await db.user.findUnique({ where: { email: "demo@databa.app" } });
  if (existing) await db.user.delete({ where: { id: existing.id } });
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

  const mateo = await db.student.create({
    data: {
      organizationId: org.id,
      name: "Mateo G.",
      color: "#0F766E",
      notes: "Niño de 8 años, TEA nivel 1. Le motivan los autos.",
    },
  });
  const sofia = await db.student.create({
    data: {
      organizationId: org.id,
      name: "Sofía R.",
      color: "#7C3AED",
      notes: "Niña de 6 años. Trabaja con reforzadores comestibles.",
    },
  });

  // Catálogo de conductas reusables
  const [disruptiva, atencion, peticion] = await Promise.all([
    db.behavior.create({
      data: {
        organizationId: org.id,
        name: "Conducta disruptiva",
        description: "Vocalizaciones fuera de turno o golpes a la mesa.",
      },
    }),
    db.behavior.create({
      data: {
        organizationId: org.id,
        name: "Atención sostenida",
        description: "Mantener la mirada/postura orientada a la tarea.",
      },
    }),
    db.behavior.create({
      data: {
        organizationId: org.id,
        name: "Petición funcional",
        description: "Solicita objetos/acciones de manera apropiada.",
      },
    }),
  ]);

  // Los 9 métodos de medición distribuidos entre los dos estudiantes.
  const methods = await Promise.all([
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: mateo.id,
        behaviorId: disruptiva.id,
        behaviorName: disruptiva.name,
        methodType: MeasurementMethodType.FREQUENCY,
        config: { saveFrequency: true, saveTotalOccurrences: true, saveIRT: true },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: mateo.id,
        behaviorId: atencion.id,
        behaviorName: atencion.name,
        methodType: MeasurementMethodType.DURATION,
        config: { saveIndividualDurations: true, saveAverageDuration: true },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: mateo.id,
        behaviorId: peticion.id,
        behaviorName: peticion.name,
        methodType: MeasurementMethodType.LATENCY,
        config: { maxTimeSeconds: 30, saveIndividualTimes: true, saveAverageTime: true },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: mateo.id,
        behaviorId: disruptiva.id,
        behaviorName: disruptiva.name,
        methodType: MeasurementMethodType.INTENSITY,
        config: {
          maxMeasurements: null,
          scaleMin: 1,
          scaleMax: 5,
          saveIndividualValues: true,
          saveAverage: true,
        },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: sofia.id,
        behaviorId: peticion.id,
        behaviorName: peticion.name,
        methodType: MeasurementMethodType.PERCENTAGE_OPPORTUNITY,
        config: {
          maxOpportunities: 10,
          maxTimeMinutes: null,
          opportunityDescription: "Mostrar dos objetos y preguntar '¿cuál querés?'",
          correctResponseDescription: "Señala o nombra el objeto deseado en <5s",
          saveOpportunityDetails: true,
        },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: sofia.id,
        behaviorId: atencion.id,
        behaviorName: atencion.name,
        methodType: MeasurementMethodType.TEMPORAL_SAMPLING,
        config: {
          samplingType: "MOMENTARY",
          intervalDurationSeconds: 30,
          totalDurationSeconds: 600,
          saveIntervalDetails: true,
          saveSummary: true,
        },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: sofia.id,
        behaviorId: disruptiva.id,
        behaviorName: disruptiva.name,
        methodType: MeasurementMethodType.EVENT_SAMPLING,
        config: {
          sessionDurationMinutes: 30,
          intensityScale: 5,
          dataSaveType: "BOTH",
        },
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: sofia.id,
        behaviorId: disruptiva.id,
        behaviorName: disruptiva.name,
        methodType: MeasurementMethodType.ANECDOTAL,
        config: {},
      },
    }),
    db.behaviorMethod.create({
      data: {
        organizationId: org.id,
        studentId: mateo.id,
        behaviorId: disruptiva.id,
        behaviorName: disruptiva.name,
        methodType: MeasurementMethodType.ABC,
        config: {},
      },
    }),
  ]);

  const [freqMethod, durMethod, , intMethod, oppMethod, tempMethod] = methods;

  // Una sesión por estudiante con varios registros distribuidos en el tiempo.
  const mateoSession = await db.therapySession.create({
    data: {
      organizationId: org.id,
      studentId: mateo.id,
      title: "Sesión de seguimiento",
      sessionDate: daysAgo(1),
      status: "COMPLETED",
    },
  });
  const sofiaSession = await db.therapySession.create({
    data: {
      organizationId: org.id,
      studentId: sofia.id,
      title: "Sesión inicial",
      sessionDate: daysAgo(1),
      status: "COMPLETED",
    },
  });

  // Resultados de frequency / duration / intensity (Mateo) — varias fechas.
  for (let i = 7; i >= 0; i--) {
    await db.measurementResult.create({
      data: {
        organizationId: org.id,
        behaviorMethodId: freqMethod.id,
        sessionId: mateoSession.id,
        methodType: "FREQUENCY",
        behaviorName: disruptiva.name,
        resultValue: String(10 - i + Math.floor(Math.random() * 3)),
        resultUnit: "occurrences",
        sessionDurationSec: 600,
        measurementDate: daysAgo(i),
        rawData: { rate: (10 - i) / 10, irt: 60 },
      },
    });
    await db.measurementResult.create({
      data: {
        organizationId: org.id,
        behaviorMethodId: durMethod.id,
        sessionId: mateoSession.id,
        methodType: "DURATION",
        behaviorName: atencion.name,
        resultValue: String(30 + i * 5),
        resultUnit: "seconds",
        sessionDurationSec: 600,
        measurementDate: daysAgo(i),
      },
    });
    await db.measurementResult.create({
      data: {
        organizationId: org.id,
        behaviorMethodId: intMethod.id,
        sessionId: mateoSession.id,
        methodType: "INTENSITY",
        behaviorName: disruptiva.name,
        resultValue: ((5 - i * 0.4) % 6).toFixed(1),
        resultUnit: "scale_1_5",
        sessionDurationSec: 600,
        measurementDate: daysAgo(i),
      },
    });
  }

  // Oportunidades (Sofía).
  for (let i = 5; i >= 0; i--) {
    const total = 10;
    const successful = Math.min(total, 5 + (5 - i));
    await db.opportunityResult.create({
      data: {
        organizationId: org.id,
        behaviorMethodId: oppMethod.id,
        sessionId: sofiaSession.id,
        studentId: sofia.id,
        totalOpportunities: total,
        successfulOpportunities: successful,
        successPercentage: (successful / total) * 100,
        opportunityDetails: Array.from({ length: total }, (_, j) => ({
          timestamp: Date.now() - j * 30_000,
          status: j < successful ? "SUCCESS" : "FAILURE",
        })),
        endCondition: "OPPORTUNITY_LIMIT",
        measurementDate: daysAgo(i),
      },
    });
  }

  // Muestreo temporal (Sofía).
  for (let i = 4; i >= 0; i--) {
    const total = 20;
    const marked = 10 + (4 - i);
    await db.temporalSamplingResult.create({
      data: {
        organizationId: org.id,
        behaviorMethodId: tempMethod.id,
        sessionId: sofiaSession.id,
        studentId: sofia.id,
        samplingType: SamplingType.MOMENTARY,
        intervalDurationSec: 30,
        totalDurationSec: 600,
        totalIntervals: total,
        markedIntervals: marked,
        markedPercentage: (marked / total) * 100,
        intervalDetails: Array.from({ length: total }, (_, j) => ({
          index: j,
          startSec: j * 30,
          marked: j < marked,
        })),
        measurementDate: daysAgo(i),
      },
    });
  }

  // ABC + Anecdotal de Mateo.
  await db.aBCRecord.create({
    data: {
      organizationId: org.id,
      studentId: mateo.id,
      sessionId: mateoSession.id,
      behaviorName: disruptiva.name,
      occurredAt: daysAgo(1),
      antecedentDescription: "Se le pidió guardar los autos antes de salir al recreo.",
      behaviorDescription: "Tiró los autos al piso y gritó.",
      consequenceDescription: "Se postergó el recreo y se trabajó la transición en pasos cortos.",
    },
  });

  await db.anecdotalRecord.create({
    data: {
      organizationId: org.id,
      studentId: mateo.id,
      sessionId: mateoSession.id,
      behaviorName: disruptiva.name,
      recordDate: daysAgo(1),
      title: "Transición a recreo",
      description:
        "Mateo se mostró colaborador toda la tarde excepto durante la transición a recreo. " +
        "Funcionó la estrategia de adelantar la consigna y ofrecer un objeto preferido.",
    },
  });

  console.log("✓ Seed completo:");
  console.log("  Login: demo@databa.app / demo1234");
  console.log(`  Org: ${org.name}`);
  console.log(`  Estudiantes: ${mateo.name}, ${sofia.name}`);
  console.log(`  Métodos: ${methods.length} (cubre los 9 tipos)`);
  console.log(`  Datos: 24 mediciones, 6 oportunidades, 5 muestreos, 1 ABC, 1 anecdótico`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
