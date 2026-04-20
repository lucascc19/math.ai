import { Role } from "@prisma/client";
import { AdminInvitationsPanel } from "@/components/admin/invitations-panel";
import type { AdminUser } from "@/lib/api";
import { listUsers } from "@/lib/server/admin";
import { listInvitations } from "@/lib/server/invitations";

export default async function AdminConvitesPage() {
  const [invitations, users] = await Promise.all([listInvitations(), listUsers()]);
  const tutors = users.filter((user: AdminUser) => user.role === Role.TUTOR && user.active);

  return <AdminInvitationsPanel initialInvitations={invitations as any} tutors={tutors} />;
}
