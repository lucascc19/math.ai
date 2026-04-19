import { DashboardApp } from "@/components/dashboard-app";
import { requirePageSession } from "@/lib/server/guards";

export default async function DashboardPage() {
  await requirePageSession();
  return <DashboardApp />;
}
