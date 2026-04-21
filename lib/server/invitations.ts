import { Role } from "@prisma/client";

import type { AcceptInvitationInput, CreateInvitationInput } from "@/lib/schemas";
import { createSession, hashPassword, initializeUserData, setSessionCookie } from "@/lib/server/auth";
import { ForbiddenError, NotFoundError, requireActor, requirePermission } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { generateOpaqueToken, hashToken } from "@/lib/server/token-hash";

const prismaDb = prisma as any;
const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 3;

export class InvitationExpiredError extends Error {
  readonly status = 400 as const;
  constructor() {
    super("Este convite expirou.");
    this.name = "InvitationExpiredError";
  }
}

export class InvitationAlreadyUsedError extends Error {
  readonly status = 400 as const;
  constructor() {
    super("Este convite já foi utilizado.");
    this.name = "InvitationAlreadyUsedError";
  }
}

export class InvitationRevokedError extends Error {
  readonly status = 400 as const;
  constructor() {
    super("Este convite foi revogado.");
    this.name = "InvitationRevokedError";
  }
}

export type InvitationStatus = "pending" | "used" | "expired" | "revoked";

export function getInvitationStatus(invitation: {
  usedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): InvitationStatus {
  if (invitation.usedAt) return "used";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt <= new Date()) return "expired";
  return "pending";
}

function assertPending(invitation: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date }) {
  const status = getInvitationStatus(invitation);
  if (status === "used") throw new InvitationAlreadyUsedError();
  if (status === "revoked") throw new InvitationRevokedError();
  if (status === "expired") throw new InvitationExpiredError();
}

function assertCanManageInvitation(actor: { id: string; role: Role }, invitation: { invitedByUserId: string }) {
  if (actor.role === Role.TUTOR && invitation.invitedByUserId !== actor.id) {
    throw new ForbiddenError("Você só pode gerenciar seus próprios convites.");
  }
}

function buildInvitationPayload(input: { email: string; role: Role; invitedByUserId: string; tutorId?: string | null }) {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  return {
    token,
    expiresAt,
    data: {
      email: input.email,
      role: input.role,
      tokenHash,
      invitedByUserId: input.invitedByUserId,
      tutorId: input.tutorId ?? null,
      expiresAt
    }
  };
}

export async function createInvitation(input: CreateInvitationInput) {
  const actor = await requireActor("invite.list");
  const targetRole = input.role as Role;

  if (actor.role === Role.TUTOR) {
    if (targetRole !== Role.STUDENT) {
      throw new ForbiddenError("Tutores só podem convidar alunos.");
    }
  } else if (actor.role === Role.ADMIN) {
    const actionMap: Record<Role, "invite.create.admin" | "invite.create.tutor" | "invite.create.student"> = {
      ADMIN: "invite.create.admin",
      TUTOR: "invite.create.tutor",
      STUDENT: "invite.create.student"
    };
    requirePermission(actor, actionMap[targetRole]);
  }

  const existing = await prismaDb.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("Já existe uma conta com este e-mail.");

  const pendingInvite = await prismaDb.invitation.findFirst({
    where: {
      email: input.email,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
  if (pendingInvite) throw new Error("Já existe um convite pendente para este e-mail.");

  const tutorId = targetRole === Role.STUDENT && input.tutorId ? input.tutorId : undefined;

  if (tutorId && actor.role === Role.TUTOR && actor.id !== tutorId) {
    throw new ForbiddenError("Tutores só podem se vincular como tutor no convite.");
  }

  const invitationPayload = buildInvitationPayload({
    email: input.email,
    role: targetRole,
    invitedByUserId: actor.id,
    tutorId
  });

  await prismaDb.invitation.create({
    data: invitationPayload.data
  });

  return { token: invitationPayload.token, email: input.email, role: targetRole, expiresAt: invitationPayload.expiresAt };
}

export async function listInvitations(filters: { status?: string; role?: Role } = {}) {
  const actor = await requireActor("invite.list");
  const where: Record<string, unknown> = {};

  if (actor.role === Role.TUTOR) {
    where.invitedByUserId = actor.id;
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status === "pending") {
    where.usedAt = null;
    where.revokedAt = null;
    where.expiresAt = { gt: new Date() };
  } else if (filters.status === "used") {
    where.usedAt = { not: null };
  } else if (filters.status === "revoked") {
    where.revokedAt = { not: null };
  } else if (filters.status === "expired") {
    where.usedAt = null;
    where.revokedAt = null;
    where.expiresAt = { lte: new Date() };
  }

  const invitations = await prismaDb.invitation.findMany({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true, email: true } },
      tutor: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return invitations.map((invitation: any) => ({
    ...invitation,
    status: getInvitationStatus(invitation)
  }));
}

export async function getInvitationByToken(token: string) {
  const tokenHash = hashToken(token);
  const invitation = await prismaDb.invitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      createdAt: true,
      tutor: { select: { id: true, name: true } }
    }
  });

  if (!invitation) return null;

  return {
    ...invitation,
    status: getInvitationStatus(invitation)
  };
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const tokenHash = hashToken(input.token);
  const passwordHash = hashPassword(input.password);

  const user = await prismaDb.$transaction(async (tx: any) => {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash }
    });

    if (!invitation) throw new NotFoundError("Convite não encontrado.");

    assertPending(invitation);

    const existingUser = await tx.user.findUnique({
      where: { email: invitation.email }
    });
    if (existingUser) throw new Error("Já existe uma conta com este e-mail.");

    const newUser = await tx.user.create({
      data: {
        name: input.name,
        email: invitation.email,
        role: invitation.role,
        passwordHash
      }
    });

    await initializeUserData(newUser.id, tx);

    if (invitation.tutorId && invitation.role === Role.STUDENT) {
      await tx.tutorStudent.create({
        data: {
          tutorId: invitation.tutorId,
          studentId: newUser.id
        }
      });
    }

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() }
    });

    return newUser;
  });

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return {
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}

