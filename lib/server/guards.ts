import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { clearSessionCookie, getCurrentSession } from "@/lib/server/auth";

export type GuardedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export async function requirePageSession(): Promise<GuardedUser> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.active === false) {
    await clearSessionCookie();
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    active: session.user.active ?? true
  };
}

export async function requirePageRole(roles: Role[]): Promise<GuardedUser> {
  const user = await requirePageSession();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
