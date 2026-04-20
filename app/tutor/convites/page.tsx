import { TutorInvitationsPanel } from "@/components/tutor/invitations-panel";
import { listInvitations } from "@/lib/server/invitations";
import { requireActor } from "@/lib/server/permissions";

export default async function TutorConvitesPage() {
  const actor = await requireActor("invite.list");
  const invitations = await listInvitations();

  return <TutorInvitationsPanel initialInvitations={invitations as any} tutorId={actor.id} />;
}
