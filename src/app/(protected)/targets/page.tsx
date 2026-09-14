import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getTargetCompanies } from "@/actions/targets"
import { TargetsBoard } from "@/components/targets/targets-board"

export default async function TargetsPage() {
  const session = await getServerSession()
  if (!session) redirect("/sign-in")

  const companies = await getTargetCompanies()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Targets</h1>
        <p className="text-sm text-muted-foreground">
          Research board for companies you want to work at. Separate from applications.
        </p>
      </div>
      <TargetsBoard companies={companies} />
    </div>
  )
}
