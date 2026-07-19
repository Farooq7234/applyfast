import { getDashboardStats, getApplicationsOverTime, getApplicationStatusBreakdown, getTopRoles, getTopCompanies } from "@/actions/applications";
import { getServerSession } from "@/lib/session";
import { ensureDefaultTemplate } from "@/actions/templates";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  SendHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  MousePointerClick,
  MailOpen,
} from "lucide-react";
import { redirect } from "next/navigation";
import { ApplicationsOverTimeChart } from "@/components/dashboard/applications-over-time-chart";
import { StatusBreakdownChart } from "@/components/dashboard/status-breakdown-chart";
import { TopRolesChart } from "@/components/dashboard/top-roles-chart";
import { TopCompaniesChart } from "@/components/dashboard/top-companies-chart";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  // Ensure the user has a default template
  await ensureDefaultTemplate(session.user.id);

  const [stats, applicationsOverTime, statusBreakdown, topRoles, topCompanies] = await Promise.all([
    getDashboardStats(),
    getApplicationsOverTime(),
    getApplicationStatusBreakdown(),
    getTopRoles(),
    getTopCompanies(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <Link href="/applications/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={SendHorizontal}
          description="All time"
        />
        <StatCard
          title="Sent Today"
          value={stats.sentToday}
          icon={CheckCircle2}
          description="Applications sent today"
          variant="success"
        />
        <StatCard
          title="Pending Follow Ups"
          value={stats.pendingFollowUps}
          icon={Clock}
          description="Follow ups due"
          variant="warning"
        />

        <StatCard
          title="Opened"
          value={stats.opened}
          icon={MailOpen}
          description="Emails opened"
          variant="success"
        />

        <StatCard
          title="Clicked"
          value={stats.clicked}
          icon={MousePointerClick}
          description="Links clicked"
          variant="success"
        />

        <StatCard
          title="Failed"
          value={stats.failed}
          icon={XCircle}
          description="Need attention"
          variant="destructive"
        />
      </div>

      {/* Charts */}
      {stats.total > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <ApplicationsOverTimeChart data={applicationsOverTime} />
          </div>
          <StatusBreakdownChart data={statusBreakdown} />
          <TopRolesChart data={topRoles} />
          <div className="md:col-span-2">
            <TopCompaniesChart data={topCompanies} />
          </div>
        </div>
      )}

      {/* Quick action */}
      {stats.total === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <SendHorizontal className="mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="mb-1 text-sm font-medium">No applications yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Send your first application in under 15 seconds
          </p>
          <Link href="/applications/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
