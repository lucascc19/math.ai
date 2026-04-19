import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard-app";
import { getCurrentSession } from "@/lib/server/auth";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return <DashboardApp />;
}
