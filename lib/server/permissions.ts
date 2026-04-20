import { Role, ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/auth";

const prismaDb = prisma as any;

export type Action =
  | "lesson.attempt"
  | "profile.edit.self"
  | "student.view"
  | "student.list"
  | "metrics.view.scoped"
  | "metrics.view.global"
  | "lesson.draft.create"
  | "lesson.draft.edit"
  | "lesson.publish"
  | "lesson.unpublish"
  | "lesson.reorder"
  | "lesson.delete"
  | "track.draft.create"
  | "track.draft.edit"
  | "track.publish"
  | "track.unpublish"
  | "track.delete"
  | "user.create.tutor"
  | "user.role.set"
  | "user.deactivate"
  | "user.edit"
  | "tutorLink.manage"
  | "invite.create.admin"
  | "invite.create.tutor"
  | "invite.create.student"
  | "invite.list"
  | "invite.revoke"
  | "invite.resend"
  | "invite.cleanup"
  | "invite.delete";

const rolePermissions: Record<Role, ReadonlySet<Action>> = {
  STUDENT: new Set<Action>(["lesson.attempt", "profile.edit.self"]),
  TUTOR: new Set<Action>([
    "lesson.attempt",
    "profile.edit.self",
    "student.view",
    "student.list",
    "metrics.view.scoped",
    "lesson.draft.create",
    "lesson.draft.edit",
    "track.draft.create",
    "track.draft.edit",
    "invite.create.student",
    "invite.list",
    "invite.revoke",
    "invite.resend",
    "invite.cleanup",
    "invite.delete"
  ]),
  ADMIN: new Set<Action>([
    "lesson.attempt",
    "profile.edit.self",
    "student.view",
    "student.list",
    "metrics.view.scoped",
    "metrics.view.global",
    "lesson.draft.create",
    "lesson.draft.edit",
    "lesson.publish",
    "lesson.unpublish",
    "lesson.reorder",
    "lesson.delete",
    "track.draft.create",
    "track.draft.edit",
    "track.publish",
    "track.unpublish",
    "track.delete",
    "user.create.tutor",
    "user.role.set",
    "user.deactivate",
    "user.edit",
    "tutorLink.manage",
    "invite.create.admin",
    "invite.create.tutor",
    "invite.create.student",
    "invite.list",
    "invite.revoke",
    "invite.resend",
    "invite.cleanup",
    "invite.delete"
  ])
};

export class ForbiddenError extends Error {
  readonly status = 403 as const;
  constructor(message = "Acesso negado.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404 as const;
  constructor(message = "Recurso não encontrado.") {
    super(message);
    this.name = "NotFoundError";
  }
}

type SessionUser = { id: string; role: Role; active?: boolean };

export function can(user: SessionUser, action: Action): boolean {
  if (user.active === false) return false;
  return rolePermissions[user.role]?.has(action) ?? false;
}

export function requirePermission(user: SessionUser, action: Action) {
  if (!can(user, action)) {
    throw new ForbiddenError();
  }
}

export async function requireActor(action?: Action) {
  const user = await requireCurrentUser();

  if (user.active === false) {
    throw new ForbiddenError("Conta desativada.");
  }

  if (action) requirePermission(user as SessionUser, action);
  return user as SessionUser & { name: string; email: string };
}

export async function isTutorOfStudent(tutorId: string, studentId: string): Promise<boolean> {
  const link = await prismaDb.tutorStudent.findUnique({
    where: { tutorId_studentId: { tutorId, studentId } }
  });
  return Boolean(link);
}

export async function assertCanViewStudent(actor: SessionUser, studentId: string) {
  if (actor.role === "ADMIN") return;
  if (actor.id === studentId) return;
  if (actor.role === "TUTOR" && (await isTutorOfStudent(actor.id, studentId))) return;
  throw new ForbiddenError();
}

export async function assertCanEditLesson(actor: SessionUser, lessonId: string) {
  const lesson = await prismaDb.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new NotFoundError("Lição não encontrada.");

  if (actor.role === "ADMIN") return lesson;
  if (actor.role === "TUTOR" && lesson.status === ContentStatus.DRAFT) return lesson;
  throw new ForbiddenError();
}

export async function assertCanEditTrack(actor: SessionUser, trackId: string) {
  const track = await prismaDb.skillTrack.findUnique({ where: { id: trackId } });
  if (!track) throw new NotFoundError("Trilha não encontrada.");

  if (actor.role === "ADMIN") return track;
  if (actor.role === "TUTOR" && track.status === ContentStatus.DRAFT) return track;
  throw new ForbiddenError();
}
