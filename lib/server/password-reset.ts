import { randomBytes, createHash } from "node:crypto";

import { hashPassword, revokeAllUserSessions } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;
const prismaDb = prisma as any;

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "dev-auth-secret-change-me";
}

function hashToken(token: string) {
  return createHash("sha256").update(`${getAuthSecret()}:reset:${token}`).digest("hex");
}

export type PasswordResetRequest = {
  token: string | null;
  expiresAt: Date | null;
};

export async function requestPasswordReset(email: string): Promise<PasswordResetRequest> {
  const user = await prismaDb.user.findUnique({ where: { email } });

  if (!user || user.active === false) {
    return { token: null, expiresAt: null };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prismaDb.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
  }

  const record = await prismaDb.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) }
  });

  if (!record) throw new Error("Token inválido ou expirado.");
  if (record.usedAt) throw new Error("Este link já foi utilizado.");
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("Token inválido ou expirado.");
  }

  await prismaDb.$transaction([
    prismaDb.user.update({
      where: { id: record.userId },
      data: { passwordHash: hashPassword(newPassword) }
    }),
    prismaDb.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })
  ]);

  await revokeAllUserSessions(record.userId);

  return { ok: true };
}