export async function revokeInvitation(invitationId: string) {
  const actor = await requireActor("invite.revoke");
  const invitation = await prismaDb.invitation.findUnique({ where: { id: invitationId } });

  if (!invitation) throw new NotFoundError("Convite não encontrado.");

  assertCanManageInvitation(actor, invitation);

  const status = getInvitationStatus(invitation);
  if (status === "used") throw new Error("Convite já utilizado não pode ser revogado.");

  await prismaDb.invitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date() }
  });

  return { ok: true };
}

export async function deleteInvitation(invitationId: string) {
  const actor = await requireActor("invite.delete");
  const invitation = await prismaDb.invitation.findUnique({ where: { id: invitationId } });

  if (!invitation) throw new NotFoundError("Convite não encontrado.");

  assertCanManageInvitation(actor, invitation);

  await prismaDb.invitation.delete({
    where: { id: invitationId }
  });

  return { ok: true };
}

export async function resendInvitation(invitationId: string) {
  const actor = await requireActor("invite.resend");

  return prismaDb.$transaction(async (tx: any) => {
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) throw new NotFoundError("Convite não encontrado.");

    assertCanManageInvitation(actor, invitation);

    const status = getInvitationStatus(invitation);
    if (status === "used") {
      throw new Error("Convites aceitos não podem ser reenviados.");
    }

    const existingUser = await tx.user.findUnique({
      where: { email: invitation.email }
    });
    if (existingUser) {
      throw new Error("Já existe uma conta com este e-mail.");
    }

    if (status === "pending") {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { revokedAt: new Date() }
      });
    }

    const invitationPayload = buildInvitationPayload({
      email: invitation.email,
      role: invitation.role,
      invitedByUserId: invitation.invitedByUserId,
      tutorId: invitation.tutorId
    });

    await tx.invitation.create({
      data: invitationPayload.data
    });

    return {
      token: invitationPayload.token,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitationPayload.expiresAt
    };
  });
}

export async function cleanupInvitations() {
  const actor = await requireActor("invite.cleanup");
  const where: Record<string, unknown> = {
    OR: [{ revokedAt: { not: null } }, { usedAt: { not: null } }, { usedAt: null, revokedAt: null, expiresAt: { lte: new Date() } }]
  };

  if (actor.role === Role.TUTOR) {
    where.invitedByUserId = actor.id;
  }

  const deleted = await prismaDb.invitation.deleteMany({ where });

  return {
    ok: true,
    deletedCount: deleted.count
  };
}
