"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { AddTargetDialog } from "@/components/targets/add-target-dialog"
import { TargetCard } from "@/components/targets/target-card"
import { TargetDrawer } from "@/components/targets/target-drawer"
import type { TargetCompanyWithContacts } from "@/components/targets/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { TARGET_STATUS_LABELS, TARGET_STATUSES } from "@/lib/target-status"
import type { TargetStatusValue } from "@/lib/validations"

export function TargetsBoard({
  companies,
}: {
  companies: TargetCompanyWithContacts[]
}) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TargetStatusValue | "ALL">("ALL")
  const [query, setQuery] = useState("")

  const selected = companies.find((company) => company.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return companies.filter((company) => {
      const statusOk = statusFilter === "ALL" || company.status === statusFilter
      const queryOk =
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.website.toLowerCase().includes(needle)
      return statusOk && queryOk
    })
  }, [companies, statusFilter, query])

  function refresh() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies"
            className="pl-8"
          />
        </div>
        <Button size="sm" className="w-fit gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add company
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
          label="All"
        />
        {TARGET_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
            label={TARGET_STATUS_LABELS[status]}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-2 border border-dashed border-border p-8">
          <p className="text-sm font-medium">
            {companies.length === 0 ? "No target companies yet" : "No companies match this filter"}
          </p>
          <p className="text-sm text-muted-foreground">
            {companies.length === 0
              ? "Track the companies you want to work at. Contacts are added by hand."
              : "Try another status or search term."}
          </p>
          {companies.length === 0 && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Add your first company
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {filtered.map((company) => (
            <TargetCard
              key={company.id}
              company={company}
              onClick={() => setSelectedId(company.id)}
            />
          ))}
        </div>
      )}

      <AddTargetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(id) => {
          setSelectedId(id)
          refresh()
        }}
      />

      <TargetDrawer
        company={selected}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onDeleted={() => {
          setSelectedId(null)
          refresh()
        }}
        onRefresh={refresh}
      />
    </div>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-none border px-2 py-1 text-xs transition-colors",
        active
          ? "border-foreground bg-secondary text-foreground"
          : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}
