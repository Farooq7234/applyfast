import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getTargetCompanies } from "@/actions/targets"
import { TargetsTable } from "@/components/targets/targets-table"

export default async function TargetsPage() {
  const session = await getServerSession()
  if (!session) redirect("/sign-in")

  const companies = await getTargetCompanies()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-background">
      <div>
        <h1 className="text-xl text-foreground font-semibold">Targets</h1>
        <p className="text-sm text-muted-foreground">
          Companies you want to work at, with the emails and status you need.
        </p>
      </div>
      <TargetsTable companies={companies} />
    </div>
  )
}
