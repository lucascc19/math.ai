import type { Role } from "@prisma/client";

export function getHomePathForRole(role: Role | string) {
  if (role === "ADMIN") return "/admin";
  if (role === "TUTOR") return "/tutor";
  return "/aluno";
}
