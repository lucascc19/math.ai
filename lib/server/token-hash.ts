import { createHash, randomBytes } from "node:crypto";

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "dev-auth-secret-change-me";
}

export function hashToken(value: string) {
  return createHash("sha256").update(`${getAuthSecret()}:${value}`).digest("hex");
}

export function generateOpaqueToken() {
  return randomBytes(32).toString("hex");
}
