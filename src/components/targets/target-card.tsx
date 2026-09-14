"use client"

import { Globe } from "lucide-react"
import { RiLinkedinLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TARGET_STATUS_BADGE,
  TARGET_STATUS_LABELS,
} from "@/lib/target-status"
import type { TargetCompanyWithContacts } from "@/components/targets/types"

function CompanyMark({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <span className={cn("flex items-center justify-center font-medium", className)}>
      {initials || "?"}
    </span>
  )
}

export function TargetCard({
  company,
  onClick,
}: {
  company: TargetCompanyWithContacts
  onClick: () => void
}) {
  const badge = TARGET_STATUS_BADGE[company.status]

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2.5 rounded-none border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/40"
    >
      {/* Logo + name / industry */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-muted text-[10px] text-muted-foreground">
          <CompanyMark name={company.name} className="h-9 w-9" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{company.name}</p>
          {company.industry ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {company.industry}
            </p>
          ) : null}
        </div>
      </div>

      {/* One-liner */}
      {company.oneLiner ? (
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {company.oneLiner}
        </p>
      ) : null}

      {/* Status */}
      <Badge variant={badge.variant} className={cn("w-fit max-w-full truncate", badge.className)}>
        {TARGET_STATUS_LABELS[company.status]}
      </Badge>

      {/* Tech pills */}
      {company.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {company.techStack.map((tech) => (
            <span
              key={tech}
              className="max-w-full truncate bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        
        </div>
      )}

      {/* Links */}
      <div className="mt-auto flex items-center gap-1 text-muted-foreground">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center border border-transparent hover:border-border hover:bg-secondary hover:text-foreground"
            aria-label="Website"
          >
            <Globe className="h-4 w-4" />
          </a>
        )}
        {company.linkedinUrl && (
          <a
            href={company.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center border border-transparent hover:border-border hover:bg-secondary hover:text-foreground"
            aria-label="LinkedIn"
          >
            <RiLinkedinLine className="h-4 w-4" />
          </a>
        )}
      </div>
    </button>
  )
}

export { CompanyMark }
