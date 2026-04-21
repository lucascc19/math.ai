import { Role } from "@prisma/client";

import { StudentModuleDetail } from "@/components/student-module-detail";
import { requirePageRole } from "@/lib/server/guards";

type PageProps = {
  params: Promise<{ skillId: string; moduleId: string }>;
};

export default async function StudentModuleDetailPage({ params }: PageProps) {
  await requirePageRole([Role.STUDENT]);
  const { skillId, moduleId } = await params;

  return <StudentModuleDetail skillId={skillId} moduleId={moduleId} />;
}
