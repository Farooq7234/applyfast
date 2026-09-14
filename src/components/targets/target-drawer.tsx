"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { Globe, Plus, Trash2, X } from "lucide-react"
import { RiLinkedinLine } from "@remixicon/react"
import { toast } from "sonner"
import {
  addTargetContact,
  deleteTarget,
  deleteTargetContact,
  updateTarget,
  updateTargetStatus,
} from "@/actions/targets"
import { CompanyMark } from "@/components/targets/target-card"
import type { TargetCompanyWithContacts } from "@/components/targets/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  TARGET_STATUS_BADGE,
  TARGET_STATUS_LABELS,
  TARGET_STATUSES,
} from "@/lib/target-status"
import {
  COMPANY_SIZES,
  INDIA_TECH_LOCATIONS,
  isPresetLocation,
} from "@/lib/target-options"
import type { TargetStatusValue } from "@/lib/validations"

function toInput(value: string | null | undefined) {
  return value ?? ""
}

export function TargetDrawer({
  company,
  open,
  onOpenChange,
  onDeleted,
  onRefresh,
}: {
  company: TargetCompanyWithContacts | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onRefresh: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} disablePointerDismissal>
        <SheetContent className="h-full gap-0 overflow-hidden p-0 sm:max-w-lg">
          {company ? (
            <TargetDrawerBody
              company={company}
              isPending={isPending}
              startTransition={startTransition}
              onRefresh={onRefresh}
              onRequestDelete={() => setConfirmDelete(true)}
            />
          ) : (
            <SheetHeader>
              <SheetTitle>Loading…</SheetTitle>
              <SheetDescription>Fetching company details.</SheetDescription>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this company?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the company and all saved contacts. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!company) return
                startTransition(async () => {
                  const result = await deleteTarget(company.id)
                  if (result.error) {
                    toast.error(result.error)
                    return
                  }
                  toast.success("Company removed")
                  setConfirmDelete(false)
                  onDeleted()
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function TargetDrawerBody({
  company,
  isPending,
  startTransition,
  onRefresh,
  onRequestDelete,
}: {
  company: TargetCompanyWithContacts
  isPending: boolean
  startTransition: ReturnType<typeof useTransition>[1]
  onRefresh: () => void
  onRequestDelete: () => void
}) {
  const badge = TARGET_STATUS_BADGE[company.status]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="border-b border-border">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-muted text-xs text-muted-foreground">
            <CompanyMark name={company.name} className="h-10 w-10" />
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate">{company.name}</SheetTitle>
            <SheetDescription className="truncate">{company.website}</SheetDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            value={company.status}
            onValueChange={(value) => {
              startTransition(async () => {
                const result = await updateTargetStatus(
                  company.id,
                  value as TargetStatusValue
                )
                if (result.error) {
                  toast.error(result.error)
                  return
                }
                onRefresh()
              })
            }}
          >
            <SelectTrigger size="sm" className="min-w-36">
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
          <Badge variant={badge.variant} className={badge.className}>
            {TARGET_STATUS_LABELS[company.status]}
          </Badge>
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Website"
          >
            <Globe className="h-4 w-4" />
          </a>
          {company.linkedinUrl && (
            <a
              href={company.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="LinkedIn"
            >
              <RiLinkedinLine className="h-4 w-4" />
            </a>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={onRequestDelete}
            disabled={isPending}
            aria-label="Delete company"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col overflow-hidden p-4"
      >
        <TabsList variant="line" className="w-full shrink-0 justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          keepMounted
          className="min-h-0 flex-1 overflow-y-auto pt-3 data-hidden:hidden"
        >
          <OverviewForm
            company={company}
            isPending={isPending}
            startTransition={startTransition}
            onRefresh={onRefresh}
          />
        </TabsContent>
        <TabsContent
          value="people"
          keepMounted
          className="min-h-0 flex-1 overflow-y-auto pt-3 data-hidden:hidden"
        >
          <PeopleTab
            company={company}
            isPending={isPending}
            startTransition={startTransition}
            onRefresh={onRefresh}
          />
        </TabsContent>
        <TabsContent
          value="activity"
          keepMounted
          className="min-h-0 flex-1 overflow-y-auto pt-3 data-hidden:hidden"
        >
          <ActivityTab company={company} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewForm({
  company,
  isPending,
  startTransition,
  onRefresh,
}: {
  company: TargetCompanyWithContacts
  isPending: boolean
  startTransition: ReturnType<typeof useTransition>[1]
  onRefresh: () => void
}) {
  const initialLocationMode = isPresetLocation(company.location)
    ? (company.location as string)
    : company.location
      ? "Other"
      : ""

  const [form, setForm] = useState({
    name: company.name,
    website: company.website,
    careersUrl: toInput(company.careersUrl),
    linkedinUrl: toInput(company.linkedinUrl),
    oneLiner: toInput(company.oneLiner),
    industry: toInput(company.industry),
    techStack: [...company.techStack],
    companySize: toInput(company.companySize),
    locationMode: initialLocationMode,
    locationOther:
      !isPresetLocation(company.location) && company.location
        ? company.location
        : "",
    fundingStage: toInput(company.fundingStage),
  })
  const [skillDraft, setSkillDraft] = useState("")

  useEffect(() => {
    const mode = isPresetLocation(company.location)
      ? (company.location as string)
      : company.location
        ? "Other"
        : ""
    setForm({
      name: company.name,
      website: company.website,
      careersUrl: toInput(company.careersUrl),
      linkedinUrl: toInput(company.linkedinUrl),
      oneLiner: toInput(company.oneLiner),
      industry: toInput(company.industry),
      techStack: [...company.techStack],
      companySize: toInput(company.companySize),
      locationMode: mode,
      locationOther:
        !isPresetLocation(company.location) && company.location
          ? company.location
          : "",
      fundingStage: toInput(company.fundingStage),
    })
    setSkillDraft("")
  }, [company.id, company.updatedAt])

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function addSkill(raw: string) {
    const skill = raw.trim()
    if (!skill) return
    if (form.techStack.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkillDraft("")
      return
    }
    setForm((current) => ({
      ...current,
      techStack: [...current.techStack, skill],
    }))
    setSkillDraft("")
  }

  function removeSkill(skill: string) {
    setForm((current) => ({
      ...current,
      techStack: current.techStack.filter((item) => item !== skill),
    }))
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const location =
      form.locationMode === "Other"
        ? form.locationOther.trim()
        : form.locationMode

    startTransition(async () => {
      const result = await updateTarget(company.id, {
        name: form.name,
        website: form.website,
        careersUrl: form.careersUrl,
        linkedinUrl: form.linkedinUrl,
        oneLiner: form.oneLiner,
        industry: form.industry,
        techStack: form.techStack,
        companySize: form.companySize,
        location,
        fundingStage: form.fundingStage,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Overview saved")
      onRefresh()
    })
  }

  return (
    <form onSubmit={handleSave} className="grid gap-3">
      <Field label="Name" value={form.name} onChange={(value) => setField("name", value)} />
      <Field label="Website" value={form.website} onChange={(value) => setField("website", value)} />
      <Field
        label="Careers URL"
        value={form.careersUrl}
        onChange={(value) => setField("careersUrl", value)}
      />
      <Field
        label="LinkedIn"
        value={form.linkedinUrl}
        onChange={(value) => setField("linkedinUrl", value)}
      />
      <Field
        label="One-liner"
        value={form.oneLiner}
        onChange={(value) => setField("oneLiner", value)}
      />
      <Field
        label="Industry"
        value={form.industry}
        onChange={(value) => setField("industry", value)}
      />

      <div className="grid gap-1.5">
        <Label htmlFor="tech-stack">Tech stack</Label>
        <div className="flex min-h-8 flex-wrap items-center gap-1.5 border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
          {form.techStack.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 text-[11px]"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            id="tech-stack"
            value={skillDraft}
            onChange={(event) => setSkillDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault()
                addSkill(skillDraft)
              }
              if (
                event.key === "Backspace" &&
                !skillDraft &&
                form.techStack.length > 0
              ) {
                removeSkill(form.techStack[form.techStack.length - 1])
              }
            }}
            onBlur={() => addSkill(skillDraft)}
            placeholder={form.techStack.length === 0 ? "Type and press Enter" : ""}
            className="min-w-[8rem] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Company size</Label>
        <Select
          value={form.companySize || undefined}
          onValueChange={(value) => setField("companySize", value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent className="z-[60]" alignItemWithTrigger={false}>
            {COMPANY_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size} employees
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Location</Label>
        <Select
          value={form.locationMode || undefined}
          onValueChange={(value) => setField("locationMode", value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent className="z-[60]" alignItemWithTrigger={false}>
            {INDIA_TECH_LOCATIONS.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.locationMode === "Other" && (
          <Input
            value={form.locationOther}
            onChange={(event) => setField("locationOther", event.target.value)}
            placeholder="Enter city"
          />
        )}
      </div>

      <Field
        label="Funding stage"
        value={form.fundingStage}
        onChange={(value) => setField("fundingStage", value)}
      />
      <Button type="submit" disabled={isPending} className="mt-1 w-fit">
        {isPending ? "Saving…" : "Save overview"}
      </Button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function PeopleTab({
  company,
  isPending,
  startTransition,
  onRefresh,
}: {
  company: TargetCompanyWithContacts
  isPending: boolean
  startTransition: ReturnType<typeof useTransition>[1]
  onRefresh: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    linkedinUrl: "",
    notes: "",
  })

  function resetForm() {
    setForm({ name: "", role: "", email: "", linkedinUrl: "", notes: "" })
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await addTargetContact(company.id, form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      resetForm()
      setShowForm(false)
      toast.success("Contact added")
      onRefresh()
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {company.contacts.length} contact
          {company.contacts.length === 1 ? "" : "s"}
        </p>
        {!showForm && (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add people
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="grid gap-2 border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">New contact</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            autoFocus
          />
          <Input
            placeholder="Role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Input
            placeholder="LinkedIn URL"
            value={form.linkedinUrl}
            onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })}
          />
          <Textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding…" : "Save contact"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {company.contacts.length === 0 ? (
        !showForm && (
          <p className="text-muted-foreground">
            No contacts yet. Click Add people to add someone.
          </p>
        )
      ) : (
        <ul className="grid gap-2">
          {company.contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-start justify-between gap-2 border border-border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{contact.name}</p>
                {contact.role && (
                  <p className="text-muted-foreground">{contact.role}</p>
                )}
                {contact.email && <p>{contact.email}</p>}
                {contact.linkedinUrl && (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
                {contact.notes && (
                  <p className="mt-1 text-muted-foreground">{contact.notes}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${contact.name}`}
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteTargetContact(company.id, contact.id)
                    if (result.error) {
                      toast.error(result.error)
                      return
                    }
                    toast.success("Contact removed")
                    onRefresh()
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActivityTab({ company }: { company: TargetCompanyWithContacts }) {
  const events = useMemo(() => {
    const items: { id: string; title: string; at: Date }[] = [
      {
        id: "created",
        title: "Company added",
        at: new Date(company.createdAt),
      },
    ]

    const updatedAt = new Date(company.updatedAt)
    if (updatedAt.getTime() - new Date(company.createdAt).getTime() > 1000) {
      items.push({
        id: "updated",
        title: "Details updated",
        at: updatedAt,
      })
    }

    for (const contact of company.contacts) {
      items.push({
        id: contact.id,
        title: `Contact added: ${contact.name}`,
        at: new Date(contact.createdAt),
      })
    }

    return items.sort((a, b) => b.at.getTime() - a.at.getTime())
  }, [company])

  if (events.length === 0) {
    return <p className="text-muted-foreground">Nothing to show yet.</p>
  }

  return (
    <ol className="grid gap-3">
      {events.map((event) => (
        <li key={event.id} className={cn("border-l-2 border-border pl-3")}>
          <p className="font-medium">{event.title}</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(event.at, { addSuffix: true })}
          </p>
        </li>
      ))}
    </ol>
  )
}
