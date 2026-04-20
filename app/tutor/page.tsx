import { TutorOverview } from "@/components/tutor/tutor-overview";
import { listInvitations } from "@/lib/server/invitations";
import { listStudentsForActor, getTutorMetrics } from "@/lib/server/tutoring";

export default async function TutorIndex() {
  const [students, metrics, invitations] = await Promise.all([
    listStudentsForActor(),
    getTutorMetrics(),
    listInvitations()
  ]);

  return <TutorOverview students={students} metrics={metrics} invitations={invitations as any} />;
}
