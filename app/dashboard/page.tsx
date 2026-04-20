import { redirect } from "next/navigation";
import { getHomePathForRole } from "@/lib/role-home";
import { requirePageSession } from "@/lib/server/guards";

export default async function DashboardPage() {
  const user = await requirePageSession();
  redirect(getHomePathForRole(user.role));
}
