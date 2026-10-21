import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getResend, getResendFrom } from "@/lib/email";
import {
  DAILY_OUTREACH_LIMIT,
  formatUtcDate,
  getDeterministicDailySummary,
  hasDailyOutreachQuota,
  getUtcDate,
  normalizeRecipientEmail,
  OUTREACH_TEMPLATE_ID,
  OUTREACH_TEMPLATE_NAME,
  OUTREACH_TEMPLATE_VERSION,
  renderOutreachMessage,
  selectOutreachCandidates,
} from "@/lib/outreach";
import { renderDailyOutreachEmail } from "@/lib/outreach-report-email";

const STALE_CLAIM_MS = 30 * 60 * 1000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown delivery error";
}

export async function syncOutreachRecipients(
  campaignId: string,
  userId: string,
): Promise<number> {
  const [applications, repliedCompanies] = await Promise.all([
    db.application.findMany({
      where: { userId },
      select: {
        id: true,
        company: true,
        companyEmail: true,
        recruiterName: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    db.targetCompany.findMany({
      where: { userId, status: "REPLIED" },
      select: { contactEmails: true },
    }),
  ]);
  const repliedEmails = new Set(
    repliedCompanies
      .flatMap((company) => company.contactEmails)
      .map((email) => normalizeRecipientEmail(email))
      .filter((email): email is string => email !== null),
  );
  const candidates = selectOutreachCandidates(applications, repliedEmails);

  if (candidates.length > 0) {
    await db.outreachRecipient.createMany({
      data: candidates.map((candidate) => ({
        campaignId,
        userId,
        sourceApplicationId: candidate.sourceApplicationId,
        company: candidate.company,
        companyEmail: candidate.companyEmail,
        normalizedEmail: candidate.normalizedEmail,
        recruiterName: candidate.recruiterName,
        status: candidate.status,
        skipReason: candidate.skipReason,
        createdAt: candidate.createdAt,
      })),
      skipDuplicates: true,
    });
  }

  const suppressedEmails = candidates
    .filter(
      (candidate) =>
        candidate.status === "SKIPPED" &&
        normalizeRecipientEmail(candidate.companyEmail) !== null &&
        candidate.skipReason?.includes("bounced or was complained"),
    )
    .map((candidate) => candidate.normalizedEmail);
  const repliedAddressList = [...repliedEmails];

  if (suppressedEmails.length > 0) {
    await db.outreachRecipient.updateMany({
      where: {
        campaignId,
        normalizedEmail: { in: suppressedEmails },
        status: { in: ["PENDING", "FAILED", "UNKNOWN"] },
      },
      data: {
        status: "SKIPPED",
        skipReason: "An application email to this address bounced or was complained about.",
      },
    });
  }
  if (repliedAddressList.length > 0) {
    await db.outreachRecipient.updateMany({
      where: {
        campaignId,
        normalizedEmail: { in: repliedAddressList },
        status: { in: ["PENDING", "FAILED", "UNKNOWN"] },
      },
      data: {
        status: "SKIPPED",
        skipReason: "This address belongs to a contact whose target company is marked as replied.",
      },
    });
  }

  return candidates.length;
}

async function recoverStaleClaims(now: Date): Promise<void> {
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);
  const staleAttempts = await db.outreachSendAttempt.findMany({
    where: {
      status: "AUTHORIZED",
      authorizedAt: { lt: staleBefore },
    },
    select: { id: true, recipientId: true },
  });

  if (staleAttempts.length === 0) return;

  await db.$transaction([
    db.outreachSendAttempt.updateMany({
      where: { id: { in: staleAttempts.map((attempt) => attempt.id) }, status: "AUTHORIZED" },
      data: {
        status: "UNKNOWN",
        failureReason:
          "The worker stopped before recording the provider outcome. Verify in Resend before retrying.",
        completedAt: now,
      },
    }),
    db.outreachRecipient.updateMany({
      where: {
        id: { in: staleAttempts.map((attempt) => attempt.recipientId) },
        status: "CLAIMED",
      },
      data: {
        status: "UNKNOWN",
        lastError:
          "The worker stopped before recording the provider outcome. Verify in Resend before retrying.",
      },
    }),
  ]);
}

async function reserveAndClaimNext(
  campaignId: string,
  userId: string,
  profile: { name: string; portfolio: string | null; resumeUrl: string | null },
  now: Date,
) {
  const usageDate = getUtcDate(now);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "OutreachDailyUsage"
        ("userId", "usageDate", "authorizedAttempts", "updatedAt")
      VALUES (${userId}, ${usageDate}::date, 0, NOW())
      ON CONFLICT ("userId", "usageDate") DO NOTHING
    `);

    const usageRows = await tx.$queryRaw<
      { authorizedAttempts: number }[]
    >(Prisma.sql`
      SELECT "authorizedAttempts"
      FROM "OutreachDailyUsage"
      WHERE "userId" = ${userId} AND "usageDate" = ${usageDate}::date
      FOR UPDATE
    `);
    const usage = usageRows[0];
    if (!usage || !hasDailyOutreachQuota(usage.authorizedAttempts)) return null;

    const stillEnabled = await tx.outreachCampaign.findFirst({
      where: { id: campaignId, userId, enabled: true },
      select: { id: true },
    });
    if (!stillEnabled) return null;

    const recipient = await tx.outreachRecipient.findFirst({
      where: { campaignId, userId, status: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (!recipient) return null;

    const claimed = await tx.outreachRecipient.updateMany({
      where: { id: recipient.id, status: "PENDING" },
      data: {
        status: "CLAIMED",
        claimedAt: now,
        lastAttemptAt: now,
        attemptCount: { increment: 1 },
      },
    });
    if (claimed.count !== 1) return null;

    const message = renderOutreachMessage({
      company: recipient.company,
      recruiterName: recipient.recruiterName,
      senderName: profile.name,
      portfolio: profile.portfolio,
      resumeUrl: profile.resumeUrl,
    });
    const attempt = await tx.outreachSendAttempt.create({
      data: {
        campaignId,
        recipientId: recipient.id,
        userId,
        usageDate,
        templateId: OUTREACH_TEMPLATE_ID,
        templateVersion: OUTREACH_TEMPLATE_VERSION,
        templateName: OUTREACH_TEMPLATE_NAME,
        subject: message.subject,
        body: message.html,
      },
    });

    const incremented = await tx.$executeRaw(Prisma.sql`
      UPDATE "OutreachDailyUsage"
      SET "authorizedAttempts" = "authorizedAttempts" + 1,
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "usageDate" = ${usageDate}::date
        AND "authorizedAttempts" < ${DAILY_OUTREACH_LIMIT}
    `);
    if (incremented !== 1) {
      throw new Error("Could not reserve the daily outreach quota.");
    }

    return { recipient, attempt, message };
  });
}

async function finishAttempt(input: {
  attemptId: string;
  recipientId: string;
  status: "ACCEPTED" | "FAILED" | "UNKNOWN";
  providerMessageId?: string;
  failureReason?: string;
  now: Date;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const updated = await tx.outreachSendAttempt.updateMany({
      where: { id: input.attemptId, status: "AUTHORIZED" },
      data: {
        status: input.status,
        providerMessageId: input.providerMessageId,
        failureReason: input.failureReason,
        completedAt: input.now,
      },
    });
    if (updated.count !== 1) return;
    await tx.outreachRecipient.updateMany({
      where: { id: input.recipientId, status: "CLAIMED" },
      data: {
        status: input.status,
        lastError: input.failureReason,
      },
    });
  });
}

async function sendClaimedAttempt(input: {
  campaignId: string;
  attemptId: string;
  recipientId: string;
  recipientEmail: string;
  subject: string;
  html: string;
}): Promise<"ACCEPTED" | "FAILED" | "UNKNOWN"> {
  const now = new Date();
  const campaign = await db.outreachCampaign.findUnique({
    where: { id: input.campaignId },
    select: { enabled: true },
  });

  if (!campaign?.enabled) {
    await finishAttempt({
      attemptId: input.attemptId,
      recipientId: input.recipientId,
      status: "FAILED",
      failureReason: "Campaign paused before dispatch; no email was sent.",
      now,
    });
    await db.outreachRecipient.update({
      where: { id: input.recipientId },
      data: { status: "PENDING", claimedAt: null, lastError: null },
    });
    return "FAILED";
  }

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: getResendFrom(),
        to: input.recipientEmail,
        subject: input.subject,
        html: input.html,
        tags: [{ name: "outreach_attempt_id", value: input.attemptId }],
      },
      { idempotencyKey: `outreach-${input.attemptId}` },
    );

    if (error) {
      await finishAttempt({
        attemptId: input.attemptId,
        recipientId: input.recipientId,
        status: "FAILED",
        failureReason: error.message,
        now,
      });
      return "FAILED";
    }

    if (!data?.id) {
      await finishAttempt({
        attemptId: input.attemptId,
        recipientId: input.recipientId,
        status: "UNKNOWN",
        failureReason:
          "Resend returned no message ID. Verify the outcome before retrying.",
        now,
      });
      return "UNKNOWN";
    }

    await finishAttempt({
      attemptId: input.attemptId,
      recipientId: input.recipientId,
      status: "ACCEPTED",
      providerMessageId: data.id,
      now,
    });
    return "ACCEPTED";
  } catch (error) {
    const reason = `Resend outcome is unknown: ${errorMessage(error)}`;
    await finishAttempt({
      attemptId: input.attemptId,
      recipientId: input.recipientId,
      status: "UNKNOWN",
      failureReason: reason,
      now,
    });
    return "UNKNOWN";
  }
}

async function processOutreachCampaign(
  campaignId: string,
  userId: string,
  now = new Date(),
): Promise<{ accepted: number; failed: number; unknown: number }> {
  await syncOutreachRecipients(campaignId, userId);
  await recoverStaleClaims(now);

  const campaign = await db.outreachCampaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      user: {
        select: {
          name: true,
          portfolio: true,
          resumeUrl: true,
        },
      },
    },
  });
  if (!campaign) throw new Error("Outreach campaign not found for user.");
  if (!campaign.enabled) return { accepted: 0, failed: 0, unknown: 0 };

  let accepted = 0;
  let failed = 0;
  let unknown = 0;

  while (true) {
    const claim = await reserveAndClaimNext(
      campaign.id,
      userId,
      campaign.user,
      now,
    );
    if (!claim) break;

    const outcome = await sendClaimedAttempt({
      campaignId,
      attemptId: claim.attempt.id,
      recipientId: claim.recipient.id,
      recipientEmail: claim.recipient.companyEmail,
      subject: claim.message.subject,
      html: claim.message.html,
    });

    if (outcome === "ACCEPTED") accepted++;
    else if (outcome === "FAILED") failed++;
    else unknown++;
  }

  return { accepted, failed, unknown };
}

export async function retryUnknownOutreachAttempt(
  recipientId: string,
  userId: string,
): Promise<void> {
  const attempt = await db.outreachSendAttempt.findFirst({
    where: {
      recipientId,
      userId,
      status: "UNKNOWN",
    },
    include: {
      recipient: { select: { companyEmail: true, id: true } },
      campaign: { select: { id: true, enabled: true } },
    },
    orderBy: [{ authorizedAt: "desc" }, { id: "desc" }],
  });
  if (!attempt) throw new Error("No unknown outreach attempt exists for this recipient.");
  if (!attempt.campaign.enabled) throw new Error("Enable the campaign before retrying.");
  if (Date.now() - attempt.authorizedAt.getTime() > 23 * 60 * 60 * 1000) {
    throw new Error(
      "The safe Resend idempotency window may have expired. Check Resend and do not automatically retry this send.",
    );
  }

  const claimed = await db.outreachSendAttempt.updateMany({
    where: { id: attempt.id, status: "UNKNOWN" },
    data: { status: "AUTHORIZED", failureReason: null, completedAt: null },
  });
  if (claimed.count !== 1) throw new Error("This attempt is already being retried.");

  const recipient = await db.outreachRecipient.updateMany({
    where: { id: recipientId, userId, status: "UNKNOWN" },
    data: { status: "CLAIMED", claimedAt: new Date() },
  });
  if (recipient.count !== 1) {
    await db.outreachSendAttempt.updateMany({
      where: { id: attempt.id, status: "AUTHORIZED" },
      data: { status: "UNKNOWN" },
    });
    throw new Error("Recipient state changed; refresh and try again.");
  }

  const message = renderOutreachMessageFromSavedAttempt(attempt);
  const outcome = await sendClaimedAttempt({
    campaignId: attempt.campaignId,
    attemptId: attempt.id,
    recipientId,
    recipientEmail: attempt.recipient.companyEmail,
    subject: message.subject,
    html: message.html,
  });
  if (outcome === "UNKNOWN") {
    throw new Error(
      "The provider outcome is still unknown. Check Resend before attempting another retry.",
    );
  }
}

function renderOutreachMessageFromSavedAttempt(attempt: {
  subject: string;
  body: string;
}): { subject: string; html: string } {
  return { subject: attempt.subject, html: attempt.body };
}

type DailyReportAttempt = {
  company: string;
  companyEmail: string;
  templateName: string;
  status: string;
  authorizedAt: Date;
  providerMessageId: string | null;
  failureReason: string | null;
};

function summarizeAttempts(attempts: DailyReportAttempt[]) {
  const accepted = attempts.filter((attempt) =>
    ["ACCEPTED", "DELIVERED"].includes(attempt.status),
  ).length;
  const delivered = attempts.filter((attempt) => attempt.status === "DELIVERED").length;
  const failed = attempts.filter((attempt) =>
    ["FAILED", "UNKNOWN"].includes(attempt.status),
  ).length;
  return {
    authorized: attempts.length,
    accepted,
    delivered,
    failed,
  };
}

function isValidEmail(email: string): boolean {
  return normalizeRecipientEmail(email) !== null;
}

function getDashboardUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") return null;
    return new URL("/outreach", baseUrl).toString();
  } catch {
    console.error("[Outreach] NEXT_PUBLIC_APP_URL is invalid; omitting dashboard link.");
    return null;
  }
}

async function deliverDailyReport(
  campaignId: string,
  userId: string,
  reportDate: Date,
  allowUnknownRetry = false,
): Promise<void> {
  const campaign = await db.outreachCampaign.findFirst({
    where: { id: campaignId, userId },
    include: { user: { select: { email: true, emailVerified: true, name: true } } },
  });
  if (!campaign) throw new Error("Outreach campaign not found for report.");

  const dayKey = getUtcDate(reportDate);
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  await db.outreachDailyReport.updateMany({
    where: {
      campaignId,
      reportDate: dayKey,
      status: "SENDING",
      lastAttemptAt: { lt: staleBefore },
    },
    data: {
      status: "UNKNOWN",
      failureReason:
        "The worker stopped before recording report delivery. Check Resend before retrying.",
    },
  });

  const report = await db.outreachDailyReport.upsert({
    where: { userId_reportDate: { userId, reportDate: dayKey } },
    create: {
      campaignId,
      userId,
      reportDate: dayKey,
      notificationEmail: campaign.user.email,
    },
    update: { notificationEmail: campaign.user.email },
  });

  if (!campaign.user.emailVerified || !isValidEmail(campaign.user.email)) {
    await db.outreachDailyReport.updateMany({
      where: { id: report.id, status: "PENDING" },
      data: {
        status: "FAILED",
        failureReason: campaign.user.emailVerified
          ? "The account notification email is invalid."
          : "Verify the account email before receiving daily outreach reports.",
      },
    });
    return;
  }

  const allowedStatuses = allowUnknownRetry
    ? ["FAILED", "UNKNOWN"] as const
    : ["PENDING"] as const;
  const idempotencyKey =
    report.status === "UNKNOWN" && report.idempotencyKey
      ? report.idempotencyKey
      : `outreach-report-${report.id}-attempt-${report.attemptCount + 1}`;
  const claimed = await db.outreachDailyReport.updateMany({
    where: { id: report.id, status: { in: [...allowedStatuses] } },
    data: {
      status: "SENDING",
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
      failureReason: null,
      idempotencyKey,
    },
  });
  if (claimed.count !== 1) return;

  const [attempts, skipped] = await Promise.all([
    db.outreachSendAttempt.findMany({
      where: { userId, usageDate: dayKey },
      include: { recipient: { select: { company: true, companyEmail: true } } },
      orderBy: [{ authorizedAt: "asc" }, { id: "asc" }],
    }),
    db.outreachRecipient.count({
      where: {
        campaignId,
        status: "SKIPPED",
        updatedAt: { gte: dayKey, lt: new Date(dayKey.getTime() + 86_400_000) },
      },
    }),
  ]);
  const reportAttempts: DailyReportAttempt[] = attempts.map((attempt) => ({
    company: attempt.recipient.company,
    companyEmail: attempt.recipient.companyEmail,
    templateName: attempt.templateName,
    status: attempt.status,
    authorizedAt: attempt.authorizedAt,
    providerMessageId: attempt.providerMessageId,
    failureReason: attempt.failureReason,
  }));
  const counts = summarizeAttempts(reportAttempts);

  const summary = getDeterministicDailySummary({ ...counts, skipped });

  await db.outreachDailyReport.update({
    where: { id: report.id },
    data: { summary },
  });

  const html = await renderDailyOutreachEmail({
    userName: campaign.user.name,
    reportDate: formatUtcDate(dayKey),
    summary,
    counts: { ...counts, skipped },
    attempts: reportAttempts,
    dashboardUrl: getDashboardUrl(),
  });

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: getResendFrom(),
        to: campaign.user.email,
        subject: `ApplyFast outreach report — ${formatUtcDate(dayKey)}`,
        html,
        tags: [{ name: "outreach_report_id", value: report.id }],
      },
      { idempotencyKey },
    );

    if (error) {
      await db.outreachDailyReport.updateMany({
        where: { id: report.id, status: "SENDING" },
        data: { status: "FAILED", failureReason: error.message },
      });
      return;
    }
    if (!data?.id) {
      await db.outreachDailyReport.updateMany({
        where: { id: report.id, status: "SENDING" },
        data: {
          status: "UNKNOWN",
          failureReason: "Resend returned no message ID for the daily report.",
        },
      });
      return;
    }
    await db.outreachDailyReport.updateMany({
      where: { id: report.id, status: "SENDING" },
      data: {
        status: "ACCEPTED",
        providerMessageId: data.id,
        acceptedAt: new Date(),
      },
    });
  } catch (error) {
    await db.outreachDailyReport.updateMany({
      where: { id: report.id, status: "SENDING" },
      data: {
        status: "UNKNOWN",
        failureReason: `Daily report delivery outcome is unknown: ${errorMessage(error)}`,
      },
    });
  }
}

export async function retryDailyReport(
  reportId: string,
  userId: string,
  confirmUnknown: boolean,
): Promise<void> {
  const report = await db.outreachDailyReport.findFirst({
    where: { id: reportId, userId },
    select: {
      campaignId: true,
      reportDate: true,
      status: true,
      lastAttemptAt: true,
    },
  });
  if (!report) throw new Error("Daily report not found.");
  if (report.status === "UNKNOWN" && !confirmUnknown) {
    throw new Error("Confirm that you checked Resend before retrying an uncertain report.");
  }
  if (
    report.status === "UNKNOWN" &&
    report.lastAttemptAt &&
    Date.now() - report.lastAttemptAt.getTime() > 23 * 60 * 60 * 1000
  ) {
    throw new Error(
      "The safe Resend idempotency window may have expired. Check Resend and do not automatically retry this report.",
    );
  }
  if (report.status !== "FAILED" && report.status !== "UNKNOWN") {
    throw new Error("Only failed or explicitly confirmed uncertain reports can be retried.");
  }
  await deliverDailyReport(
    report.campaignId,
    userId,
    report.reportDate,
    true,
  );
  const result = await db.outreachDailyReport.findUnique({
    where: { id: reportId },
    select: { status: true, failureReason: true },
  });
  if (result?.status !== "ACCEPTED" && result?.status !== "DELIVERED") {
    throw new Error(result?.failureReason ?? "The report is already processing.");
  }
}

export async function processDailyOutreach(now = new Date()): Promise<{
  campaigns: number;
  accepted: number;
  failed: number;
  unknown: number;
  reportErrors: number;
}> {
  const campaigns = await db.outreachCampaign.findMany({
    include: { user: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  const totals = {
    campaigns: campaigns.length,
    accepted: 0,
    failed: 0,
    unknown: 0,
    reportErrors: 0,
  };

  for (const campaign of campaigns) {
    if (campaign.enabled) {
      try {
        const result = await processOutreachCampaign(campaign.id, campaign.user.id, now);
        totals.accepted += result.accepted;
        totals.failed += result.failed;
        totals.unknown += result.unknown;
      } catch (error) {
        totals.failed++;
        console.error("[Outreach] Campaign processing failed.", {
          campaignId: campaign.id,
          error,
        });
      }
    } else {
      try {
        await syncOutreachRecipients(campaign.id, campaign.user.id);
      } catch (error) {
        totals.failed++;
        console.error("[Outreach] Recipient synchronization failed.", {
          campaignId: campaign.id,
          error,
        });
      }
    }

    try {
      await deliverDailyReport(campaign.id, campaign.user.id, now);
    } catch (error) {
      totals.reportErrors++;
      console.error("[Outreach] Daily report processing failed.", {
        campaignId: campaign.id,
        error,
      });
    }
  }

  return totals;
}
