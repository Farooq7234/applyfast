"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  DAILY_OUTREACH_LIMIT,
  getUtcDate,
  renderOutreachMessage,
} from "@/lib/outreach";
import {
  retryDailyReport,
  retryUnknownOutreachAttempt,
  syncOutreachRecipients,
} from "@/lib/outreach-service";

function revalidateOutreach(): void {
  revalidatePath("/outreach");
}

export async function getOutreachDashboardData() {
  const session = await requireSession();
  const userId = session.user.id;
  const campaign = await db.outreachCampaign.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  await syncOutreachRecipients(campaign.id, userId);

  const today = getUtcDate(new Date());
  const [
    user,
    usage,
    recipients,
    pendingCount,
    claimedCount,
    acceptedCount,
    deliveredCount,
    failedCount,
    unknownCount,
    skippedCount,
    totalRecipients,
    attempts,
    report,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, portfolio: true, resumeUrl: true },
    }),
    db.outreachDailyUsage.findUnique({
      where: { userId_usageDate: { userId, usageDate: today } },
      select: { authorizedAttempts: true },
    }),
    db.outreachRecipient.findMany({
      where: { campaignId: campaign.id,  status: "PENDING" },
      include: {
        sourceApplication: { select: { id: true, createdAt: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take:15,
    }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "PENDING" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "CLAIMED" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "ACCEPTED" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "DELIVERED" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "FAILED" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "UNKNOWN" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id, status: "SKIPPED" } }),
    db.outreachRecipient.count({ where: { campaignId: campaign.id } }),
    db.outreachSendAttempt.findMany({
      where: { userId, usageDate: today },
      include: {
        recipient: { select: { company: true, companyEmail: true } },
      },
      orderBy: [{ authorizedAt: "desc" }, { id: "desc" }],
      take: 50,
    }),
    db.outreachDailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate: today } },
    }),
  ]);

  return {
    campaign: { id: campaign.id, enabled: campaign.enabled },
    limit: DAILY_OUTREACH_LIMIT,
    today: today.toISOString().slice(0, 10),
    authorizedToday: usage?.authorizedAttempts ?? 0,
    remainingToday: Math.max(
      0,
      DAILY_OUTREACH_LIMIT - (usage?.authorizedAttempts ?? 0),
    ),
    counts: {
      pending: pendingCount,
      claimed: claimedCount,
      accepted: acceptedCount + deliveredCount,
      delivered: deliveredCount,
      failed: failedCount,
      unknown: unknownCount,
      skipped: skippedCount,
    },
    totalRecipients,
    recipients: recipients.map((recipient) => {
      const preview = renderOutreachMessage({
        company: recipient.company,
        recruiterName: recipient.recruiterName,
        senderName: user.name,
        portfolio: user.portfolio,
        resumeUrl: user.resumeUrl,
      });
      return {
        id: recipient.id,
        sourceApplicationId: recipient.sourceApplicationId,
        company: recipient.company,
        companyEmail: recipient.companyEmail,
        recruiterName: recipient.recruiterName,
        status: recipient.status,
        attemptCount: recipient.attemptCount,
        lastAttemptAt: recipient.lastAttemptAt,
        lastError: recipient.lastError,
        skipReason: recipient.skipReason,
        createdAt: recipient.createdAt,
        preview,
      };
    }),
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      company: attempt.recipient.company,
      companyEmail: attempt.recipient.companyEmail,
      templateName: attempt.templateName,
      status: attempt.status,
      authorizedAt: attempt.authorizedAt,
      completedAt: attempt.completedAt,
      providerMessageId: attempt.providerMessageId,
      failureReason: attempt.failureReason,
    })),
    report: report
      ? {
          id: report.id,
          status: report.status,
          reportDate: report.reportDate,
          summary: report.summary,
          failureReason: report.failureReason,
          notificationEmail: report.notificationEmail,
          acceptedAt: report.acceptedAt,
        }
      : null,
  };
}

export async function setOutreachCampaignEnabled(
  enabled: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const session = await requireSession();
  if (typeof enabled !== "boolean") return { error: "Invalid campaign state." };

  await db.outreachCampaign.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, enabled },
    update: { enabled },
  });
  revalidateOutreach();
  return { success: true };
}

export async function skipOutreachRecipient(
  recipientId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await requireSession();
  if (!recipientId || recipientId.length > 128) {
    return { error: "Invalid recipient." };
  }

  const result = await db.outreachRecipient.updateMany({
    where: {
      id: recipientId,
      userId: session.user.id,
      status: { in: ["PENDING", "FAILED", "UNKNOWN"] },
    },
    data: {
      status: "SKIPPED",
      skipReason: "Manually skipped by the account owner.",
      lastError: null,
    },
  });
  if (result.count !== 1) {
    return { error: "This recipient cannot be skipped because it is not in a recoverable state." };
  }
  revalidateOutreach();
  return { success: true };
}

export async function retryOutreachRecipient(
  recipientId: string,
  confirmUnknown = false,
): Promise<{ success?: boolean; error?: string }> {
  const session = await requireSession();
  if (!recipientId || recipientId.length > 128) {
    return { error: "Invalid recipient." };
  }

  const recipient = await db.outreachRecipient.findFirst({
    where: { id: recipientId, userId: session.user.id },
    select: { status: true, lastError: true },
  });
  if (!recipient) return { error: "Recipient not found." };
  if (recipient.status !== "FAILED" && recipient.status !== "UNKNOWN") {
    return { error: "Only failed or uncertain recipients can be retried." };
  }
  if (recipient.status === "UNKNOWN" && confirmUnknown !== true) {
    return { error: "Confirm you checked Resend before retrying an uncertain send." };
  }
  if (recipient.status === "UNKNOWN") {
    try {
      await retryUnknownOutreachAttempt(recipientId, session.user.id);
      revalidateOutreach();
      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not retry the send.",
      };
    }
  }
  if (/bounce|complain/i.test(recipient.lastError ?? "")) {
    return { error: "Bounced or complained-about addresses cannot be retried." };
  }

  const result = await db.outreachRecipient.updateMany({
    where: {
      id: recipientId,
      userId: session.user.id,
      status: recipient.status,
    },
    data: { status: "PENDING", claimedAt: null, lastError: null },
  });
  if (result.count !== 1) return { error: "Recipient state changed; refresh and try again." };
  revalidateOutreach();
  return { success: true };
}

export async function retryOutreachDailyReport(
  reportId: string,
  confirmUnknown = false,
): Promise<{ success?: boolean; error?: string }> {
  const session = await requireSession();
  if (!reportId || reportId.length > 128) return { error: "Invalid report." };
  try {
    await retryDailyReport(reportId, session.user.id, confirmUnknown);
    revalidateOutreach();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not retry the report.",
    };
  }
}
