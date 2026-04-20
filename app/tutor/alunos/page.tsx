import { StudentsPanel } from "@/components/tutor/students-panel";
import { getTutorMetrics, listStudentsForActor } from "@/lib/server/tutoring";

export default async function TutorStudentsPage() {
  const [students, metrics] = await Promise.all([listStudentsForActor(), getTutorMetrics()]);
  return <StudentsPanel initialStudents={students} metrics={metrics} />;
}
