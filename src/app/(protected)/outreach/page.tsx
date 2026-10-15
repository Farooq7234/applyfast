import { redirect } from "next/navigation";
import { getOutreachDashboardData } from "@/actions/outreach";
import { getServerSession } from "@/lib/session";
import { OutreachDashboard } from "@/components/outreach/outreach-dashboard";

export default async function OutreachPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const data = await getOutreachDashboardData();
  return <OutreachDashboard data={data} />;
}
