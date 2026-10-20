import { Prisma, type ApplicationStatus } from '@prisma/client';
import { Webhook } from 'svix';
import { db } from '@/lib/db';

const STATUS_RANK: Record<ApplicationStatus, number> = {
  scheduled: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  delivery_delayed: 5,
  bounced: 6,
  complained: 6,
  failed: 6,
  cancelled: 6,
};

const EVENT_TO_STATUS: Record<string, ApplicationStatus> = {
  'email.scheduled': 'scheduled',
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delivery_delayed',
  'email.failed': 'failed',
};

const SENT_OR_LATER_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  'sent',
  'delivered',
  'opened',
  'clicked',
  'delivery_delayed',
]);

type OutreachEventStatus = "ACCEPTED" | "DELIVERED" | "FAILED";
type OutreachReportEventStatus = "ACCEPTED" | "DELIVERED" | "FAILED";

const EVENT_TO_OUTREACH_STATUS: Record<string, OutreachEventStatus> = {
  "email.sent": "ACCEPTED",
  "email.delivered": "DELIVERED",
  "email.bounced": "FAILED",
  "email.complained": "FAILED",
  "email.failed": "FAILED",
  "email.delivery_delayed": "ACCEPTED",
};

const EVENT_TO_REPORT_STATUS: Record<string, OutreachReportEventStatus> = {
  "email.sent": "ACCEPTED",
  "email.delivered": "DELIVERED",
  "email.bounced": "FAILED",
  "email.complained": "FAILED",
  "email.failed": "FAILED",
};

const OUTREACH_STATUS_RANK: Record<OutreachEventStatus, number> = {
  ACCEPTED: 2,
  DELIVERED: 3,
  FAILED: 4,
};

const REPORT_STATUS_RANK: Record<OutreachReportEventStatus, number> = {
  ACCEPTED: 2,
  DELIVERED: 3,
  FAILED: 4,
};

type ResendWebhookEvent = {
  type: string;
  data?: {
    email_id?: string;
    tags?: Array<{ name?: string; value?: string }>;
  };
};

function isDuplicateEvent(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(req: Request) {
  const payload = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Resend] Webhook secret is not configured.");
    return new Response("Webhook is not configured", { status: 503 });
  }

  const wh = new Webhook(secret);
  let event: ResendWebhookEvent;

  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const { type, data } = event;
  const emailId = data?.email_id;
  const attemptId = data?.tags?.find((tag) => tag.name === "outreach_attempt_id")?.value;
  const reportId = data?.tags?.find((tag) => tag.name === "outreach_report_id")?.value;
  const newStatus = EVENT_TO_STATUS[type];
  const outreachStatus = EVENT_TO_OUTREACH_STATUS[type];
  const reportStatus = EVENT_TO_REPORT_STATUS[type];

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { id: svixId, type } });

      if (emailId && newStatus) {
        const application = await tx.application.findUnique({
          where: { resendEmailId: emailId },
        });

        if (
          application &&
          STATUS_RANK[newStatus] >= STATUS_RANK[application.status]
        ) {
          await tx.application.update({
            where: { resendEmailId: emailId },
            data: {
              status: newStatus,
              ...(SENT_OR_LATER_STATUSES.has(newStatus) && !application.sentAt
                ? { sentAt: new Date() }
                : {}),
            },
          });
        }
      }

      if ((emailId || attemptId) && outreachStatus) {
        const attempt = await tx.outreachSendAttempt.findFirst({
          where: {
            OR: [
              ...(emailId ? [{ providerMessageId: emailId }] : []),
              ...(attemptId ? [{ id: attemptId }] : []),
            ],
          },
          include: { recipient: { select: { id: true, status: true } } },
        });

        const failedBySuppression =
          outreachStatus === "FAILED" &&
          (type === "email.bounced" || type === "email.complained");
        const currentRank =
          attempt?.status === "DELIVERED"
            ? OUTREACH_STATUS_RANK.DELIVERED
            : attempt?.status === "FAILED"
              ? OUTREACH_STATUS_RANK.FAILED
              : attempt?.status === "ACCEPTED"
                ? OUTREACH_STATUS_RANK.ACCEPTED
                : 0;

        if (
          attempt &&
          OUTREACH_STATUS_RANK[outreachStatus] >
            currentRank ||
          (attempt && failedBySuppression)
        ) {
          const failureReason = failedBySuppression
            ? type === "email.bounced"
              ? "Resend reported a bounce."
              : "Resend reported a complaint."
            : outreachStatus === "FAILED"
              ? "Resend reported an email failure."
              : null;

          await tx.outreachSendAttempt.update({
            where: { id: attempt.id },
            data: {
              status: outreachStatus,
              providerMessageId: emailId ?? undefined,
              failureReason,
              completedAt: new Date(),
            },
          });
          await tx.outreachRecipient.update({
            where: { id: attempt.recipient.id },
            data: failedBySuppression
              ? {
                  status: "SKIPPED",
                  skipReason: failureReason,
                  lastError: failureReason,
                }
              : {
                  status: outreachStatus,
                  lastError: failureReason,
                },
          });
        }
      }

      if ((emailId || reportId) && reportStatus) {
        const report = await tx.outreachDailyReport.findFirst({
          where: {
            OR: [
              ...(emailId ? [{ providerMessageId: emailId }] : []),
              ...(reportId ? [{ id: reportId }] : []),
            ],
          },
        });
        const currentRank =
          report?.status === "DELIVERED"
            ? REPORT_STATUS_RANK.DELIVERED
            : report?.status === "FAILED"
              ? REPORT_STATUS_RANK.FAILED
              : report?.status === "ACCEPTED"
                ? REPORT_STATUS_RANK.ACCEPTED
                : 0;
        if (report && REPORT_STATUS_RANK[reportStatus] > currentRank) {
          await tx.outreachDailyReport.update({
            where: { id: report.id },
            data: {
              status: reportStatus,
              providerMessageId: emailId ?? undefined,
              acceptedAt: reportStatus === "FAILED" ? undefined : report.acceptedAt ?? new Date(),
              failureReason:
                reportStatus === "FAILED"
                  ? `Resend reported ${type.replace("email.", "")} for the daily report.`
                  : null,
            },
          });
        }
      }
    });
  } catch (error) {
    if (isDuplicateEvent(error)) {
      return new Response("Already processed", { status: 200 });
    }
    console.error("[Resend] Webhook processing failed.", error);
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response('OK', { status: 200 });
}