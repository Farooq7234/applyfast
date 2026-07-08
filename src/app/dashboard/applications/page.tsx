import { getApplications } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const { q } = await searchParams;
  const applications = await getApplications(q);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/applications/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      <ApplicationsTable applications={applications} searchQuery={q} />
    </div>
  );
}
