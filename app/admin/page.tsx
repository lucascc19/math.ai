import { AdminOverview } from "@/components/admin/admin-overview";
import { listUsers, listTutorLinks } from "@/lib/server/admin";
import { listTracksForAdmin } from "@/lib/server/content";
import { listInvitations } from "@/lib/server/invitations";

export default async function AdminIndex() {
  const [users, invitations, links, tracks] = await Promise.all([
    listUsers(),
    listInvitations(),
    listTutorLinks(),
    listTracksForAdmin()
  ]);

  return (
    <AdminOverview users={users} invitations={invitations} links={links} tracks={tracks} />
  );
}
