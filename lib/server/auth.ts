import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/server/prisma";
import { generateOpaqueToken, hashToken } from "@/lib/server/token-hash";

const SESSION_COOKIE_NAME = "mathai_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SCRYPT_KEY_LENGTH = 64;
const prismaAuth = prisma as any;

type DbClient = typeof prismaAuth;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, stored] = passwordHash.split(":");

  if (!salt || !stored) {
    return false;
  }

  const incoming = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const storedBuffer = Buffer.from(stored, "hex");

  if (incoming.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(incoming, storedBuffer);
}

export async function initializeUserData(userId: string, db: DbClient = prismaAuth) {
  const tracks = await db.skillTrack.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true }
  });

  await Promise.all(
    tracks.map((track: { id: string }) =>
      db.trackProgress.upsert({
        where: {
          userId_skillTrackId: {
            userId,
            skillTrackId: track.id
          }
        },
        update: {},
        create: {
          userId,
          skillTrackId: track.id
        }
      })
    )
  );

  await db.accessibilityProfile.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });
}

export async function createSession(userId: string) {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prismaAuth.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt
    }
  });

  return {
    token,
    expiresAt
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prismaAuth.session.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      user: {
        include: {
          accessibility: true
        }
      }
    }
  });

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prismaAuth.session.delete({
      where: { id: session.id }
    });
    await clearSessionCookie();
    return null;
  }

  return session;
}

export async function tryGetCurrentSession() {
  try {
    return await getCurrentSession();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("Failed to resolve current session.", error);
    return null;
  }
}

export async function requireCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  if (session.user.active === false) {
    await clearSessionCookie();
    throw new Error("ACCOUNT_DEACTIVATED");
  }

  return session.user;
}

export async function revokeAllUserSessions(userId: string) {
  await prismaAuth.session.deleteMany({ where: { userId } });
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prismaAuth.session.deleteMany({
      where: {
        tokenHash: hashToken(token)
      }
    });
  }

  await clearSessionCookie();
}
