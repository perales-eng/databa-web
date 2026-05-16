import { db } from "@/lib/db";

export async function listStudents(organizationId: string, opts?: { search?: string; sort?: string }) {
  const search = opts?.search?.trim();
  const sort = opts?.sort ?? "name_asc";

  const orderBy = (() => {
    switch (sort) {
      case "name_desc":
        return { name: "desc" as const };
      case "created_desc":
        return { createdAt: "desc" as const };
      case "created_asc":
        return { createdAt: "asc" as const };
      default:
        return { name: "asc" as const };
    }
  })();

  return db.student.findMany({
    where: {
      organizationId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    orderBy,
    include: {
      _count: {
        select: {
          behaviorMethods: { where: { deletedAt: null } },
          therapySessions: { where: { deletedAt: null } },
          abcRecords: true,
          anecdotalRecords: true,
        },
      },
    },
  });
}

export async function getStudent(organizationId: string, id: string) {
  return db.student.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      behaviorMethods: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      therapySessions: {
        where: { deletedAt: null },
        orderBy: { sessionDate: "desc" },
        take: 10,
      },
      _count: {
        select: {
          therapySessions: { where: { deletedAt: null } },
          behaviorMethods: { where: { deletedAt: null } },
          abcRecords: true,
          anecdotalRecords: true,
        },
      },
    },
  });
}

export async function listSessionsForStudent(organizationId: string, studentId: string) {
  return db.therapySession.findMany({
    where: { organizationId, studentId, deletedAt: null },
    orderBy: { sessionDate: "desc" },
  });
}

export async function getSession(organizationId: string, id: string) {
  return db.therapySession.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      student: true,
      _count: { select: { results: true } },
    },
  });
}

export async function listSessionsInRange(organizationId: string, from: Date, to: Date) {
  return db.therapySession.findMany({
    where: {
      organizationId,
      deletedAt: null,
      sessionDate: { gte: from, lte: to },
    },
    include: { student: { select: { id: true, name: true, color: true } } },
    orderBy: { sessionDate: "asc" },
  });
}
