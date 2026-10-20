"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useResendUsage } from "@/hooks/use-resend-usage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatLimit,
  formatNumber,
  formatResetExact,
  formatResetRelative,
  usagePercent,
  usageTone,
  type UsageTone,
} from "@/lib/resend-usage-format";
import type { ResendUsageEmailPeriod } from "@/types";

const barTone: Record<UsageTone, string> = {
  default: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-destructive",
};

const textTone: Record<UsageTone, string> = {
  default: "text-foreground",
  warning: "text-amber-600",
  danger: "text-destructive",
};

function UsageBar({
  used,
  limit,
  className,
}: {
  used: number;
  limit: number | null;
  className?: string;
}) {
  const percent = usagePercent(used, limit);
  if (percent === null) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={limit ?? undefined}
      aria-valuenow={used}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", barTone[usageTone(percent)])}
        style={{ width: `${Math.max(percent, used > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

function EmailPeriodBlock({
  label,
  period,
}: {
  label: string;
  period: ResendUsageEmailPeriod;
}) {
  const percent = usagePercent(period.used, period.limit);
  const tone = usageTone(percent);

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {formatNumber(period.sent)} sent · {formatNumber(period.received)} received
          </p>
        </div>
        <p className={cn("text-sm font-semibold tabular-nums", textTone[tone])}>
          {formatNumber(period.used)}
          <span className="font-normal text-muted-foreground"> / {formatLimit(period.limit)}</span>
        </p>
      </div>

      {percent !== null ? (
        <UsageBar used={period.used} limit={period.limit} />
      ) : (
        <p className="text-xs text-muted-foreground">No {label.toLowerCase()} email limit.</p>
      )}

      <time
        dateTime={period.resets_at}
        title={formatResetExact(period.resets_at)}
        className="text-[11px] text-muted-foreground"
      >
        Resets {formatResetRelative(period.resets_at)}
      </time>
    </div>
  );
}

function LimitStat({
  label,
  used,
  limit,
  detail,
}: {
  label: string;
  used: number;
  limit: number | null;
  detail?: string;
}) {
  const percent = usagePercent(used, limit);
  const tone = usageTone(percent);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-semibold tabular-nums", textTone[tone])}>
          {formatNumber(used)}
          <span className="font-normal text-muted-foreground"> / {formatLimit(limit)}</span>
        </span>
      </div>
      <UsageBar used={used} limit={limit} />
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export function ResendUsageCard() {
  const { usage, error, fetchedAt, loading, refreshing, refresh } = useResendUsage();

  return (
    <Card className="max-w-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Resend Account Usage</CardTitle>
          <CardDescription>
            Daily and monthly sending limits, plus the rest of your account quotas.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {loading ? (
          <CardSkeleton />
        ) : error ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{error}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              Try again
            </Button>
          </div>
        ) : usage ? (
          <>
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email Limits
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <EmailPeriodBlock label="Daily" period={usage.emails.daily} />
                <EmailPeriodBlock label="Monthly" period={usage.emails.monthly} />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Other Quotas
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <LimitStat
                  label="Contacts"
                  used={usage.contacts.used}
                  limit={usage.contacts.limit}
                />
                <LimitStat
                  label="Domains"
                  used={usage.domains.used}
                  limit={usage.domains.limit}
                />
                <LimitStat
                  label="Segments"
                  used={usage.segments.used}
                  limit={usage.segments.limit}
                />
                <LimitStat
                  label="AI Credits"
                  used={usage.ai_credits.used}
                  limit={usage.ai_credits.limit}
                  detail={
                    usage.ai_credits.next_increase_at
                      ? `Next increase ${formatResetRelative(usage.ai_credits.next_increase_at)}`
                      : "No scheduled increase"
                  }
                />
                <LimitStat
                  label="Automation Runs"
                  used={usage.automation_runs.used}
                  limit={usage.automation_runs.limit}
                  detail={`Resets ${formatResetRelative(usage.automation_runs.resets_at)}`}
                />
                <LimitStat
                  label="Broadcasts"
                  used={usage.broadcasts.used}
                  limit={usage.broadcasts.limit}
                  detail="No cap on broadcasts"
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <span>
                API rate limit: {formatNumber(usage.rate_limit.limit)} requests per{" "}
                {usage.rate_limit.duration}
              </span>
              {fetchedAt && (
                <span>
                  Updated{" "}
                  {new Date(fetchedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
