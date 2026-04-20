import { Role } from "@prisma/client";
import { StudentTracks } from "@/components/student-tracks";
import { requirePageRole } from "@/lib/server/guards";

export default async function StudentTracksPage() {
  await requirePageRole([Role.STUDENT]);
  return <StudentTracks />;
}
