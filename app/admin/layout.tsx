import { Role } from "@prisma/client";
import { RoleShell } from "@/components/layout/role-shell";
import { requirePageRole } from "@/lib/server/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole([Role.ADMIN]);

  return (
    <RoleShell role="admin" userName={user.name} initialSettings={user.settings}>
      {children}
    </RoleShell>
  );
}
