import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { normalizeAccessibilitySettings } from "@/lib/accessibility-settings";
import { getHomePathForRole } from "@/lib/role-home";
import type { SettingsInput } from "@/lib/schemas";
import { clearSessionCookie, getCurrentSession } from "@/lib/server/auth";

export type GuardedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  settings: SettingsInput;
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
    active: session.user.active ?? true,
    settings: normalizeAccessibilitySettings(session.user.accessibility)
  };
}

export async function requirePageRole(roles: Role[]): Promise<GuardedUser> {
  const user = await requirePageSession();

  if (!roles.includes(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}
