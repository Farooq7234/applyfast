"use client";

import Link from "next/link";
import { AlertCircle, Mail, RefreshCw } from "lucide-react";
import { useResendUsage } from "@/hooks/use-resend-usage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatLimit, formatNumber, usagePercent, usageTone, type UsageTone } from "@/lib/resend-usage-format";

const textTone: Record<UsageTone, string> = {
  default: "text-foreground",
  warning: "text-amber-600",
  danger: "text-destructive",
};

function UsageSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-10" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

export function SidebarUsageWidget() {
  const { usage, error, loading, refreshing, refresh } = useResendUsage();
  const daily = usage?.emails.daily ?? null;
  const monthly = usage?.emails.monthly ?? null;
  const dailyTone = usageTone(daily ? usagePercent(daily.used, daily.limit) : null);
  const monthlyTone = usageTone(monthly ? usagePercent(monthly.used, monthly.limit) : null);

  return (
    <div className="border-t border-border px-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold">Usage</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh usage"
          title="Refresh usage"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <UsageSkeleton />
      ) : error ? (
        <div className="mt-2.5 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="w-fit text-[11px] font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : usage ? (
        <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Daily limit</span>
            <span className={cn("font-medium tabular-nums", textTone[dailyTone])}>
              {formatNumber(usage.emails.daily.used)}
              <span className="text-muted-foreground">
                {" "}
                / {formatLimit(usage.emails.daily.limit)}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Monthly limit</span>
            <span className={cn("font-medium tabular-nums", textTone[monthlyTone])}>
              {formatNumber(usage.emails.monthly.used)}
              <span className="text-muted-foreground">
                {" "}
                / {formatLimit(usage.emails.monthly.limit)}
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileUsagePill() {
  const { usage, error, loading } = useResendUsage();
  const daily = usage?.emails.daily ?? null;
  const percent = daily ? usagePercent(daily.used, daily.limit) : null;
  const tone = usageTone(percent);

  return (
    <Link
      href="/profile"
      title="View Resend usage"
      className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Mail className="h-3 w-3" />
      {loading ? (
        <Skeleton className="h-2.5 w-9" />
      ) : error ? (
        <span className="py-4">Usage</span>
      ) : daily ? (
        <span className={textTone[tone]}>
          {formatNumber(daily.used)}
          {daily.limit !== null && (
            <span className="text-muted-foreground"> / {formatLimit(daily.limit)}</span>
          )}
        </span>
      ) : (
        <span>Usage</span>
      )}
    </Link>
  );
}
