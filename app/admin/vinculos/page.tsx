import { Role } from "@prisma/client";

import { LinksPanel } from "@/components/admin/links-panel";
import { listTutorLinks, listUsers } from "@/lib/server/admin";

export default async function AdminLinksPage() {
  const [links, tutors, students] = await Promise.all([
    listTutorLinks(),
    listUsers({ role: Role.TUTOR, active: true }),
    listUsers({ role: Role.STUDENT, active: true })
  ]);

  return <LinksPanel initialLinks={links} tutors={tutors} students={students} />;
}
