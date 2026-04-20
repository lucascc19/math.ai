import { Role } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { revokeAllUserSessions } from "@/lib/server/auth";
import { NotFoundError, requireActor } from "@/lib/server/permissions";
import type { SetRoleInput, TutorLinkInput } from "@/lib/schemas";

const prismaDb = prisma as any;

export async function setUserRole(userId: string, input: SetRoleInput) {
  const actor = await requireActor("user.role.set");

  if (actor.id === userId && input.role !== Role.ADMIN) {
    throw new Error("Admin nao pode se auto-rebaixar.");
  }

  const user = await prismaDb.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuario nao encontrado.");

  return prismaDb.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: { id: true, name: true, email: true, role: true, active: true }
  });
}

export async function setUserActive(userId: string, active: boolean) {
  const actor = await requireActor("user.deactivate");

  if (actor.id === userId && !active) {
    throw new Error("Admin nao pode desativar a propria conta.");
  }

  const user = await prismaDb.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuario nao encontrado.");

  const updated = await prismaDb.user.update({
    where: { id: userId },
    data: { active },
    select: { id: true, name: true, email: true, role: true, active: true }
  });

  if (!active) {
    await revokeAllUserSessions(userId);
  }

  return updated;
}

export async function linkTutorToStudent(input: TutorLinkInput) {
  await requireActor("tutorLink.manage");

  const [tutor, student] = await Promise.all([
    prismaDb.user.findUnique({ where: { id: input.tutorId } }),
    prismaDb.user.findUnique({ where: { id: input.studentId } })
  ]);

  if (!tutor || tutor.role !== Role.TUTOR) throw new Error("Tutor invalido.");
  if (!student || student.role !== Role.STUDENT) throw new Error("Aluno invalido.");

  return prismaDb.tutorStudent.upsert({
    where: { tutorId_studentId: { tutorId: input.tutorId, studentId: input.studentId } },
    update: {},
    create: input,
    select: { id: true, tutorId: true, studentId: true, createdAt: true }
  });
}

export async function unlinkTutorFromStudent(input: TutorLinkInput) {
  await requireActor("tutorLink.manage");

  await prismaDb.tutorStudent.deleteMany({
    where: { tutorId: input.tutorId, studentId: input.studentId }
  });

  return { ok: true };
}

export async function listUsers(params: { role?: Role; active?: boolean } = {}) {
  await requireActor("user.edit");

  return prismaDb.user.findMany({
    where: {
      ...(params.role ? { role: params.role } : {}),
      ...(params.active !== undefined ? { active: params.active } : {})
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function listTutorLinks() {
  await requireActor("tutorLink.manage");

  return prismaDb.tutorStudent.findMany({
    select: {
      id: true,
      createdAt: true,
      tutor: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}
