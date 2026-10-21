"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { TargetCompany } from "@prisma/client"
import { ChevronUp, ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  createTarget,
  deleteTarget,
  updateTarget,
  updateTargetStatus,
} from "@/actions/targets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { companyNameFromUrl, looksLikeCareersUrl, websiteFromUrl } from "@/lib/company-url"
import { TARGET_STATUS_LABELS, TARGET_STATUSES } from "@/lib/target-status"
import type { TargetStatusValue } from "@/lib/validations"

type Draft = {
  name: string
  website: string
  careersUrl: string
  location: string
  contactEmails: string[]
  status: TargetStatusValue
}

const TARGET_CITIES = ["Bengaluru", "Chennai", "Hyderabad"] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emptyDraft(): Draft {
  return {
    name: "",
    website: "",
    careersUrl: "",
    location: "",
    contactEmails: [],
    status: "RESEARCHING",
  }
}

function hostname(website: string) {
  try {
    return new URL(website).hostname.replace(/^www\./, "")
  } catch {
    return website
  }
}

export function TargetsTable({ companies }: { companies: TargetCompany[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TargetStatusValue | "ALL">("ALL")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<TargetCompany | null>(null)
  const [deleting, setDeleting] = useState<TargetCompany | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return companies.filter((company) => {
      const statusOk = statusFilter === "ALL" || company.status === statusFilter
      const queryOk =
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.website.toLowerCase().includes(needle) ||
        (company.location?.toLowerCase().includes(needle) ?? false) ||
        company.contactEmails.some((email) => email.toLowerCase().includes(needle))
      return statusOk && queryOk
    })
  }, [companies, query, statusFilter])

  function handleStatusChange(company: TargetCompany, status: TargetStatusValue) {
    startTransition(async () => {
      const result = await updateTargetStatus(company.id, status)
      if (result.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleting) return
    const company = deleting
    startTransition(async () => {
      const result = await deleteTarget(company.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`${company.name} removed`)
      setDeleting(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies, emails, locations"
            className="pl-8"
          />
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {companies.length}
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter((value as TargetStatusValue | "ALL") ?? "ALL")
            }
          >
            <SelectTrigger className="min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[60]" alignItemWithTrigger={false}>
              <SelectItem value="ALL">All statuses</SelectItem>
              {TARGET_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {TARGET_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add company
          </Button>
        </div>
      </div>

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact emails</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {companies.length === 0
                    ? "No companies yet. Add your first one above."
                    : "No companies match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="max-w-[280px] whitespace-normal">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate font-medium hover:underline"
                        >
                          {company.name}
                        </a>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {hostname(company.website)}
                        </span>
                      </div>
                      {company.careersUrl ? (
                        <a
                          href={company.careersUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Careers page"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {company.location || "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal">
                    <EmailList emails={company.contactEmails} />
                  </TableCell>
                  <TableCell>
                    <StatusSelect
                      value={company.status}
                      onChange={(status) => handleStatusChange(company, status)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(company)}
                        aria-label={`Edit ${company.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(company)}
                        aria-label={`Remove ${company.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {addOpen ? (
        <AddTargetDialog
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false)
            router.refresh()
          }}
        />
      ) : null}

      {editing ? (
        <EditTargetDialog
          key={editing.id}
          company={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      ) : null}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the company and its saved emails. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddTargetDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <TargetFormDialog
      idPrefix="new"
      title="Add company"
      description="Paste a website or careers link and the company name fills in automatically."
      submitLabel="Add company"
      successMessage="Company added"
      initial={emptyDraft()}
      autoFill
      action={(form) =>
        createTarget({
          name: form.name,
          website: form.website,
          careersUrl: form.careersUrl,
          location: form.location,
          contactEmails: form.contactEmails,
          status: form.status,
        })
      }
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function EditTargetDialog({
  company,
  onClose,
  onSaved,
}: {
  company: TargetCompany
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <TargetFormDialog
      idPrefix="edit"
      title="Edit company"
      description="Update the details you track for this company."
      submitLabel="Save changes"
      successMessage="Company updated"
      initial={{
        name: company.name,
        website: company.website,
        careersUrl: company.careersUrl ?? "",
        location: company.location ?? "",
        contactEmails: [...company.contactEmails],
        status: company.status,
      }}
      action={(form) =>
        updateTarget(company.id, {
          name: form.name,
          website: form.website,
          careersUrl: form.careersUrl,
          location: form.location,
          contactEmails: form.contactEmails,
          status: form.status,
        })
      }
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function TargetFormDialog({
  idPrefix,
  title,
  description,
  submitLabel,
  successMessage,
  initial,
  action,
  autoFill = false,
  onClose,
  onSaved,
}: {
  idPrefix: string
  title: string
  description: string
  submitLabel: string
  successMessage: string
  initial: Draft
  action: (form: Draft) => Promise<{ error?: string }>
  autoFill?: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Draft>(initial)
  const [nameTouched, setNameTouched] = useState(false)
  const [websiteTouched, setWebsiteTouched] = useState(false)
  const [careersTouched, setCareersTouched] = useState(false)
  const [isPending, startTransition] = useTransition()

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleNameChange(value: string) {
    setNameTouched(true)
    setField("name", value)
  }

  function handleWebsiteChange(value: string) {
    setField("website", value)
    setWebsiteTouched(true)
    if (!autoFill) return

    const name = companyNameFromUrl(value)
    if (name && !nameTouched) setField("name", name)

    if (looksLikeCareersUrl(value) && !careersTouched) {
      const website = websiteFromUrl(value)
      if (website) setField("website", website)
      setField("careersUrl", value)
    }
  }

  function handleCareersChange(value: string) {
    setField("careersUrl", value)
    setCareersTouched(true)
    if (!autoFill) return

    const name = companyNameFromUrl(value)
    if (name && !nameTouched) setField("name", name)

    if (!websiteTouched) {
      const website = websiteFromUrl(value)
      if (website) setField("website", website)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await action(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(successMessage)
      onSaved()
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id={`${idPrefix}-website`}
              label="Website"
              value={form.website}
              onChange={handleWebsiteChange}
              placeholder="acme.com or careers link"
              required
            />
            <TextField
              id={`${idPrefix}-name`}
              label="Company"
              value={form.name}
              onChange={handleNameChange}
              placeholder="Auto-fills from the link"
              required
            />
            <TextField
              id={`${idPrefix}-careers`}
              label="Careers URL"
              value={form.careersUrl}
              onChange={handleCareersChange}
              placeholder="acme.com/careers"
            />
            <LocationSelect
              value={form.location}
              onChange={(value) => setField("location", value)}
            />
          </div>
          <EmailInput
            id={`${idPrefix}-emails`}
            value={form.contactEmails}
            onChange={(value) => setField("contactEmails", value)}
          />
          <div className="grid gap-1">
            <Label>Status</Label>
            <StatusSelect
              value={form.status}
              onChange={(status) => setField("status", status)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EmailInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [draft, setDraft] = useState("")

  function commit(raw: string, notify = true) {
    const candidates = raw
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
    if (candidates.length === 0) return

    const next = [...value]
    let added = false
    for (const candidate of candidates) {
      const email = candidate.toLowerCase()
      if (!EMAIL_PATTERN.test(email)) {
        if (notify) toast.error(`${candidate} is not a valid email`)
        continue
      }
      if (next.includes(email)) continue
      next.push(email)
      added = true
    }
    if (added) onChange(next)
    setDraft("")
  }

  function remove(email: string) {
    onChange(value.filter((item) => item !== email))
  }

  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>Contact emails</Label>
      <div className="flex min-h-8 flex-wrap items-center gap-1.5 border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex max-w-full items-center gap-1 bg-muted px-1.5 py-0.5 text-[11px]"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              onClick={() => remove(email)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commit(draft)
              return
            }
            if (event.key === "Backspace" && !draft && value.length > 0) {
              remove(value[value.length - 1])
            }
          }}
          onBlur={() => {
            if (EMAIL_PATTERN.test(draft.trim().toLowerCase())) commit(draft, false)
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text")
            if (/[,;\s]/.test(text)) {
              event.preventDefault()
              commit(text)
            }
          }}
          placeholder={value.length === 0 ? "Type an email and press Enter" : ""}
          className="min-w-[10rem] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          inputMode="email"
          autoComplete="off"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Press Enter after each email to add it.
      </p>
    </div>
  )
}

function LocationSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const options =
    value && !(TARGET_CITIES as readonly string[]).includes(value)
      ? [...TARGET_CITIES, value]
      : TARGET_CITIES

  return (
    <div className="grid gap-1">
      <Label>Location</Label>
      <Select
        value={value || undefined}
        onValueChange={(next) => {
          if (typeof next === "string") onChange(next)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select city" />
        </SelectTrigger>
        <SelectContent className="z-[60]" alignItemWithTrigger={false}>
          {options.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function EmailList({ emails }: { emails: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (emails.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = expanded ? emails : emails.slice(0, 2)
  const hiddenCount = emails.length - 2

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((email) => (
        <CopyEmail key={email} email={email} />
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          title={expanded ? "Show fewer emails" : `Show ${hiddenCount} more emails`}
          className="inline-flex items-center bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : `+${hiddenCount}`}
        </button>
      ) : null}
    </div>
  )
}

function CopyEmail({ email }: { email: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
      toast.success("Email copied")
    } catch {
      toast.error("Could not copy email")
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${email}`}
      className="max-w-[180px] truncate bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {email}
    </button>
  )
}

function StatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: TargetStatusValue
  onChange: (value: TargetStatusValue) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next as TargetStatusValue)
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className={cn("min-w-28", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[60]" alignItemWithTrigger={false}>
        {TARGET_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {TARGET_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}
