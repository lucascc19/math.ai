import { Role } from "@prisma/client";
import { StudentTrackDetail } from "@/components/student-track-detail";
import { requirePageRole } from "@/lib/server/guards";

type PageProps = {
  params: Promise<{ skillId: string }>;
};

export default async function StudentTrackDetailPage({ params }: PageProps) {
  await requirePageRole([Role.STUDENT]);
  const { skillId } = await params;

  return <StudentTrackDetail skillId={skillId} />;
}
