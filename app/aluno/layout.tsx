import { Role } from "@prisma/client";
import { RoleShell } from "@/components/layout/role-shell";
import { requirePageRole } from "@/lib/server/guards";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole([Role.STUDENT]);

  return (
    <RoleShell role="student" userName={user.name} initialSettings={user.settings}>
      {children}
    </RoleShell>
  );
}
