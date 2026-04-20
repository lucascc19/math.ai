import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";

const prismaMock = {
  user: {
    findUnique: vi.fn()
  },
  invitation: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn()
  },
  tutorStudent: {
    create: vi.fn()
  },
  $transaction: vi.fn()
};

const requireActorMock = vi.fn();
const requirePermissionMock = vi.fn();
const initializeUserDataMock = vi.fn();
const createSessionMock = vi.fn();
const setSessionCookieMock = vi.fn();
const hashPasswordMock = vi.fn();
const generateOpaqueTokenMock = vi.fn();
const hashTokenMock = vi.fn();

vi.mock("@/lib/server/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("@/lib/server/permissions", () => ({
  ForbiddenError: class ForbiddenError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
  requireActor: requireActorMock,
  requirePermission: requirePermissionMock
}));

vi.mock("@/lib/server/auth", () => ({
  initializeUserData: initializeUserDataMock,
  createSession: createSessionMock,
  setSessionCookie: setSessionCookieMock,
  hashPassword: hashPasswordMock
}));

vi.mock("@/lib/server/token-hash", () => ({
  generateOpaqueToken: generateOpaqueTokenMock,
  hashToken: hashTokenMock
}));

describe("invitation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateOpaqueTokenMock.mockReturnValue("invite-token");
    hashTokenMock.mockImplementation((value: string) => `hash:${value}`);
    hashPasswordMock.mockReturnValue("hashed-password");
    createSessionMock.mockResolvedValue({
      token: "session-token",
      expiresAt: new Date("2026-04-25T00:00:00.000Z")
    });
    setSessionCookieMock.mockResolvedValue(undefined);
    initializeUserDataMock.mockResolvedValue(undefined);
  });

  it("creates a student invitation for tutors", async () => {
    requireActorMock.mockResolvedValue({
      id: "tutor-1",
      role: Role.TUTOR,
      active: true
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.invitation.findFirst.mockResolvedValue(null);
    prismaMock.invitation.create.mockResolvedValue(undefined);

    const { createInvitation } = await import("@/lib/server/invitations");

    const result = await createInvitation({
      email: "aluno@example.com",
      role: "STUDENT",
      tutorId: "tutor-1"
    });

    expect(result.token).toBe("invite-token");
    expect(prismaMock.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "aluno@example.com",
          role: Role.STUDENT,
          invitedByUserId: "tutor-1",
          tutorId: "tutor-1",
          tokenHash: "hash:invite-token"
        })
      })
    );
  });

  it("blocks tutors from inviting admins", async () => {
    requireActorMock.mockResolvedValue({
      id: "tutor-1",
      role: Role.TUTOR,
      active: true
    });

    const { createInvitation } = await import("@/lib/server/invitations");

    await expect(
      createInvitation({
        email: "admin@example.com",
        role: "ADMIN"
      })
    ).rejects.toThrow("Tutores so podem convidar alunos.");
  });

  it("accepts an invitation and creates the user inside the transaction", async () => {
    const tx = {
      invitation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "inv-1",
          email: "novo@example.com",
          role: Role.STUDENT,
          tutorId: "tutor-9",
          usedAt: null,
          revokedAt: null,
          expiresAt: new Date("2026-04-30T00:00:00.000Z")
        }),
        update: vi.fn().mockResolvedValue(undefined)
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "user-1",
          name: "Novo Usuario",
          email: "novo@example.com",
          role: Role.STUDENT
        })
      },
      tutorStudent: {
        create: vi.fn().mockResolvedValue(undefined)
      },
      skillTrack: {
        findMany: vi.fn().mockResolvedValue([{ id: "track-1" }])
      },
      trackProgress: {
        upsert: vi.fn().mockResolvedValue(undefined)
      },
      accessibilityProfile: {
        upsert: vi.fn().mockResolvedValue(undefined)
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (db: typeof tx) => Promise<unknown>) => callback(tx));

    const { acceptInvitation } = await import("@/lib/server/invitations");

    const result = await acceptInvitation({
      token: "invite-token",
      name: "Novo Usuario",
      password: "senha12345"
    });

    expect(result.ok).toBe(true);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Novo Usuario",
          email: "novo@example.com",
          role: Role.STUDENT,
          passwordHash: "hashed-password"
        })
      })
    );
    expect(initializeUserDataMock).toHaveBeenCalledWith("user-1", tx);
    expect(tx.tutorStudent.create).toHaveBeenCalledWith({
      data: { tutorId: "tutor-9", studentId: "user-1" }
    });
    expect(tx.invitation.update).toHaveBeenCalled();
    expect(createSessionMock).toHaveBeenCalledWith("user-1");
    expect(setSessionCookieMock).toHaveBeenCalled();
  });

  it("revokes pending invitations", async () => {
    requireActorMock.mockResolvedValue({
      id: "admin-1",
      role: Role.ADMIN,
      active: true
    });
    prismaMock.invitation.findUnique.mockResolvedValue({
      id: "inv-1",
      invitedByUserId: "admin-1",
      usedAt: null,
      revokedAt: null,
      expiresAt: new Date("2026-04-30T00:00:00.000Z")
    });
    prismaMock.invitation.update.mockResolvedValue(undefined);

    const { revokeInvitation } = await import("@/lib/server/invitations");

    const result = await revokeInvitation("inv-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.invitation.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it("deletes an invitation permanently", async () => {
    requireActorMock.mockResolvedValue({
      id: "admin-1",
      role: Role.ADMIN,
      active: true
    });
    prismaMock.invitation.findUnique.mockResolvedValue({
      id: "inv-1",
      invitedByUserId: "admin-1",
      usedAt: null,
      revokedAt: null,
      expiresAt: new Date("2026-04-30T00:00:00.000Z")
    });
    prismaMock.invitation.delete.mockResolvedValue(undefined);

    const { deleteInvitation } = await import("@/lib/server/invitations");

    const result = await deleteInvitation("inv-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.invitation.delete).toHaveBeenCalledWith({
      where: { id: "inv-1" }
    });
  });

  it("resends a pending invitation by revoking the previous one and creating a new token", async () => {
    requireActorMock.mockResolvedValue({
      id: "admin-1",
      role: Role.ADMIN,
      active: true
    });

    const tx = {
      invitation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "inv-1",
          email: "aluno@example.com",
          role: Role.STUDENT,
          tutorId: "tutor-9",
          invitedByUserId: "tutor-9",
          usedAt: null,
          revokedAt: null,
          expiresAt: new Date("2026-04-30T00:00:00.000Z")
        }),
        update: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue(undefined)
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (db: typeof tx) => Promise<unknown>) => callback(tx));

    const { resendInvitation } = await import("@/lib/server/invitations");

    const result = await resendInvitation("inv-1");

    expect(result.token).toBe("invite-token");
    expect(tx.invitation.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { revokedAt: expect.any(Date) }
    });
    expect(tx.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "aluno@example.com",
          invitedByUserId: "tutor-9",
          tokenHash: "hash:invite-token"
        })
      })
    );
  });

  it("cleans up old invitations in actor scope", async () => {
    requireActorMock.mockResolvedValue({
      id: "tutor-1",
      role: Role.TUTOR,
      active: true
    });
    prismaMock.invitation.deleteMany.mockResolvedValue({ count: 3 });

    const { cleanupInvitations } = await import("@/lib/server/invitations");

    const result = await cleanupInvitations();

    expect(result).toEqual({
      ok: true,
      deletedCount: 3
    });
    expect(prismaMock.invitation.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          invitedByUserId: "tutor-1"
        })
      })
    );
  });
});
