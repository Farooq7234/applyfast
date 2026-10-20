"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Mail,
  Pause,
  Play,
  RotateCw,
  SkipForward,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  retryOutreachDailyReport,
  retryOutreachRecipient,
  setOutreachCampaignEnabled,
  skipOutreachRecipient,
} from "@/actions/outreach";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { getOutreachDashboardData } from "@/actions/outreach";

type DashboardData = Awaited<ReturnType<typeof getOutreachDashboardData>>;

const statusLabels: Record<string, string> = {
  PENDING: "Queued",
  CLAIMED: "Sending",
  ACCEPTED: "Accepted by Resend",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  UNKNOWN: "Unknown outcome",
  SKIPPED: "Skipped",
};

export function OutreachDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleResult(result: { success?: boolean; error?: string }, successMessage: string) {
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  function toggleCampaign() {
    startTransition(async () => {
      const enabled = !data.campaign.enabled;
      const result = await setOutreachCampaignEnabled(enabled);
      handleResult(result, enabled ? "Daily outreach enabled" : "Daily outreach paused");
    });
  }

  function skipRecipient(id: string) {
    startTransition(async () => {
      const result = await skipOutreachRecipient(id);
      handleResult(result, "Recipient skipped");
    });
  }

  function retryRecipient(id: string, unknown: boolean) {
    const confirmUnknown =
      unknown &&
      window.confirm(
        "This send has an unknown outcome. Check Resend first. Retry anyway? The recipient may receive a duplicate email.",
      );
    if (unknown && !confirmUnknown) return;
    startTransition(async () => {
      const result = await retryOutreachRecipient(id, confirmUnknown);
      handleResult(result, "Retry attempt recorded; check the updated recipient status");
    });
  }

  function retryReport(id: string, unknown: boolean) {
    const confirmUnknown =
      unknown &&
      window.confirm(
        "The report delivery outcome is unknown. Check Resend first. Retrying may send a duplicate report. Continue?",
      );
    if (unknown && !confirmUnknown) return;
    startTransition(async () => {
      const result = await retryOutreachDailyReport(id, confirmUnknown);
      handleResult(result, "Daily report retry requested");
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Daily Outreach</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review cold outreach to existing application contacts. The daily job chooses
            the oldest eligible untouched recipients first and sends no more than 15 per UTC day.
          </p>
        </div>
        <Button onClick={toggleCampaign} disabled={pending} variant={data.campaign.enabled ? "outline" : "default"}>
          {data.campaign.enabled ? <Pause /> : <Play />}
          {data.campaign.enabled ? "Pause sending" : "Enable daily sending"}
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Today's quota" value={`${data.authorizedToday} / ${data.limit}`} detail={`${data.remainingToday} remaining · UTC`} />
        <Metric label="Queued" value={data.counts.pending} detail="Eligible recipients" />
        <Metric label="Provider accepted" value={data.counts.accepted} detail="Acceptance is not delivery" />
        <Metric label="Confirmed delivered" value={data.counts.delivered} detail={`${data.counts.failed} failed · ${data.counts.unknown} unknown`} />
      </section>

      <div className="rounded-none border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium">
          Automation is {data.campaign.enabled ? "enabled" : "paused"}.
        </p>
        <p className="mt-1 text-muted-foreground">
          The existing Vercel Cron runs at 04:00 UTC. Enabling this campaign opts it into that
          schedule; pausing prevents future claims, but an already-authorized request may still be
          in flight. A daily email report is sent to your account email while this campaign exists.
        </p>
      </div>

      {data.report && (
        <section className="border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Daily report · {formatDate(data.report.reportDate)}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.report.status} · {data.report.notificationEmail}
              </p>
              {data.report.summary && (
                <p className="mt-2 max-w-3xl text-sm">{data.report.summary}</p>
              )}
              {data.report.failureReason && (
                <p className="mt-2 text-sm text-destructive">{data.report.failureReason}</p>
              )}
            </div>
            {(data.report.status === "FAILED" || data.report.status === "UNKNOWN") && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => retryReport(data.report!.id, data.report!.status === "UNKNOWN")}
              >
                <RotateCw />
                Retry report
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Recipient queue and previews</h2>
          <p className="text-xs text-muted-foreground">
            {data.totalRecipients} recipients · addresses are deduplicated case-insensitively. Preview the personalized messages before enabling automation.
          </p>
        </div>
        {data.recipients.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-sm text-muted-foreground">
            No application contacts found yet. Add contacts through Applications to build the outreach queue.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.recipients.map((recipient) => (
              <article key={recipient.id} className="border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{recipient.company}</h3>
                      <StatusBadge status={recipient.status} />
                    </div>
                    <p className="mt-1 text-sm">{recipient.recruiterName || "Recipient"} · {recipient.companyEmail || "Missing email"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Source application {recipient.sourceApplicationId ?? "unavailable"} · {recipient.attemptCount} attempts
                    </p>
                    {recipient.lastError && (
                      <p className="mt-2 max-w-3xl text-xs text-destructive">{recipient.lastError}</p>
                    )}
                    {recipient.skipReason && (
                      <p className="mt-2 max-w-3xl text-xs text-muted-foreground">{recipient.skipReason}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipient.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => skipRecipient(recipient.id)}
                      >
                        <SkipForward />
                        Skip
                      </Button>
                    )}
                    {(recipient.status === "FAILED" || recipient.status === "UNKNOWN") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => retryRecipient(recipient.id, recipient.status === "UNKNOWN")}
                        >
                          <RotateCw />
                          Retry
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => skipRecipient(recipient.id)}
                        >
                          <SkipForward />
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <details className="mt-3 border-t border-border pt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium">
                    <Mail className="h-3.5 w-3.5" />
                    Preview email · {recipient.preview.subject}
                  </summary>
                  <div className="mt-3 rounded-none bg-muted/30 p-3">
                    <p className="text-xs font-semibold">Subject: {recipient.preview.subject}</p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-5 text-foreground">
                      {recipient.preview.text}
                    </pre>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Today&apos;s send attempts</h2>
          <p className="text-xs text-muted-foreground">
            UTC date {data.today}. “Accepted” means Resend accepted the request; delivery is confirmed only by a delivery webhook.
          </p>
        </div>
        {data.attempts.length === 0 ? (
          <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">
            No sends have been authorized today.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Company / recipient</th>
                  <th className="p-3 font-medium">Template</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Authorized (UTC)</th>
                  <th className="p-3 font-medium">Failure</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium">{attempt.company}</div>
                      <div className="mt-1 text-muted-foreground">{attempt.companyEmail}</div>
                    </td>
                    <td className="p-3">{attempt.templateName}</td>
                    <td className="p-3"><StatusBadge status={attempt.status} /></td>
                    <td className="p-3">{formatDateTime(attempt.authorizedAt)}</td>
                    <td className="max-w-56 p-3 text-destructive">{attempt.failureReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Template v2.0.0 · Subject includes the company; the body greets the recruiter when known, names the company, and includes valid portfolio/resume links. For unknown outcomes, check Resend before any retry; retries reuse the original provider idempotency key within its safe window.
      </p>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "DELIVERED" ? CheckCircle2 :
    status === "ACCEPTED" ? Mail :
    status === "PENDING" ? Clock3 :
    status === "UNKNOWN" ? CircleHelp :
    status === "FAILED" || status === "SKIPPED" ? XCircle :
    status === "CLAIMED" ? AlertTriangle : CircleHelp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px]",
        status === "DELIVERED" && "border-green-600/30 text-green-700 dark:text-green-400",
        status === "FAILED" && "border-destructive/30 text-destructive",
        status === "UNKNOWN" && "border-amber-600/30 text-amber-700 dark:text-amber-400",
        status === "ACCEPTED" && "border-blue-600/30 text-blue-700 dark:text-blue-400",
        status === "SKIPPED" && "border-border text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {statusLabels[status] ?? status}
    </span>
  );
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value: Date): string {
  return `${value.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}
