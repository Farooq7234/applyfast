import { getApplications } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { Pagination } from "@/components/dashboard/pagination";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  const { applications, total, totalPages } = await getApplications(q, currentPage);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {total} application{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/applications/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Application</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <ApplicationsTable applications={applications} searchQuery={q} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchQuery={q}
        />
      )}
    </div>
  );
}
