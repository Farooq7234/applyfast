import { TARGET_STATUSES, type TargetStatusValue } from "@/lib/validations"

export const TARGET_STATUS_LABELS: Record<TargetStatusValue, string> = {
  RESEARCHING: "Researching",
  CONTACT_FOUND: "Contact found",
  EMAILED: "Emailed",
  REPLIED: "Replied",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
}

export const TARGET_STATUS_BADGE: Record<
  TargetStatusValue,
  { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  RESEARCHING: { variant: "outline" },
  CONTACT_FOUND: { variant: "secondary" },
  EMAILED: { variant: "default" },
  REPLIED: {
    variant: "default",
    className: "bg-emerald-600 text-white hover:bg-emerald-600/80",
  },
  INTERVIEWING: { variant: "default" },
  REJECTED: { variant: "destructive" },
  GHOSTED: {
    variant: "secondary",
    className: "text-muted-foreground",
  },
}

export { TARGET_STATUSES }
