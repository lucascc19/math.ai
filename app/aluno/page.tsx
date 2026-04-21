import { Role } from "@prisma/client";

import { StudentOverview } from "@/components/student-overview";
import { requirePageRole } from "@/lib/server/guards";

export default async function StudentPage() {
  await requirePageRole([Role.STUDENT]);
  return <StudentOverview />;
}
