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

export { TARGET_STATUSES }
