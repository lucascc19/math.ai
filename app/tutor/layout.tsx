import { Role } from "@prisma/client";

import { RoleShell } from "@/components/layout/role-shell";
import { requirePageRole } from "@/lib/server/guards";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole([Role.TUTOR, Role.ADMIN]);

  return (
    <RoleShell role="tutor" userName={user.name} initialSettings={user.settings}>
      {children}
    </RoleShell>
  );
}
