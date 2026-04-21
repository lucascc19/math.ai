import { Role } from "@prisma/client";

import { assertCanViewStudent, requireActor } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

const prismaDb = prisma as any;

export async function listStudentsForActor() {
  const actor = await requireActor("student.list");

  if (actor.role === Role.ADMIN) {
    return prismaDb.user.findMany({
      where: { role: Role.STUDENT },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
      orderBy: { name: "asc" }
    });
  }

  const links = await prismaDb.tutorStudent.findMany({
    where: { tutorId: actor.id },
    select: {
      student: {
        select: { id: true, name: true, email: true, active: true, createdAt: true }
      }
    }
  });

  return links.map((link: any) => link.student);
}

export async function getStudentProgress(studentId: string) {
  const actor = await requireActor("student.view");
  await assertCanViewStudent(actor, studentId);

  const progress = await prismaDb.trackProgress.findMany({
    where: { userId: studentId },
    include: {
      skillTrack: { select: { id: true, slug: true, name: true } }
    },
    orderBy: { skillTrack: { name: "asc" } }
  });

  const [attemptsCount, correctCount] = await Promise.all([
    prismaDb.attempt.count({ where: { userId: studentId } }),
    prismaDb.attempt.count({ where: { userId: studentId, isCorrect: true } })
  ]);

  return {
    studentId,
    progress,
    totals: { attempts: attemptsCount, correct: correctCount }
  };
}

export async function getTutorMetrics() {
  const actor = await requireActor("metrics.view.scoped");

  if (actor.role === Role.ADMIN) {
    const [students, attempts, correct] = await Promise.all([
      prismaDb.user.count({ where: { role: Role.STUDENT, active: true } }),
      prismaDb.attempt.count(),
      prismaDb.attempt.count({ where: { isCorrect: true } })
    ]);
    return { scope: "global" as const, studentsTracked: students, attempts, correct };
  }

  const links = await prismaDb.tutorStudent.findMany({
    where: { tutorId: actor.id },
    select: { studentId: true }
  });
  const studentIds = links.map((link: any) => link.studentId);

  if (studentIds.length === 0) {
    return { scope: "tutor" as const, studentsTracked: 0, attempts: 0, correct: 0 };
  }

  const [attempts, correct] = await Promise.all([
    prismaDb.attempt.count({ where: { userId: { in: studentIds } } }),
    prismaDb.attempt.count({ where: { userId: { in: studentIds }, isCorrect: true } })
  ]);

  return {
    scope: "tutor" as const,
    studentsTracked: studentIds.length,
    attempts,
    correct
  };
}
