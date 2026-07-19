import { Suspense } from "react";
import { getApplications } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApplicationsTable, ApplicationsTableSkeleton } from "@/components/dashboard/applications-table";
import { Pagination } from "@/components/dashboard/pagination";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

async function ApplicationsContent({
  q,
  currentPage,
}: {
  q?: string;
  currentPage: number;
}) {
  const { applications, total, totalPages } = await getApplications(q, currentPage);

  return (
    <>
      <ApplicationsTable applications={applications} searchQuery={q} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchQuery={q}
        />
      )}
    </>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  // To get total for the static header, we call getApplications but maybe we can make a separate call, but for simplicity, let's call it here for total. Or better, let's get total in ApplicationsContent, but since header is static, maybe let's just get total quickly here.
  const { total } = await getApplications(q, 1);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {total} application{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/applications/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Application</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ApplicationsTableSkeleton />}>
        <ApplicationsContent q={q} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
